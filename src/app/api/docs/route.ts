import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    // Read the OpenAPI spec file (root-level openapi.yaml)
    const openApiPath = join(process.cwd(), 'openapi.yaml');
    const openApiContent = readFileSync(openApiPath, 'utf8');

    // Optional: allow users to download the YAML when explicitly requested
    if (format === 'yaml') {
      return new NextResponse(openApiContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/yaml',
          'Content-Disposition': 'attachment; filename="waternity-api.yaml"',
        },
      });
    }

    // Otherwise, render a rich docs page with hero + overview + embedded Swagger UI
    const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <title>Waternity API Documentation</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
      :root { --bg1: #4f46e5; --bg2: #7c3aed; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #f1f5f9; }
      .hero { background: linear-gradient(135deg, var(--bg1), var(--bg2)); color: #fff; padding: 56px 24px; position: relative; overflow: hidden; }
      .container { max-width: 1120px; margin: 0 auto; }
      .hero h1 { margin: 0; font-size: 40px; font-weight: 700; letter-spacing: -0.02em; }
      .hero p { margin: 12px 0 0; opacity: .95; font-size: 16px; }
      .cta-row { margin-top: 20px; display: flex; gap: 12px; flex-wrap: wrap; }
      .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 10px; text-decoration: none; font-weight: 600; }
      .btn-primary { background: #fff; color: #1e293b; }
      .btn-plain { background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,.2); }
      .grid { display: grid; gap: 16px; grid-template-columns: repeat(4, minmax(0, 1fr)); padding: 24px; }
      .card { background: #fff; border-radius: 14px; padding: 18px; border: 1px solid #e2e8f0; box-shadow: 0 8px 20px rgba(2,6,23,0.04); }
      .card h3 { margin: 0 0 8px; font-size: 15px; display: flex; align-items: center; gap: 8px; }
      .card p { margin: 0; font-size: 13px; color: #475569; }
      .sections { display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; padding: 0 24px 24px; }
      .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
      .endpoint { display: grid; grid-template-columns: 70px 1fr auto; gap: 10px; align-items: center; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; }
      .badge { font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 700; }
      .m-post { background: #fee2e2; color: #991b1b; }
      .m-get { background: #dcfce7; color: #14532d; }
      .muted { color: #64748b; font-size: 12px; }
      .swagger-wrap { margin: 24px; background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 8px; box-shadow: 0 12px 28px rgba(2,6,23,0.05); }
      /* Hide Swagger UI topbar and long URL display */
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .url { display: none; }
      .swagger-ui .scheme-container { display: none; }
      @media (max-width: 960px) { .grid { grid-template-columns: repeat(2,1fr); } .sections { grid-template-columns: 1fr; } }
      @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <section class="hero">
      <div class="container">
        <h1>Waternity API</h1>
        <p>Transparent water sales and settlement platform built on Hedera Hashgraph</p>
        <div class="cta-row">
          <a class="btn btn-primary" href="#interactive-docs">Open Interactive Docs</a>
          <a class="btn btn-plain" href="?format=yaml">Download YAML</a>
        </div>
      </div>
    </section>

    <div class="container">
      <div class="grid">
        <div class="card"><h3>🔐 Secure Authentication</h3><p>Cookie-based/JWT authentication with web-based access control</p></div>
        <div class="card"><h3>🌿 Hedera Integration</h3><p>Built on Hedera Consensus Service for immutable audit trails</p></div>
        <div class="card"><h3>🔎 Full Transparency</h3><p>HashScan and Mirror Node links for on-chain verification</p></div>
        <div class="card"><h3>📡 Real-time Monitoring</h3><p>Live well telemetry and automated settlement processing</p></div>
      </div>

      <div class="sections">
        <div class="card">
          <h3>📚 API Endpoints</h3>
          <ul class="list">
            <li class="endpoint"><span class="badge m-post">POST</span><code>/api/auth/login</code><span class="muted">Login with username and password</span></li>
            <li class="endpoint"><span class="badge m-post">POST</span><code>/api/auth/logout</code><span class="muted">Clear session and revoke token</span></li>
            <li class="endpoint"><span class="badge m-get">GET</span><code>/api/auth/me</code><span class="muted">Get current user (Auth required)</span></li>
          </ul>
        </div>
        <div class="card">
          <h3>🧾 Documentation</h3>
          <p class="muted">OpenAPI 3.1 specification with models, responses and authentication details. Try-it-out is enabled for quick testing.</p>
          <ul class="list" style="margin-top: 8px;">
            <li>• Auth via HTTP-only cookie / Bearer JWT</li>
            <li>• Roles: Investor, Operator, Admin</li>
            <li>• Hedera references for transaction proofs</li>
          </ul>
        </div>
      </div>

      <div class="swagger-wrap" id="interactive-docs">
        <div id="swagger-ui"></div>
      </div>
    </div>

    <!-- Swagger UI (Bundle + Standalone Preset) -->
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
      // Load YAML, parse to JSON, and pass as spec to SwaggerUI to avoid ugly data: URL
      fetch(window.location.pathname + '?format=yaml')
        .then(function(r){ return r.text(); })
        .then(function(specYaml){
          var specObject = jsyaml.load(specYaml);
          window.ui = SwaggerUIBundle({
            spec: specObject,
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis
            ],
            layout: 'BaseLayout',
            tryItOutEnabled: true,
            displayRequestDuration: true,
            docExpansion: 'none',
            defaultModelExpandDepth: 0,
            defaultModelsExpandDepth: -1,
            showExtensions: true,
            showCommonExtensions: true
          });
        });
    </script>

    <script>
      // Lightweight footer for attribution
      document.addEventListener('DOMContentLoaded', function(){
        var cont = document.querySelector('.container');
        var footer = document.createElement('div');
        footer.style.cssText = 'text-align:center;color:#64748b;font-size:12px;padding:20px 0 40px';
        footer.innerHTML = 'Built with ❤️ for Hedera Hackathon Africa 2024 · Waternity';
        cont.appendChild(footer);
      });
    </script>
  </body>
</html>`;

    return new NextResponse(htmlContent, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error: any) {
    console.error('Error serving API documentation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load API documentation', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS (if accessed cross-origin)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}