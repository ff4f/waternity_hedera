/**
 * THG Identity Platform Integration
 * Digital identity solution built on Hedera Hashgraph
 * Allows users to receive, store, and present digital credentials
 */

import { Client, PrivateKey, AccountId, TopicId, TopicMessageSubmitTransaction } from '@hashgraph/sdk';
import { prisma } from '@/lib/db/prisma';

// THG Identity credential types
export enum CredentialType {
  WATER_ACCESS_RIGHTS = 'WATER_ACCESS_RIGHTS',
  COMMUNITY_MEMBERSHIP = 'COMMUNITY_MEMBERSHIP',
  USAGE_CERTIFICATE = 'USAGE_CERTIFICATE',
  CONSERVATION_ACHIEVEMENT = 'CONSERVATION_ACHIEVEMENT',
  PAYMENT_VERIFICATION = 'PAYMENT_VERIFICATION'
}

// Digital credential structure
export interface DigitalCredential {
  id: string;
  type: CredentialType;
  issuer: string;
  subject: string; // User DID or account ID
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    [key: string]: unknown;
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    signature: string;
  };
}

// THG Identity wallet interface
export interface IdentityWallet {
  did: string; // Decentralized Identifier
  accountId: string; // Hedera Account ID
  credentials: DigitalCredential[];
  publicKey: string;
  createdAt: string;
}

export class THGIdentityService {
  private client: Client;
  private operatorKey: PrivateKey;
  private operatorId: AccountId;
  private identityTopicId: TopicId;
  private prisma = prisma;

  constructor() {
    // Initialize Hedera client
    this.client = Client.forTestnet(); // Use mainnet for production
    
    if (!process.env.HEDERA_OPERATOR_ID || !process.env.HEDERA_OPERATOR_KEY) {
      throw new Error('Hedera credentials not configured');
    }

    this.operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID);
    this.operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY);
    
    this.client.setOperator(this.operatorId, this.operatorKey);
    
    // Identity topic for credential events
    this.identityTopicId = process.env.HEDERA_IDENTITY_TOPIC_ID 
      ? TopicId.fromString(process.env.HEDERA_IDENTITY_TOPIC_ID)
      : TopicId.fromString('0.0.0'); // Will be created if not exists
  }

  /**
   * Create a new digital identity wallet
   */
  async createIdentityWallet(userAccountId: string): Promise<IdentityWallet> {
    try {
      // Generate DID (Decentralized Identifier)
      const did = `did:hedera:testnet:${userAccountId}`;
      
      // Store in database
      const wallet = await this.prisma.identityWallet.create({
        data: {
          did,
          accountId: userAccountId,
          publicKey: '', // Will be set when user provides their public key
          createdAt: new Date()
        }
      });

      // Publish identity creation event to HCS
      await this.publishIdentityEvent({
        eventType: 'IDENTITY_CREATED',
        did,
        accountId: userAccountId,
        timestamp: new Date().toISOString()
      });

      return {
        did: wallet.did,
        accountId: wallet.accountId,
        credentials: [],
        publicKey: wallet.publicKey,
        createdAt: wallet.createdAt.toISOString()
      };
    } catch (error) {
      console.error('Error creating identity wallet:', error);
      throw new Error('Failed to create identity wallet');
    }
  }

  /**
   * Issue a digital credential to a user
   */
  async issueCredential(
    recipientDid: string,
    credentialType: CredentialType,
    credentialData: Record<string, unknown>,
    expirationDate?: Date
  ): Promise<DigitalCredential> {
    try {
      const credentialId = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const issuanceDate = new Date().toISOString();
      
      // Create credential object without proof first
      const credentialWithoutProof = {
        id: credentialId,
        type: credentialType,
        issuer: this.operatorId.toString(),
        subject: recipientDid,
        issuanceDate,
        expirationDate: expirationDate?.toISOString(),
        credentialSubject: {
          id: recipientDid,
          ...credentialData
        }
      };
      
      // Create full credential with proof
      const credential: DigitalCredential = {
        ...credentialWithoutProof,
        proof: {
          type: 'HederaSignature2023',
          created: issuanceDate,
          verificationMethod: `did:hedera:testnet:${this.operatorId}#key-1`,
          proofPurpose: 'assertionMethod',
          signature: await this.signCredential(credentialWithoutProof)
        }
      };

      // Store credential in database
      await this.prisma.digitalCredential.create({
        data: {
          id: credentialId,
          type: credentialType,
          issuer: this.operatorId.toString(),
          subject: recipientDid,
          issuanceDate: new Date(issuanceDate),
          expirationDate: expirationDate,
          credentialData: JSON.stringify(credentialData),
          signature: credential.proof.signature,
          isRevoked: false
        }
      });

      // Publish credential issuance event to HCS
      await this.publishIdentityEvent({
        eventType: 'CREDENTIAL_ISSUED',
        credentialId,
        credentialType,
        issuer: this.operatorId.toString(),
        subject: recipientDid,
        timestamp: issuanceDate
      });

      return credential;
    } catch (error) {
      console.error('Error issuing credential:', error);
      throw new Error('Failed to issue credential');
    }
  }

  /**
   * Verify a digital credential
   */
  async verifyCredential(credential: DigitalCredential): Promise<boolean> {
    try {
      // Check if credential exists in database
      const storedCredential = await prisma.digitalCredential.findUnique({
        where: { id: credential.id }
      });

      if (!storedCredential || storedCredential.isRevoked) {
        return false;
      }

      // Check expiration
      if (credential.expirationDate && new Date() > new Date(credential.expirationDate)) {
        return false;
      }

      // Verify signature
      const isValidSignature = await this.verifyCredentialSignature(credential);
      
      return isValidSignature;
    } catch (error) {
      console.error('Error verifying credential:', error);
      return false;
    }
  }

  /**
   * Get all credentials for a user
   */
  async getUserCredentials(did: string): Promise<DigitalCredential[]> {
    try {
      const credentials = await this.prisma.digitalCredential.findMany({
        where: { subject: did },
      });
      return credentials.map((cred) => {
        const credentialData = JSON.parse(cred.credentialData);
        return {
          id: cred.id,
          type: cred.type as CredentialType,
          issuer: cred.issuer,
          subject: cred.subject,
          issuanceDate: cred.issuanceDate.toISOString(),
          expirationDate: cred.expirationDate?.toISOString(),
          credentialSubject: credentialData.credentialSubject || {},
          proof: {
            type: credentialData.proof?.type || 'Ed25519Signature2020',
            created: credentialData.proof?.created || cred.createdAt.toISOString(),
            verificationMethod: credentialData.proof?.verificationMethod || `${cred.issuer}#key-1`,
            proofPurpose: credentialData.proof?.proofPurpose || 'assertionMethod',
            signature: cred.signature
          }
        };
      });
    } catch (error) {
      console.error('Error fetching user credentials:', error);
      throw new Error('Failed to get user credentials');
    }
  }

  /**
   * Publish identity-related events to HCS
   */
  private async publishIdentityEvent(event: Record<string, unknown>): Promise<void> {
    try {
      const transaction = new TopicMessageSubmitTransaction({
        topicId: this.identityTopicId,
        message: Buffer.from(JSON.stringify(event))
      });
      await transaction.execute(this.client);
    } catch (error) {
      console.error('Error publishing identity event:', error);
    }
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(credentialId: string): Promise<void> {
    try {
      await this.prisma.digitalCredential.update({
        where: { id: credentialId },
        data: { isRevoked: true }
      });

      // Publish revocation event to HCS
      await this.publishIdentityEvent({
        eventType: 'CREDENTIAL_REVOKED',
        credentialId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error revoking credential:', error);
      throw new Error('Failed to revoke credential');
    }
  }

  /**
   * Create water access rights credential
   */
  async issueWaterAccessRights(
    userDid: string,
    wellId: string,
    accessLevel: 'BASIC' | 'PREMIUM' | 'UNLIMITED',
    monthlyAllowance: number
  ): Promise<DigitalCredential> {
    return this.issueCredential(
      userDid,
      CredentialType.WATER_ACCESS_RIGHTS,
      {
        wellId,
        accessLevel,
        monthlyAllowance,
        grantedBy: 'Waternity Community',
        location: 'Community Well #' + wellId
      },
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiration
    );
  }

  /**
   * Create conservation achievement credential
   */
  async issueConservationAchievement(
    userDid: string,
    achievementType: string,
    waterSaved: number,
    period: string
  ): Promise<DigitalCredential> {
    return this.issueCredential(
      userDid,
      CredentialType.CONSERVATION_ACHIEVEMENT,
      {
        achievementType,
        waterSaved,
        period,
        carbonCreditsEarned: Math.floor(waterSaved * 0.001), // 1 credit per 1000L saved
        verifiedBy: 'Waternity Conservation Program'
      }
    );
  }

  /**
   * Sign credential with operator private key
   */
  private async signCredential(credential: Omit<DigitalCredential, 'proof'>): Promise<string> {
    // Create credential hash for signing
    const credentialString = JSON.stringify({
      id: credential.id,
      type: credential.type,
      issuer: credential.issuer,
      subject: credential.subject,
      issuanceDate: credential.issuanceDate,
      credentialSubject: credential.credentialSubject
    });
    
    // Sign with operator private key
    const signature = this.operatorKey.sign(Buffer.from(credentialString));
    return Buffer.from(signature).toString('hex');
  }

  /**
   * Verify credential signature
   */
  private async verifyCredentialSignature(credential: DigitalCredential): Promise<boolean> {
    try {
      // Recreate credential string for verification
      const credentialString = JSON.stringify({
        id: credential.id,
        type: credential.type,
        issuer: credential.issuer,
        subject: credential.subject,
        issuanceDate: credential.issuanceDate,
        credentialSubject: credential.credentialSubject
      });

      // Get issuer's public key (in real implementation, this would be retrieved from DID document)
      const issuerPublicKey = this.operatorKey.publicKey;
      
      // Verify signature
      const signatureBytes = Buffer.from(credential.proof.signature, 'hex');
      const messageBytes = Buffer.from(credentialString);
      
      return issuerPublicKey.verify(messageBytes, signatureBytes);
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }
}

// Export singleton instance
export const thgIdentityService = new THGIdentityService();