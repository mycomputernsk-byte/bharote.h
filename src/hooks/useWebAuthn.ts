import { useState, useCallback } from 'react';

interface WebAuthnResult {
  isSupported: boolean;
  isRegistered: boolean;
  credentialId: string | null;
  register: (userId: string, userName: string) => Promise<string | null>;
  authenticate: (credentialId: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

// Convert ArrayBuffer to base64url string
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Convert base64url string to ArrayBuffer
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

// Generate SHA-256 hash of credential for storage
async function hashCredential(credentialId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(credentialId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const useWebAuthn = (): WebAuthnResult => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [credentialId, setCredentialId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && 
    !!window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function';

  const register = useCallback(async (userId: string, userName: string): Promise<string | null> => {
    if (!isSupported) {
      setError('WebAuthn is not supported on this device');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate a random challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const userIdBuffer = new TextEncoder().encode(userId);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: challenge.buffer,
        rp: {
          name: 'BHAROTE Voting System',
          id: window.location.hostname,
        },
        user: {
          id: userIdBuffer,
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' },  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Use built-in biometric
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('No credential returned');
      }

      const credId = bufferToBase64url(credential.rawId);
      const credHash = await hashCredential(credId);
      
      setCredentialId(credId);
      setIsRegistered(true);
      setIsLoading(false);
      
      // Store credential ID in localStorage for later authentication
      localStorage.setItem(`bharote_webauthn_${userId}`, credId);
      
      return credHash;
    } catch (err: any) {
      console.error('WebAuthn registration error:', err);
      const message = err.name === 'NotAllowedError' 
        ? 'Biometric registration was cancelled or denied'
        : err.name === 'SecurityError'
        ? 'WebAuthn requires a secure context (HTTPS)'
        : err.message || 'Failed to register biometric';
      setError(message);
      setIsLoading(false);
      return null;
    }
  }, [isSupported]);

  const authenticate = useCallback(async (storedCredentialId: string): Promise<boolean> => {
    if (!isSupported) {
      setError('WebAuthn is not supported on this device');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: challenge.buffer,
        rpId: window.location.hostname,
        allowCredentials: [{
          id: base64urlToBuffer(storedCredentialId),
          type: 'public-key',
          transports: ['internal'],
        }],
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (assertion) {
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (err: any) {
      console.error('WebAuthn auth error:', err);
      setError(err.message || 'Biometric authentication failed');
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    isRegistered,
    credentialId,
    register,
    authenticate,
    isLoading,
    error,
  };
};

export default useWebAuthn;
