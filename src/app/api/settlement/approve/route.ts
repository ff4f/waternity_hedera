/**
 * @deprecated Use /api/settlements/approve instead. This endpoint will be removed in a future version.
 * Thin proxy to the canonical plural endpoint.
 */

import { NextRequest } from 'next/server';
import { POST as CanonicalPOST } from '../../settlements/approve/route';

async function POST(req: NextRequest) {
  // Log deprecation warning
  console.warn('[DEPRECATED] /api/settlement/approve is deprecated. Use /api/settlements/approve instead.');
  
  // Proxy to canonical plural endpoint
  return CanonicalPOST(req);
}

export { POST };