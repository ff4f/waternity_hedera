import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// removed unused Tabs imports
import {
  Droplets,
  Shield,
  FileText,
  Zap,
  Eye,
  BarChart3,
  Download,
  Lock,
  Clock,
  Globe
} from 'lucide-react';

const ApiDocsPage: React.FC = () => {
  const apiEndpoints = [
    {
      method: 'POST',
      path: '/api/auth/login',
      description: 'User login with username and password',
      tag: 'Authentication'
    },
    {
      method: 'POST', 
      path: '/api/auth/logout',
      description: 'User logout and session cleanup',
      tag: 'Authentication'
    },
    {
      method: 'GET',
      path: '/api/auth/me',
      description: 'Get current user profile',
      tag: 'Authentication',
      authRequired: true
    },
    {
      method: 'GET',
      path: '/projects',
      description: 'List all water infrastructure projects',
      tag: 'Projects'
    },
    {
      method: 'POST',
      path: '/projects',
      description: 'Create new water infrastructure project',
      tag: 'Projects',
      authRequired: true
    },
    {
      method: 'GET',
      path: '/projects/{projectId}',
      description: 'Get project details including milestones and investments',
      tag: 'Projects'
    },
    {
      method: 'POST',
      path: '/investments',
      description: 'Create investment in project by purchasing tokens',
      tag: 'Investments',
      authRequired: true
    },
    {
      method: 'GET',
      path: '/investments/portfolio/{accountId}',
      description: 'Get user investment portfolio',
      tag: 'Investments',
      authRequired: true
    },
    {
      method: 'GET',
      path: '/wells',
      description: 'List all water wells',
      tag: 'Wells'
    },
    {
      method: 'POST',
      path: '/wells',
      description: 'Create new water well',
      tag: 'Wells',
      authRequired: true
    },
    {
      method: 'POST',
      path: '/kiosks/{kioskId}/valve',
      description: 'Control valve (open/close)',
      tag: 'Operations',
      authRequired: true
    },
    {
      method: 'GET',
      path: '/settlements',
      description: 'List revenue settlements',
      tag: 'Settlements'
    },
    {
      method: 'POST',
      path: '/settlements/calculate',
      description: 'Calculate settlement for specific period',
      tag: 'Settlements',
      authRequired: true
    },
    {
      method: 'POST',
      path: '/hcs/message',
      description: 'Submit audit message to HCS topic',
      tag: 'HCS'
    },
    {
      method: 'GET',
      path: '/health',
      description: 'System health check and Hedera connection status',
      tag: 'System'
    }
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-red-100 text-red-800';
      case 'PUT': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Droplets className="h-12 w-12 mr-3" />
            <h1 className="text-4xl font-bold">Waternity API</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Transparent water sales and settlement platform built on Hedera Hashgraph
          </p>
          <div className="mt-6">
            <Button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2">
              <Download className="h-4 w-4 mr-2" />
              Download YAML
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">🔒 Secure Authentication</h3>
              <p className="text-sm text-gray-600">
                Cookie-based JWT authentication with role-based access control
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Zap className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">⚡ Hedera Integration</h3>
              <p className="text-sm text-gray-600">
                Built on Hedera Consensus Service for immutable audit trails
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Eye className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">🔍 Full Transparency</h3>
              <p className="text-sm text-gray-600">
                HashScan and Mirror Node links for complete verification
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <BarChart3 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">📊 Real-time Monitoring</h3>
              <p className="text-sm text-gray-600">
                Live well monitoring and automated settlement processing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* API Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                🔗 API Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {apiEndpoints.map((endpoint, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge className={getMethodColor(endpoint.method)}>
                        {endpoint.method}
                      </Badge>
                      <div>
                        <div className="font-mono text-sm">{endpoint.path}</div>
                        <div className="text-xs text-gray-500">{endpoint.description}</div>
                      </div>
                    </div>
                    {endpoint.authRequired && (
                      <Badge className="bg-pink-100 text-pink-800">
                        Auth Required
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documentation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                📋 Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Complete OpenAPI 3.1 specification with detailed schemas, examples, and authentication information.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Authentication</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Cookie-based authentication using httpOnly JWT tokens:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Cookie name: wty_sess</li>
                    <li>• Expiry: 8 hours</li>
                    <li>• Attributes: HttpOnly, Secure, SameSite=Lax</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Hedera</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Built on Hedera Hashgraph for transparent and tamper-proof records:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Consensus Service for audit logging</li>
                    <li>• Mirror Node for historical data access</li>
                    <li>• HashScan for transaction verification</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">System</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Modern architecture designed for scalability and reliability:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Role-based access control</li>
                    <li>• Secure API with rate limiting</li>
                    <li>• Structured logging and monitoring</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                API Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="font-medium">API Version</div>
                  <div className="text-gray-500">1.0.0</div>
                </div>
                <div>
                  <div className="font-medium">OpenAPI</div>
                  <div className="text-gray-500">3.1.0</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                License
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="font-medium">MIT License</div>
                  <div className="text-gray-500">Open source</div>
                </div>
                <div>
                  <div className="font-medium">Contact</div>
                  <div className="text-gray-500">dev@waternity.io</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="font-medium">Uptime</div>
                  <div className="text-gray-500">99.95%</div>
                </div>
                <div>
                  <div className="font-medium">Latency</div>
                  <div className="text-gray-500">120ms</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;