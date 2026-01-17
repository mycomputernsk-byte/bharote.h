import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

interface FingerprintResult {
  visitorId: string;
  hash: string;
  isLoading: boolean;
  error: string | null;
}

export const useDeviceFingerprint = (): FingerprintResult => {
  const [visitorId, setVisitorId] = useState<string>('');
  const [hash, setHash] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getFingerprint = async () => {
      try {
        // Initialize FingerprintJS
        const fp = await FingerprintJS.load();
        
        // Get the visitor identifier
        const result = await fp.get();
        
        // The visitorId is a stable identifier for the device
        setVisitorId(result.visitorId);
        
        // Create a hash for database storage
        const fingerprintHash = await generateHash(result.visitorId);
        setHash(fingerprintHash);
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('Fingerprint error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    getFingerprint();
  }, []);

  return { visitorId, hash, isLoading, error };
};

// Generate SHA-256 hash of the fingerprint
async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default useDeviceFingerprint;
