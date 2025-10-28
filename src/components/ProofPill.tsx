import React, { useState } from 'react';

interface ProofPillProps {
  hashscanUrl?: string;
  mirrorUrl?: string;
  idLabel?: string;
  txId?: string; // legacy support
}

const ProofPill: React.FC<ProofPillProps> = ({ hashscanUrl, mirrorUrl, idLabel = 'ID', txId }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const extractId = (url: string) => {
    // Extract ID from URL (last segment after last slash)
    const segments = url.split('/');
    return segments[segments.length - 1] || url;
  };

  // Allow rendering when only txId present
  if (!hashscanUrl && !mirrorUrl && !txId) {
    return null;
  }

  // Synthesize hashscan url from txId if provided
  const resolvedHashscanUrl = hashscanUrl || (txId ? `https://hashscan.io/testnet/transaction/${encodeURIComponent(txId)}` : undefined);

  return (
    <div className="inline-flex items-center gap-2 bg-gray-100 rounded-lg p-2 text-sm">
      <span className="text-gray-600 font-medium">{idLabel}:</span>
      
      {resolvedHashscanUrl && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => window.open(resolvedHashscanUrl, '_blank')}
            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs font-medium"
          >
            Hashscan
          </button>
          <button
            onClick={() => copyToClipboard(extractId(resolvedHashscanUrl), 'hashscan')}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="Copy ID"
          >
            {copied === 'hashscan' ? (
              <span className="text-green-500 text-xs">✓</span>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      )}
      
      {mirrorUrl && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => window.open(mirrorUrl, '_blank')}
            className="px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-xs font-medium"
          >
            Mirror
          </button>
          <button
            onClick={() => copyToClipboard(extractId(mirrorUrl), 'mirror')}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="Copy ID"
          >
            {copied === 'mirror' ? (
              <span className="text-green-500 text-xs">✓</span>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProofPill;