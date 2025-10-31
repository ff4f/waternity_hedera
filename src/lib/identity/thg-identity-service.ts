/**
 * THG Identity Platform Service
 * Handles digital credentials and verifiable claims for water management
 */

import { Client, PrivateKey, AccountId, TopicCreateTransaction, TopicMessageSubmitTransaction, TopicId } from '@hashgraph/sdk';

export interface DigitalCredential {
  id: string;
  type: string;
  issuer: string;
  subject: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    [key: string]: any;
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws: string;
  };
}

export interface WaterQualityCredential extends DigitalCredential {
  credentialSubject: {
    id: string;
    wellId: number;
    ph: number;
    tds: number;
    turbidity: number;
    testDate: string;
    certifiedBy: string;
    location: string;
  };
}

export interface ConservationCredential extends DigitalCredential {
  credentialSubject: {
    id: string;
    participantId: string;
    waterSaved: number;
    conservationMethod: string;
    period: string;
    verifiedBy: string;
    impactScore: number;
  };
}

export interface WellOperatorCredential extends DigitalCredential {
  credentialSubject: {
    id: string;
    operatorId: string;
    wellId: number;
    certificationLevel: string;
    skills: string[];
    validUntil: string;
    issuingAuthority: string;
  };
}

export class THGIdentityService {
  private client: Client;
  private operatorKey: PrivateKey;
  private operatorId: AccountId;
  private credentialTopicId?: TopicId;

  constructor() {
    // Initialize Hedera client for testnet
    this.client = Client.forTestnet();
    
    // Set operator from environment variables
    const privateKeyString = process.env.HEDERA_PRIVATE_KEY;
    const accountIdString = process.env.HEDERA_ACCOUNT_ID;
    
    if (!privateKeyString || !accountIdString) {
      throw new Error('HEDERA_PRIVATE_KEY and HEDERA_ACCOUNT_ID must be set');
    }
    
    this.operatorKey = PrivateKey.fromString(privateKeyString);
    this.operatorId = AccountId.fromString(accountIdString);
    
    this.client.setOperator(this.operatorId, this.operatorKey);
  }

  /**
   * Initialize the credential topic for storing verifiable credentials
   */
  async initializeCredentialTopic(): Promise<TopicId> {
    if (this.credentialTopicId) {
      return this.credentialTopicId;
    }

    try {
      const transaction = new TopicCreateTransaction()
        .setTopicMemo('Waternity Digital Credentials')
        .setAdminKey(this.operatorKey.publicKey)
        .setSubmitKey(this.operatorKey.publicKey)
        .freezeWith(this.client);

      const signedTransaction = await transaction.sign(this.operatorKey);
      const response = await signedTransaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      this.credentialTopicId = receipt.topicId!;
      console.log(`Credential topic created: ${this.credentialTopicId}`);
      
      return this.credentialTopicId;
    } catch (error) {
      console.error('Error creating credential topic:', error);
      throw error;
    }
  }

  /**
   * Issue a water quality credential
   */
  async issueWaterQualityCredential(
    wellId: number,
    ph: number,
    tds: number,
    turbidity: number,
    location: string,
    certifiedBy: string
  ): Promise<WaterQualityCredential> {
    const credentialId = `water-quality-${wellId}-${Date.now()}`;
    const issuanceDate = new Date().toISOString();
    
    // Build credential without JWS to avoid self-referential initialization
    const credentialWithoutJws: WaterQualityCredential = {
      id: credentialId,
      type: 'WaterQualityCredential',
      issuer: this.operatorId.toString(),
      subject: `well-${wellId}`,
      issuanceDate,
      credentialSubject: {
        id: `well-${wellId}`,
        wellId,
        ph,
        tds,
        turbidity,
        testDate: issuanceDate,
        certifiedBy,
        location
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: issuanceDate,
        verificationMethod: `${this.operatorId}#key-1`,
        proofPurpose: 'assertionMethod',
        jws: ''
      }
    };

    const signedJwsWq = await this.signCredential(credentialWithoutJws);
    const credential: WaterQualityCredential = {
      ...credentialWithoutJws,
      proof: { ...credentialWithoutJws.proof, jws: signedJwsWq }
    };

    await this.storeCredentialOnHCS(credential);
    return credential;
  }

  /**
   * Issue a conservation credential
   */
  async issueConservationCredential(
    participantId: string,
    waterSaved: number,
    conservationMethod: string,
    period: string,
    verifiedBy: string
  ): Promise<ConservationCredential> {
    const credentialId = `conservation-${participantId}-${Date.now()}`;
    const issuanceDate = new Date().toISOString();
    
    // Calculate impact score based on water saved
    const impactScore = Math.min(100, Math.floor(waterSaved / 10));
    
    const credentialWithoutJws: ConservationCredential = {
      id: credentialId,
      type: 'ConservationCredential',
      issuer: this.operatorId.toString(),
      subject: participantId,
      issuanceDate,
      credentialSubject: {
        id: participantId,
        participantId,
        waterSaved,
        conservationMethod,
        period,
        verifiedBy,
        impactScore
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: issuanceDate,
        verificationMethod: `${this.operatorId}#key-1`,
        proofPurpose: 'assertionMethod',
        jws: ''
      }
    };

    const signedJwsCons = await this.signCredential(credentialWithoutJws);
    const credential: ConservationCredential = {
      ...credentialWithoutJws,
      proof: { ...credentialWithoutJws.proof, jws: signedJwsCons }
    };

    await this.storeCredentialOnHCS(credential);
    return credential;
  }

  /**
   * Issue a well operator credential
   */
  async issueWellOperatorCredential(
    operatorId: string,
    wellId: number,
    certificationLevel: string,
    skills: string[],
    validityMonths: number = 12
  ): Promise<WellOperatorCredential> {
    const credentialId = `operator-${operatorId}-${wellId}-${Date.now()}`;
    const issuanceDate = new Date().toISOString();
    const validUntil = new Date(Date.now() + validityMonths * 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const credentialWithoutJws: WellOperatorCredential = {
      id: credentialId,
      type: 'WellOperatorCredential',
      issuer: this.operatorId.toString(),
      subject: operatorId,
      issuanceDate,
      expirationDate: validUntil,
      credentialSubject: {
        id: operatorId,
        operatorId,
        wellId,
        certificationLevel,
        skills,
        validUntil,
        issuingAuthority: 'Waternity Platform'
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: issuanceDate,
        verificationMethod: `${this.operatorId}#key-1`,
        proofPurpose: 'assertionMethod',
        jws: ''
      }
    };

    const signedJwsOp = await this.signCredential(credentialWithoutJws);
    const credential: WellOperatorCredential = {
      ...credentialWithoutJws,
      proof: { ...credentialWithoutJws.proof, jws: signedJwsOp }
    };

    await this.storeCredentialOnHCS(credential);
    return credential;
  }

  /**
   * Verify a digital credential
   */
  async verifyCredential(credential: DigitalCredential): Promise<boolean> {
    try {
      // Verify the signature
      const isSignatureValid = await this.verifySignature(credential);
      
      // Check if credential is not expired
      const isNotExpired = !credential.expirationDate || 
        new Date(credential.expirationDate) > new Date();
      
      // Verify issuer is trusted
      const isTrustedIssuer = await this.verifyIssuer(credential.issuer);
      
      return isSignatureValid && isNotExpired && isTrustedIssuer;
    } catch (error) {
      console.error('Error verifying credential:', error);
      return false;
    }
  }

  /**
   * Get credentials for a subject
   */
  async getCredentialsForSubject(subjectId: string): Promise<DigitalCredential[]> {
    // In a real implementation, this would query the HCS topic
    // For now, return mock data
    return [];
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(credentialId: string, reason: string): Promise<void> {
    const revocation = {
      type: 'CredentialRevocation',
      credentialId,
      reason,
      revokedAt: new Date().toISOString(),
      revokedBy: this.operatorId.toString()
    };

    await this.storeCredentialOnHCS(revocation);
  }

  /**
   * Store credential on Hedera Consensus Service
   */
  private async storeCredentialOnHCS(credential: any): Promise<void> {
    if (!this.credentialTopicId) {
      await this.initializeCredentialTopic();
    }

    try {
      const message = JSON.stringify(credential);
      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(this.credentialTopicId!)
        .setMessage(message)
        .freezeWith(this.client);

      const signedTransaction = await transaction.sign(this.operatorKey);
      const response = await signedTransaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      console.log(`Credential stored on HCS: ${receipt.status}`);
    } catch (error) {
      console.error('Error storing credential on HCS:', error);
      throw error;
    }
  }

  /**
   * Sign a credential using the operator's private key
   */
  private async signCredential(credential: any): Promise<string> {
    // Create a simplified signature for demo purposes
    // In production, use proper JWS signing
    const credentialString = JSON.stringify({
      id: credential.id,
      type: credential.type,
      issuer: credential.issuer,
      subject: credential.subject,
      issuanceDate: credential.issuanceDate,
      credentialSubject: credential.credentialSubject
    });
    
    const signature = this.operatorKey.sign(Buffer.from(credentialString));
    return Buffer.from(signature).toString('base64');
  }

  /**
   * Verify credential signature
   */
  private async verifySignature(credential: DigitalCredential): Promise<boolean> {
    try {
      const credentialString = JSON.stringify({
        id: credential.id,
        type: credential.type,
        issuer: credential.issuer,
        subject: credential.subject,
        issuanceDate: credential.issuanceDate,
        credentialSubject: credential.credentialSubject
      });
      
      const signature = Buffer.from(credential.proof.jws, 'base64');
      const publicKey = this.operatorKey.publicKey;
      
      return publicKey.verify(Buffer.from(credentialString), signature);
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  /**
   * Verify if issuer is trusted
   */
  private async verifyIssuer(issuer: string): Promise<boolean> {
    // In a real implementation, check against a trusted issuer registry
    // For demo purposes, trust our own operator
    return issuer === this.operatorId.toString();
  }

  /**
   * Generate a presentation of credentials
   */
  async generatePresentation(
    credentials: DigitalCredential[],
    challenge: string,
    domain: string
  ): Promise<any> {
    const presentation = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiablePresentation'],
      verifiableCredential: credentials,
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        challenge,
        domain,
        verificationMethod: `${this.operatorId}#key-1`,
        proofPurpose: 'authentication',
        jws: await this.signPresentation(credentials, challenge, domain)
      }
    };

    return presentation;
  }

  /**
   * Sign a verifiable presentation
   */
  private async signPresentation(
    credentials: DigitalCredential[],
    challenge: string,
    domain: string
  ): Promise<string> {
    const presentationString = JSON.stringify({
      credentials: credentials.map(c => c.id),
      challenge,
      domain,
      timestamp: new Date().toISOString()
    });
    
    const signature = this.operatorKey.sign(Buffer.from(presentationString));
    return Buffer.from(signature).toString('base64');
  }
}

// Export singleton instance
export const thgIdentityService = new THGIdentityService();