import { NextRequest } from 'next/server';
import { JSONSchemaType } from 'ajv';
import { ensureIdempotent } from '../idempotency/store';
import { sha256Hex } from '../hash';
import ajv, { ValidateFunction } from './ajv';

// Maximum payload size: 2MB
const MAX_PAYLOAD_SIZE = 2 * 1024 * 1024; // 2MB in bytes

function safeStringify(value: unknown): string {
  return JSON.stringify(value, (key, val) => (typeof val === 'bigint' ? val.toString() : val as unknown));
}

/**
 * Higher-order function that combines schema validation and idempotency
 * Ensures that mutating operations are idempotent and validated
 * Rejects payloads > 2MB with 413 status
 */
export function withSchemaAndIdempotency<T>(
  schema: JSONSchemaType<T> | object,
  handler: (req: NextRequest, res: unknown, body: T) => Promise<Response>
) {
  // Compile schema if it's not already a validation function
  const validate: ValidateFunction = typeof schema === 'function' 
    ? (schema as ValidateFunction)
    : ajv.compile(schema as object);

  return async (req: Request): Promise<Response> => {
    try {
      // Check Content-Length header first for efficiency
      const contentLength = req.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
        return new Response(
          JSON.stringify({
            error: 'payload_too_large',
            message: 'Request payload exceeds maximum size of 2MB',
            details: [`Payload size: ${contentLength} bytes, Maximum allowed: ${MAX_PAYLOAD_SIZE} bytes`]
          }),
          { status: 413, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Parse request body and check actual size
      const bodyText = await req.text();
      const bodySize = new TextEncoder().encode(bodyText).length;
      
      if (bodySize > MAX_PAYLOAD_SIZE) {
        return new Response(
          JSON.stringify({
            error: 'payload_too_large',
            message: 'Request payload exceeds maximum size of 2MB',
            details: [`Payload size: ${bodySize} bytes, Maximum allowed: ${MAX_PAYLOAD_SIZE} bytes`]
          }),
          { status: 413, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Parse JSON
      let body: T;
      try {
        body = JSON.parse(bodyText) as T;
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'invalid_json',
            message: 'Invalid JSON in request body',
            details: [(error as Error).message]
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Validate against schema
      const isValid = validate(body);
      if (!isValid) {
        return new Response(
          JSON.stringify({
            error: 'validation_failed',
            message: 'Request body validation failed',
            details: validate.errors || []
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Extract idempotency key from header or body
      const headers = Object.fromEntries(req.headers.entries());
      const idempotencyKey = (headers as Record<string, string>)['idempotency-key'] || (body as unknown as { messageId?: string })?.messageId;
      
      if (!idempotencyKey) {
        return new Response(
          JSON.stringify({ 
            error: 'missing_idempotency_key',
            message: 'Idempotency key is required',
            details: ['Idempotency-Key header or messageId in body is required'] 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Get scope from pathname
      const url = new URL(req.url);
      const scope = url.pathname.replace(/^\//g, '').replace(/\//g, '_');

      // Compute payload hash from validated body
      const payloadHash = sha256Hex(safeStringify(body));

      // Use ensureIdempotent to handle the operation
      const result = await ensureIdempotent(
        idempotencyKey,
        scope,
        payloadHash,
        async () => {
          // Execute the handler
          const response = await handler(req as unknown as NextRequest, null, body);
          
          // Extract the response data
          const responseText = await response.text();
          let responseData: unknown;
          try {
            responseData = JSON.parse(responseText);
          } catch {
            responseData = responseText;
          }
          
          return {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            data: responseData
          } as { status: number; headers: Record<string, string>; data: unknown };
        }
      );

      if (result.reused) {
        // Return cached result with reused indicator
        const cachedResponse = result.result as { status: number; headers: Record<string, string>; data: unknown };
        const responseData = typeof cachedResponse.data === 'object' && cachedResponse.data !== null
          ? { ...cachedResponse.data as object, reused: true }
          : { data: cachedResponse.data, reused: true };
          
        return new Response(
          JSON.stringify(responseData),
          { 
            status: cachedResponse.status,
            headers: { ...cachedResponse.headers, 'X-Idempotency-Reused': 'true' }
          }
        );
      }

      // Return new result
      const newResponse = result.result as { status: number; headers: Record<string, string>; data: unknown };
      return new Response(
        JSON.stringify(newResponse.data),
        { 
          status: newResponse.status,
          headers: { ...newResponse.headers, 'X-Idempotency-Reused': 'false' }
        }
      );
      
    } catch (error) {
      console.error('Schema and idempotency wrapper error:', error);
      const status = (error as { status?: number })?.status === 409 ? 409 : 500;
      const payload = (error as { status?: number })?.status === 409
        ? { 
            error: 'idempotency_conflict', 
            message: 'Idempotency key conflict',
            details: ['Same idempotency key used with different payload'] 
          }
        : { 
            error: 'internal_server_error', 
            message: 'An unexpected error occurred',
            details: [(error as Error).message] 
          };
      return new Response(
        JSON.stringify(payload),
        { status, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}