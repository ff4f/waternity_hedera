'use client';

import React, { useState } from 'react';
import { createHash } from 'crypto';

// Define the props for the DocumentAnchorForm component
type DocumentAnchorFormProps = {
  wellId: string;
};

type AnchorResult = {
  documentId: string;
  anchorId: string;
  hfsFileId?: string;
};

const DocumentAnchorForm: React.FC<DocumentAnchorFormProps> = ({ wellId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnchorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Accept only .pdf and .json files
      if (selectedFile.type === 'application/pdf' || selectedFile.type === 'application/json') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Only PDF and JSON files are allowed');
        setFile(null);
      }
    }
  };

  const computeDigest = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const hash = createHash('sha256');
    hash.update(uint8Array);
    return hash.digest('hex');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Compute digest client-side
      const digestHex = await computeDigest(file);
      
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const bundleContentBase64 = Buffer.from(arrayBuffer).toString('base64');
      
      // Generate unique messageId
      const messageId = `anchor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Send to API
      const response = await fetch('/api/documents/anchor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          wellId,
          type: file.type === 'application/pdf' ? 'PDF_REPORT' : 'JSON_DATA',
          digestAlgo: 'SHA256',
          digestHex,
          bundleContentBase64,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to anchor document');
      }

      const data = await response.json();
      setResult(data);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold mb-4">Anchor Document</h3>
      
      {result && result.hfsFileId && (
        <div className="mb-4">
          <div className="inline-flex gap-2">
            <span className="inline-block bg-green-100 rounded-full px-3 py-1 text-sm font-semibold text-green-700">
              Document Anchored
            </span>
            <a
              href={`https://hashscan.io/testnet/file/${result.hfsFileId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-100 hover:bg-blue-200 rounded-full px-3 py-1 text-sm font-semibold text-blue-700 transition-colors"
            >
              View on HashScan
            </a>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Document (PDF or JSON)
          </label>
          <input
            type="file"
            accept=".pdf,.json"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        
        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={!file || loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Anchoring...' : 'Anchor Document'}
        </button>
      </form>
    </div>
  );
};

export default DocumentAnchorForm;