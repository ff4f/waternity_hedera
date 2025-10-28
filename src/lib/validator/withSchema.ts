import ajv, { ValidateFunction } from './ajv';

/**
 * Higher-order function that validates request body against a JSON schema
 * @param schema - JSON schema object or compiled validation function
 * @param handler - Request handler function that receives validated body
 * @returns Wrapped handler with schema validation
 */
export function withSchema<T>(
  schema: unknown,
  handler: (req: Request, body: T) => Promise<Response>
): (req: Request) => Promise<Response> {
  // Compile schema if it's not already a validation function
  const validate: ValidateFunction = typeof schema === 'function' 
    ? (schema as ValidateFunction)
    : ajv.compile(schema as object);

  return async (req: Request): Promise<Response> => {
    try {
      // Parse request body
      const body = await req.json();
      
      // Validate against schema
      const isValid = validate(body);
      
      if (!isValid) {
        return new Response(
          JSON.stringify({
            error: 'Validation failed',
            details: validate.errors || []
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Call handler with validated body
      return await handler(req, body as T);
      
    } catch (error) {
      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        return new Response(
          JSON.stringify({
            error: 'Invalid JSON in request body'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Re-throw other errors
      throw error;
    }
  };
}