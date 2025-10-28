'use client';

import { useState, useCallback } from 'react';
import { 
  DigitalCredential, 
  WaterQualityCredential, 
  ConservationCredential, 
  WellOperatorCredential 
} from '@/lib/identity/thg-identity-service';
import { clientIdentityService } from '@/lib/identity/client-identity-service';

export interface UseIdentityReturn {
  // State
  loading: boolean;
  error: string | null;
  credentials: DigitalCredential[];
  
  // Actions
  issueWaterQualityCredential: (
    wellId: number,
    ph: number,
    tds: number,
    turbidity: number,
    location: string,
    certifiedBy: string
  ) => Promise<WaterQualityCredential | null>;
  
  issueConservationCredential: (
    participantId: string,
    waterSaved: number,
    conservationMethod: string,
    period: string,
    verifiedBy: string
  ) => Promise<ConservationCredential | null>;
  
  issueWellOperatorCredential: (
    operatorId: string,
    wellId: number,
    certificationLevel: string,
    skills: string[],
    validityMonths?: number
  ) => Promise<WellOperatorCredential | null>;
  
  verifyCredential: (credential: DigitalCredential) => Promise<boolean>;
  revokeCredential: (credentialId: string, reason: string) => Promise<void>;
  getCredentialsForSubject: (subjectId: string) => Promise<void>;
  generatePresentation: (
    credentials: DigitalCredential[],
    challenge: string,
    domain: string
  ) => Promise<any>;
}

export function useIdentity(): UseIdentityReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<DigitalCredential[]>([]);

  const handleError = useCallback((err: any, action: string) => {
    console.error(`Error in ${action}:`, err);
    setError(err.message || `Failed to ${action}`);
    setLoading(false);
  }, []);

  const issueWaterQualityCredential = useCallback(async (
    wellId: number,
    ph: number,
    tds: number,
    turbidity: number,
    location: string,
    certifiedBy: string
  ): Promise<WaterQualityCredential | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const credential = await clientIdentityService.issueWaterQualityCredential(
        wellId,
        ph,
        tds,
        turbidity,
        location,
        certifiedBy
      );
      
      setCredentials(prev => [...prev, credential]);
      setLoading(false);
      return credential;
    } catch (err) {
      handleError(err, 'issue water quality credential');
      return null;
    }
  }, [handleError]);

  const issueConservationCredential = useCallback(async (
    participantId: string,
    waterSaved: number,
    conservationMethod: string,
    period: string,
    verifiedBy: string
  ): Promise<ConservationCredential | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const credential = await clientIdentityService.issueConservationCredential(
        participantId,
        waterSaved,
        conservationMethod,
        period,
        verifiedBy
      );
      
      setCredentials(prev => [...prev, credential]);
      setLoading(false);
      return credential;
    } catch (err) {
      handleError(err, 'issue conservation credential');
      return null;
    }
  }, [handleError]);

  const issueWellOperatorCredential = useCallback(async (
    operatorId: string,
    wellId: number,
    certificationLevel: string,
    skills: string[],
    validityMonths: number = 12
  ): Promise<WellOperatorCredential | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const credential = await clientIdentityService.issueWellOperatorCredential(
        operatorId,
        wellId,
        certificationLevel,
        skills,
        validityMonths
      );
      
      setCredentials(prev => [...prev, credential]);
      setLoading(false);
      return credential;
    } catch (err) {
      handleError(err, 'issue well operator credential');
      return null;
    }
  }, [handleError]);

  const verifyCredential = useCallback(async (credential: DigitalCredential): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const isValid = await clientIdentityService.verifyCredential(credential);
      setLoading(false);
      return isValid;
    } catch (err) {
      handleError(err, 'verify credential');
      return false;
    }
  }, [handleError]);

  const revokeCredential = useCallback(async (credentialId: string, reason: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await clientIdentityService.revokeCredential(credentialId, reason);
      
      // Remove from local state
      setCredentials(prev => prev.filter(c => c.id !== credentialId));
      setLoading(false);
    } catch (err) {
      handleError(err, 'revoke credential');
    }
  }, [handleError]);

  const getCredentialsForSubject = useCallback(async (subjectId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const subjectCredentials = await clientIdentityService.getCredentialsForSubject(subjectId);
      setCredentials(subjectCredentials);
      setLoading(false);
    } catch (err) {
      handleError(err, 'get credentials for subject');
    }
  }, [handleError]);

  const generatePresentation = useCallback(async (
    credentials: DigitalCredential[],
    challenge: string,
    domain: string
  ): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      const presentation = await clientIdentityService.generatePresentation(
        credentials,
        challenge,
        domain
      );
      
      setLoading(false);
      return presentation;
    } catch (err) {
      handleError(err, 'generate presentation');
      return null;
    }
  }, [handleError]);

  return {
    loading,
    error,
    credentials,
    issueWaterQualityCredential,
    issueConservationCredential,
    issueWellOperatorCredential,
    verifyCredential,
    revokeCredential,
    getCredentialsForSubject,
    generatePresentation
  };
}

// Hook for water quality credentials specifically
export function useWaterQualityCredentials() {
  const identity = useIdentity();
  
  const waterQualityCredentials = identity.credentials.filter(
    (c): c is WaterQualityCredential => c.type === 'WaterQualityCredential'
  );
  
  return {
    ...identity,
    waterQualityCredentials
  };
}

// Hook for conservation credentials specifically
export function useConservationCredentials() {
  const identity = useIdentity();
  
  const conservationCredentials = identity.credentials.filter(
    (c): c is ConservationCredential => c.type === 'ConservationCredential'
  );
  
  return {
    ...identity,
    conservationCredentials
  };
}

// Hook for well operator credentials specifically
export function useWellOperatorCredentials() {
  const identity = useIdentity();
  
  const operatorCredentials = identity.credentials.filter(
    (c): c is WellOperatorCredential => c.type === 'WellOperatorCredential'
  );
  
  return {
    ...identity,
    operatorCredentials
  };
}