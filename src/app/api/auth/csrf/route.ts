import { NextRequest, NextResponse } from 'next/server';
import { issueCsrf } from '@/lib/http/csrf';

/**
 * GET /api/auth/csrf
 * 
 * Issue a CSRF token for client-side use
 */
export async function GET() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'CSRF token issued'
    });
    
    // Issue CSRF token and set cookie
    const { token } = await issueCsrf(response);
    
    // Return token for client to use in headers
    return NextResponse.json({
      success: true,
      csrfToken: token
    }, {
      headers: response.headers
    });
  } catch (error) {
    console.error('CSRF token generation failed:', error);
    return NextResponse.json(
      {
        error: 'csrf_generation_failed',
        message: 'Failed to generate CSRF token'
      },
      { status: 500 }
    );
  }
}