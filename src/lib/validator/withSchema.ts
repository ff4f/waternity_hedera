import { NextRequest } from 'next/server';
import { ajv } from './ajv';
import { JSONSchemaType } from 'ajv';

/**
 * Higher-order function wrapper for schema validation
 * Parses JSON body once, validates against schema, and calls handler with validated data
 */
export function withSchema<T>(
  schema: JSONSchemaType<T> | object,
  handler: (req: NextRequest, res: any, body: T) => Promise<Response>
) {
  return async (req: NextRequest, res?: any): Promise<Response> => {
    try {
      // Parse JSON body once
      let body: any;
      try {
        const text = await req.text();
        if (!text.trim()) {
          return new Response(
          JSON.stringify({ error: 'Validation failed', details: ['Request body is required'] }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
        }
        body = JSON.parse(text);
      } catch (parseError) {
        return new Response(
          JSON.stringify({ error: 'Validation failed', details: ['Invalid JSON format'] }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Validate against schema
      const validate = ajv.compile(schema);
      const valid = validate(body);

      if (!valid) {
        const details = validate.errors?.map(error => {
          const path = error.instancePath || error.schemaPath || '';
          const message = error.message || 'Validation failed';
          return `${path}: ${message}`;
        }) || ['Validation failed'];

        return new Response(
          JSON.stringify({ error: 'Validation failed', details }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Call handler with validated body
      return await handler(req, res, body as T);
    } catch (error) {
      console.error('withSchema error:', error);
      return new Response(
        JSON.stringify({ error: 'internal_server_error', details: ['An unexpected error occurred'] }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

/**
 * Utility function to validate data against a schema without the HTTP wrapper
 */
export function validateData<T>(schema: JSONSchemaType<T> | object, data: any): {
  valid: boolean;
  errors?: string[];
  data?: T;
} {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    const errors = validate.errors?.map(error => {
      const path = error.instancePath || error.schemaPath || '';
      const message = error.message || 'Validation failed';
      return `${path}: ${message}`;
    }) || ['Validation failed'];

    return { valid: false, errors };
  }

  return { valid: true, data: data as T };
}