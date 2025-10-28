import { NextResponse } from 'next/server';

/**
 * Standard error response shape for consistent API responses
 */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

/**
 * HTTP 400 - Bad Request
 * Used when the request is malformed or missing required parameters
 */
export function badRequest(message: string, details?: unknown): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: 'bad_request',
      message,
      details,
    },
    { status: 400 }
  );
}

/**
 * HTTP 401 - Unauthorized
 * Used when authentication is required but not provided or invalid
 */
export function unauthorized(message: string = 'Authentication required', details?: unknown): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: 'unauthorized',
      message,
      details,
    },
    { status: 401 }
  );
}

/**
 * HTTP 403 - Forbidden
 * Used when user is authenticated but lacks permission for the resource
 */
export function forbidden(message: string = 'Access denied', details?: unknown): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: 'forbidden',
      message,
      details,
    },
    { status: 403 }
  );
}

/**
 * HTTP 409 - Conflict
 * Used when the request conflicts with current state (e.g., duplicate resource)
 */
export function conflict(message: string, details?: unknown): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: 'conflict',
      message,
      details,
    },
    { status: 409 }
  );
}

/**
 * HTTP 422 - Unprocessable Entity
 * Used when request is well-formed but contains semantic errors
 */
export function unprocessable(message: string, details?: unknown): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: 'unprocessable_entity',
      message,
      details,
    },
    { status: 422 }
  );
}

/**
 * HTTP 500 - Internal Server Error
 * Used for unexpected server errors
 */
export function serverError(message: string = 'Internal server error', details?: unknown): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: 'internal_server_error',
      message,
      details,
    },
    { status: 500 }
  );
}

/**
 * Method Not Allowed (405) error response
 */
export function methodNotAllowed(message: string = 'Method not allowed', details?: unknown): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: 'method_not_allowed',
      message,
      details,
    },
    { status: 405 }
  );
}

/**
 * Not Found (404) error response
 */
export function notFound(message: string = 'Resource not found', details?: unknown): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: 'not_found',
      message,
      details,
    },
    { status: 404 }
  );
}

/**
 * Helper to create consistent error responses from caught exceptions
 */
export function handleError(error: unknown, fallbackMessage: string = 'An unexpected error occurred'): NextResponse<ErrorResponse> {
  console.error('Error occurred:', error);
  
  if (error instanceof Error) {
    return serverError(error.message, { stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  }
  
  return serverError(fallbackMessage);
}

/**
 * Type guard to check if a response is an error response
 */
export function isErrorResponse(response: unknown): response is ErrorResponse {
  if (typeof response !== 'object' || response === null) return false;
  const r = response as { error?: unknown; message?: unknown };
  return typeof r.error === 'string' && typeof r.message === 'string';
}