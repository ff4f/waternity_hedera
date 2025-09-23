import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * GET /api/docs
 * Returns HTML page with Redoc documentation and endpoint list
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    
    // If format=yaml is requested, return the raw OpenAPI YAML
    if (format === 'yaml') {
      try {
        const yamlPath = join(process.cwd(), 'openapi.yaml');
        const yamlContent = readFileSync(yamlPath, 'utf8');
        
        return new NextResponse(yamlContent, {
          status: 200,
          headers: {
            'Content-Type': 'application/yaml',
            'Content-Disposition': 'attachment; filename="openapi.yaml"',
          },
        });
      } catch (error) {
        console.error('Error reading OpenAPI YAML:', error);
        return NextResponse.json(
          { error: 'internal_error', message: 'Failed to read OpenAPI specification' },
          { status: 500 }
        );
      }
    }

    // Generate HTML documentation page
    const html = generateDocumentationHTML();
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating documentation:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to generate documentation' },
      { status: 500 }
    );
  }
}

/**
 * Generate HTML documentation page with Redoc and endpoint list
 */
function generateDocumentationHTML(): string {
  const endpoints = [
    {
      method: 'POST',
      path: '/api/auth/login',
      description: 'User login with username and password',
      auth: false,
    },
    {
      method: 'POST',
      path: '/api/auth/logout',
      description: 'User logout and session cleanup',
      auth: false,
    },
    {
      method: 'GET',
      path: '/api/auth/me',
      description: 'Get current user profile',
      auth: true,
    },
    {
      method: 'POST',
      path: '/api/hcs/events',
      description: 'Submit event to Hedera Consensus Service',
      auth: true,
    },
    {
      method: 'GET',
      path: '/api/wells',
      description: 'List all water wells (public)',
      auth: false,
    },
    {
      method: 'GET',
      path: '/api/wells/{id}/events',
      description: 'Get events for a specific well',
      auth: false,
    },
    {
      method: 'POST',
      path: '/api/settlements/request',
      description: 'Request a new settlement (OPERATOR only)',
      auth: true,
    },
    {
      method: 'POST',
      path: '/api/settlements/approve',
      description: 'Approve a settlement (AGENT only)',
      auth: true,
    },
    {
      method: 'POST',
      path: '/api/settlements/execute',
      description: 'Execute an approved settlement (AGENT only)',
      auth: true,
    },
    {
      method: 'POST',
      path: '/api/documents/anchor',
      description: 'Anchor document to Hedera File Service (AGENT only)',
      auth: true,
    },
    {
      method: 'GET',
      path: '/api/audit/reports',
      description: 'Get audit reports (public)',
      auth: false,
    },
    {
      method: 'GET',
      path: '/api/meta/links',
      description: 'Get verification links for HashScan and Mirror Node',
      auth: false,
    },
    {
      method: 'GET',
      path: '/api/health',
      description: 'Health check endpoint',
      auth: false,
    },
    {
      method: 'GET',
      path: '/api/docs',
      description: 'API documentation (this page)',
      auth: false,
    },
  ];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Waternity API Documentation</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a202c;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .header {
      text-align: center;
      margin-bottom: 3rem;
      color: white;
    }
    
    .header h1 {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 1rem;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .header p {
      font-size: 1.2rem;
      opacity: 0.9;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 3rem;
    }
    
    @media (max-width: 768px) {
      .content {
        grid-template-columns: 1fr;
      }
    }
    
    .card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    }
    
    .card h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #2d3748;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .icon {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    
    .endpoints-list {
      list-style: none;
    }
    
    .endpoint {
      display: flex;
      align-items: center;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      border-radius: 8px;
      background: #f7fafc;
      border-left: 4px solid #e2e8f0;
      transition: all 0.2s ease;
    }
    
    .endpoint:hover {
      background: #edf2f7;
      border-left-color: #667eea;
    }
    
    .method {
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      text-transform: uppercase;
      margin-right: 1rem;
      min-width: 60px;
      text-align: center;
    }
    
    .method.get {
      background: #c6f6d5;
      color: #22543d;
    }
    
    .method.post {
      background: #fed7d7;
      color: #742a2a;
    }
    
    .endpoint-info {
      flex: 1;
    }
    
    .endpoint-path {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-weight: 500;
      color: #2d3748;
      margin-bottom: 0.25rem;
    }
    
    .endpoint-desc {
      font-size: 0.875rem;
      color: #718096;
    }
    
    .auth-badge {
      background: #fbb6ce;
      color: #97266d;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      margin-left: 0.5rem;
    }
    
    .download-section {
      text-align: center;
      margin-top: 2rem;
    }
    
    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: white;
      color: #667eea;
      padding: 1rem 2rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    
    .download-btn:hover {
      background: #667eea;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }
    
    .redoc-container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      margin-top: 2rem;
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .feature {
      background: rgba(255,255,255,0.1);
      padding: 1.5rem;
      border-radius: 8px;
      color: white;
      text-align: center;
    }
    
    .feature h3 {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .feature p {
      font-size: 0.9rem;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌊 Waternity API</h1>
      <p>Transparent water sales and settlement platform built on Hedera Hashgraph</p>
    </div>
    
    <div class="features">
      <div class="feature">
        <h3>🔐 Secure Authentication</h3>
        <p>Cookie-based JWT authentication with role-based access control</p>
      </div>
      <div class="feature">
        <h3>⚡ Hedera Integration</h3>
        <p>Built on Hedera Consensus Service for immutable audit trails</p>
      </div>
      <div class="feature">
        <h3>🔍 Full Transparency</h3>
        <p>HashScan and Mirror Node links for complete verification</p>
      </div>
      <div class="feature">
        <h3>📊 Real-time Monitoring</h3>
        <p>Live well monitoring and automated settlement processing</p>
      </div>
    </div>
    
    <div class="content">
      <div class="card">
        <h2>
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 1.16-.21 2.31-.48 3.38-.84C16.5 26.48 18.29 26 20 25.16 21.16 24.52 22 23.16 22 21.5V7l-10-5z"/>
          </svg>
          API Endpoints
        </h2>
        <ul class="endpoints-list">
          ${endpoints.map(endpoint => `
            <li class="endpoint">
              <span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
              <div class="endpoint-info">
                <div class="endpoint-path">${endpoint.path}</div>
                <div class="endpoint-desc">${endpoint.description}</div>
              </div>
              ${endpoint.auth ? '<span class="auth-badge">Auth Required</span>' : ''}
            </li>
          `).join('')}
        </ul>
      </div>
      
      <div class="card">
        <h2>
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          Documentation
        </h2>
        <p style="margin-bottom: 1.5rem; color: #718096;">
          Complete OpenAPI 3.1 specification with detailed schemas, examples, and authentication information.
        </p>
        
        <div style="margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; color: #2d3748;">Authentication</h3>
          <p style="font-size: 0.9rem; color: #718096; margin-bottom: 0.5rem;">Cookie-based authentication using httpOnly JWT tokens:</p>
          <ul style="font-size: 0.85rem; color: #718096; margin-left: 1rem;">
            <li>Cookie name: <code style="background: #f7fafc; padding: 0.125rem 0.25rem; border-radius: 3px;">wty_sess</code></li>
            <li>Expiry: 8 hours</li>
            <li>Attributes: HttpOnly, Secure, SameSite=Lax</li>
          </ul>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; color: #2d3748;">User Roles</h3>
          <ul style="font-size: 0.85rem; color: #718096; margin-left: 1rem;">
            <li><strong>INVESTOR:</strong> View settlements and invest in projects</li>
            <li><strong>OPERATOR:</strong> Create wells, manage operations, request settlements</li>
            <li><strong>AGENT:</strong> Approve settlements, anchor documents</li>
            <li><strong>ADMIN:</strong> Full system access</li>
          </ul>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; color: #2d3748;">Hedera Integration</h3>
          <ul style="font-size: 0.85rem; color: #718096; margin-left: 1rem;">
            <li>Consensus Service (HCS) for audit trails</li>
            <li>File Service (HFS) for document anchoring</li>
            <li>Token Service (HTS) for settlements</li>
            <li>HashScan and Mirror Node verification links</li>
          </ul>
        </div>
      </div>
    </div>
    
    <div class="download-section">
      <a href="/api/docs?format=yaml" class="download-btn">
        <svg class="icon" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>
        Download OpenAPI YAML
      </a>
    </div>
    
    <div class="redoc-container">
      <div id="redoc-container"></div>
    </div>
  </div>
  
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  <script>
    // Initialize Redoc with the OpenAPI specification
    Redoc.init('/api/docs?format=yaml', {
      scrollYOffset: 60,
      theme: {
        colors: {
          primary: {
            main: '#667eea'
          }
        },
        typography: {
          fontSize: '14px',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
      }
    }, document.getElementById('redoc-container'));
  </script>
</body>
</html>
  `.trim();
}

/**
 * Handle unsupported HTTP methods
 */
export async function POST() {
  return NextResponse.json(
    { error: 'method_not_allowed', message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'method_not_allowed', message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'method_not_allowed', message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'method_not_allowed', message: 'Method not allowed' },
    { status: 405 }
  );
}