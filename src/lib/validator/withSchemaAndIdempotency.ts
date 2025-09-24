import { NextRequest } from 'next/server';
import { JSONSchemaType } from 'ajv';
import { withSchema } from './withSchema';
import { 
  idempotencyStore, 
  getIdempotencyKey, 
  getIdempotencyScope, 
  createResultHash 
} from '../idempotency/store';

/**
 * Higher-order function that combines schema validation and idempotency
 * Ensures that mutating operations are idempotent and validated
 */
export function withSchemaAndIdempotency<T>(
  schema: JSONSchemaType<T> | object,
  handler: (req: NextRequest, res: any, body: T) => Promise<Response>
) {
  return withSchema(schema, async (req: NextRequest, res: any, body: T): Promise<Response> => {
    try {
      // Extract idempotency key
      const headers = Object.fromEntries(req.headers.entries());
      const idempotencyKey = getIdempotencyKey(headers, body);
      
      if (!idempotencyKey) {
        return new Response(
          JSON.stringify({ 
            error: 'missing_idempotency_key', 
            details: ['Idempotency-Key header or messageId in body is required'] 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Get scope from pathname
      const url = new URL(req.url);
      const scope = getIdempotencyScope(url.pathname);

      // Check if operation already exists
      const existing = await idempotencyStore.get(idempotencyKey, scope);
      
      if (existing) {
        if (existing.status === 'PENDING') {
          // Operation is still in progress
          return new Response(
            JSON.stringify({ 
              error: 'operation_in_progress', 
              details: ['Operation with this idempotency key is still in progress'] 
            }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          );
        } else if (existing.status === 'SUCCEEDED') {
          // Check if the request body is the same by comparing hashes
          const currentBodyHash = createResultHash(body);
          if (existing.requestHash && existing.requestHash !== currentBodyHash) {
            // Different payload with same idempotency key
            return new Response(
              JSON.stringify({ 
                error: 'idempotency_key_conflict', 
                details: ['Different payload provided for existing idempotency key'] 
              }),
              { status: 409, headers: { 'Content-Type': 'application/json' } }
            );
          }
          
          // Return the cached response if available
          if (existing.result) {
            return new Response(existing.result, {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // Fallback if no response data stored
          return new Response(
            JSON.stringify({ 
              message: 'Operation already completed successfully',
              idempotencyKey 
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } else if (existing.status === 'FAILED') {
          // Previous operation failed, delete and recreate as pending
          await idempotencyStore.set(idempotencyKey, scope, 'PENDING');
        }
      } else {
        // Create new pending operation with request hash
        const requestHash = createResultHash(body);
        await idempotencyStore.set(idempotencyKey, scope, 'PENDING', requestHash);
      }

      try {
        // Execute the actual operation
        const result = await handler(req, res, body);
        
        // If successful, update idempotency record
        if (result.status >= 200 && result.status < 300) {
          const resultText = await result.text();
          const resultHash = createResultHash(JSON.parse(resultText || '{}'));
          const requestHash = createResultHash(body);
          await idempotencyStore.update(idempotencyKey, scope, 'SUCCEEDED', requestHash, resultHash, resultText);
          
          // Return the result with the same content
          return new Response(resultText, {
            status: result.status,
            headers: result.headers
          });
        } else {
          // Operation failed
          const requestHash = createResultHash(body);
          await idempotencyStore.update(idempotencyKey, scope, 'FAILED', requestHash);
          return result;
        }
      } catch (operationError) {
        // Mark operation as failed
        await idempotencyStore.update(idempotencyKey, scope, 'FAILED');
        throw operationError;
      }
    } catch (error) {
      console.error('withSchemaAndIdempotency error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return new Response(
        JSON.stringify({ 
          error: 'internal_server_error', 
          details: ['An unexpected error occurred'],
          debug: error instanceof Error ? error.message : String(error)
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  });
}