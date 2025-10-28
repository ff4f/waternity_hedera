'use client';

import { 
  DigitalCredential, 
  WaterQualityCredential, 
  ConservationCredential, 
  WellOperatorCredential 
} from './thg-identity-service';

export class ClientIdentityService {
  private baseUrl = '/api/identity';

  async healthCheck(): Promise<{ status: string; message: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}?action=healthCheck`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }

  async issueWaterQualityCredential(
    wellId: number,
    ph: number,
    tds: number,
    turbidity: number,
    location: string,
    certifiedBy: string
  ): Promise<WaterQualityCredential> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'issueWaterQuality',
        wellId,
        ph,
        tds,
        turbidity,
        location,
        certifiedBy,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to issue water quality credential');
    }

    const result = await response.json();
    return result.credential;
  }

  async issueConservationCredential(
    participantId: string,
    waterSaved: number,
    conservationMethod: string,
    period: string,
    verifiedBy: string
  ): Promise<ConservationCredential> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'issueConservation',
        participantId,
        waterSaved,
        conservationMethod,
        period,
        verifiedBy,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to issue conservation credential');
    }

    const result = await response.json();
    return result.credential;
  }

  async issueWellOperatorCredential(
    operatorId: string,
    wellId: number,
    certificationLevel: string,
    skills: string[],
    validityMonths: number = 12
  ): Promise<WellOperatorCredential> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'issueWellOperator',
        operatorId,
        wellId,
        certificationLevel,
        skills,
        validityMonths,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to issue well operator credential');
    }

    const result = await response.json();
    return result.credential;
  }

  async verifyCredential(credential: DigitalCredential): Promise<boolean> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'verifyCredential',
        credential,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify credential');
    }

    const result = await response.json();
    return result.isValid;
  }

  async revokeCredential(credentialId: string, reason: string): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'revokeCredential',
        credentialId,
        reason,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to revoke credential');
    }
  }

  async getCredentialsForSubject(subjectId: string): Promise<DigitalCredential[]> {
    const response = await fetch(`${this.baseUrl}?action=getCredentials&subjectId=${encodeURIComponent(subjectId)}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get credentials');
    }

    const result = await response.json();
    return result.credentials;
  }

  async generatePresentation(
    credentials: DigitalCredential[],
    challenge: string,
    domain: string
  ): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generatePresentation',
        credentials,
        challenge,
        domain,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate presentation');
    }

    const result = await response.json();
    return result.presentation;
  }
}

// Export singleton instance
export const clientIdentityService = new ClientIdentityService();