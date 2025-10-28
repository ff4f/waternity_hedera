import { NextRequest, NextResponse } from 'next/server';
import { thgIdentityService } from '@/lib/identity/thg-identity-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const subjectId = searchParams.get('subjectId');

    switch (action) {
      case 'getCredentials':
        if (!subjectId) {
          return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
        }
        const credentials = await thgIdentityService.getCredentialsForSubject(subjectId);
        return NextResponse.json({ credentials });

      case 'healthCheck':
        return NextResponse.json({ 
          status: 'ok', 
          message: 'THG Identity Service is running',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Identity API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'issueWaterQuality':
        const { wellId, ph, tds, turbidity, location, certifiedBy } = body;
        const waterQualityCredential = await thgIdentityService.issueWaterQualityCredential(
          wellId, ph, tds, turbidity, location, certifiedBy
        );
        return NextResponse.json({ credential: waterQualityCredential });

      case 'issueConservation':
        const { participantId, waterSaved, conservationMethod, period, verifiedBy } = body;
        const conservationCredential = await thgIdentityService.issueConservationCredential(
          participantId, waterSaved, conservationMethod, period, verifiedBy
        );
        return NextResponse.json({ credential: conservationCredential });

      case 'issueWellOperator':
        const { operatorId, wellId: opWellId, certificationLevel, skills, validityMonths } = body;
        const operatorCredential = await thgIdentityService.issueWellOperatorCredential(
          operatorId, opWellId, certificationLevel, skills, validityMonths
        );
        return NextResponse.json({ credential: operatorCredential });

      case 'verifyCredential':
        const { credential } = body;
        const isValid = await thgIdentityService.verifyCredential(credential);
        return NextResponse.json({ isValid });

      case 'revokeCredential':
        const { credentialId, reason } = body;
        await thgIdentityService.revokeCredential(credentialId, reason);
        return NextResponse.json({ success: true });

      case 'generatePresentation':
        const { credentials, challenge, domain } = body;
        const presentation = await thgIdentityService.generatePresentation(credentials, challenge, domain);
        return NextResponse.json({ presentation });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Identity API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}