import { NextRequest, NextResponse } from 'next/server';
import { validateSchema } from './ajv';
import { v4 as uuidv4, validate as validateUUID } from 'uuid';

interface ValidationError {
  path: string;
  msg: string;
  keyword: string;
}

interface ValidationErrorResponse {
  error: 'validation';
  details: ValidationError[];
}

type RouteHandler = (req: NextRequest, context?: any) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function to wrap route handlers with schema validation
 * @param schemaId - The schema ID to validate against
 * @param handler - The route handler function
 * @returns Wrapped handler with validation
 */
export function withSchema(schemaId: string, handler: RouteHandler) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Only validate for POST, PUT, PATCH methods
      if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
        return handler(req, context);
      }

      // Parse request body
      let body: any;
      try {
        const text = await req.text();
        body = text ? JSON.parse(text) : {};
      } catch (parseError) {
        return NextResponse.json(
          {
            error: 'validation',
            details: [{
              path: 'body',
              msg: 'Invalid JSON format',
              keyword: 'format'
            }]
          } as ValidationErrorResponse,
          { status: 400 }
        );
      }

      // Validate Idempotency-Key header or messageId in body
      const idempotencyKey = req.headers.get('idempotency-key') || body.messageId;
      if (idempotencyKey) {
        if (!validateUUID(idempotencyKey)) {
          return NextResponse.json(
            {
              error: 'validation',
              details: [{
                path: idempotencyKey === req.headers.get('idempotency-key') ? 'headers.idempotency-key' : 'body.messageId',
                msg: 'Must be a valid UUIDv4',
                keyword: 'format'
              }]
            } as ValidationErrorResponse,
            { status: 400 }
          );
        }
      }

      // Validate request body against schema
      const validation = validateSchema(schemaId, body);
      if (!validation.valid) {
        const details: ValidationError[] = validation.errors.map(error => ({
          path: error.instancePath || error.schemaPath || 'unknown',
          msg: error.message || 'Validation failed',
          keyword: error.keyword || 'unknown'
        }));

        return NextResponse.json(
          {
            error: 'validation',
            details
          } as ValidationErrorResponse,
          { status: 400 }
        );
      }

      // Create new request with parsed body
      const newReq = new NextRequest(req.url, {
        method: req.method,
        headers: req.headers,
        body: JSON.stringify(body)
      });

      // Add parsed body to request for easy access
      (newReq as any).parsedBody = body;
      (newReq as any).idempotencyKey = idempotencyKey;

      return handler(newReq, context);
    } catch (error) {
      console.error('Schema validation error:', error);
      return NextResponse.json(
        {
          error: 'validation',
          details: [{
            path: 'internal',
            msg: 'Internal validation error',
            keyword: 'internal'
          }]
        } as ValidationErrorResponse,
        { status: 500 }
      );
    }
  };
}

/**
 * Extract parsed body from request (added by withSchema)
 */
export function getParsedBody(req: NextRequest): any {
  return (req as any).parsedBody;
}

/**
 * Extract idempotency key from request (added by withSchema)
 */
export function getIdempotencyKey(req: NextRequest): string | undefined {
  return (req as any).idempotencyKey;
}