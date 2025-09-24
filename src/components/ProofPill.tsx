'use client';

import React, { useEffect, useState } from 'react';
import { Copy, ExternalLink, Check } from 'lucide-react';

interface ProofPillProps {
  wellId: string;
  className?: string;
}

interface MetaLinks {
  hashscan: {
    topic?: string;
    token?: string;
    file?: string;
  };
  mirror: {
    topic?: string;
  };
}

export function ProofPill({ wellId, className = '' }: ProofPillProps) {
  const [metaLinks, setMetaLinks] = useState<MetaLinks | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetaLinks = async () => {
      try {
        const response = await fetch(`/api/meta/links?wellId=${wellId}`);
        if (response.ok) {
          const data = await response.json();
          setMetaLinks(data);
        }
      } catch (error) {
        console.error('Failed to fetch meta links:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetaLinks();
  }, [wellId]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
      </div>
    );
  }

  if (!metaLinks) {
    return null;
  }

  const hashscanTopicUrl = metaLinks.hashscan.topic 
    ? `https://hashscan.io/mainnet/topic/${metaLinks.hashscan.topic}`
    : null;
  
  const mirrorTopicUrl = metaLinks.mirror.topic 
    ? `https://mainnet-public.mirrornode.hedera.com/api/v1/topics/${metaLinks.mirror.topic}/messages`
    : null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* HashScan Chip */}
      {hashscanTopicUrl && (
        <div className="flex items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
          <a
            href={hashscanTopicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-700 hover:text-blue-900 text-sm font-medium"
          >
            HashScan
            <ExternalLink className="w-3 h-3" />
          </a>
          {metaLinks.hashscan.topic && (
            <button
              onClick={() => copyToClipboard(metaLinks.hashscan.topic!, 'topic')}
              className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
              title="Copy Topic ID"
            >
              {copiedId === 'topic' ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Mirror Chip */}
      {mirrorTopicUrl && (
        <div className="flex items-center bg-green-50 border border-green-200 rounded-full px-3 py-1">
          <a
            href={mirrorTopicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-green-700 hover:text-green-900 text-sm font-medium"
          >
            Mirror
            <ExternalLink className="w-3 h-3" />
          </a>
          {metaLinks.mirror.topic && (
            <button
              onClick={() => copyToClipboard(metaLinks.mirror.topic!, 'mirror')}
              className="ml-2 text-green-600 hover:text-green-800 transition-colors"
              title="Copy Topic ID"
            >
              {copiedId === 'mirror' ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Token ID Copy (if available) */}
      {metaLinks.hashscan.token && (
        <div className="flex items-center bg-purple-50 border border-purple-200 rounded-full px-3 py-1">
          <span className="text-purple-700 text-sm font-medium mr-1">Token</span>
          <button
            onClick={() => copyToClipboard(metaLinks.hashscan.token!, 'token')}
            className="text-purple-600 hover:text-purple-800 transition-colors"
            title="Copy Token ID"
          >
            {copiedId === 'token' ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
      )}

      {/* File ID Copy (if available) */}
      {metaLinks.hashscan.file && (
        <div className="flex items-center bg-orange-50 border border-orange-200 rounded-full px-3 py-1">
          <span className="text-orange-700 text-sm font-medium mr-1">File</span>
          <button
            onClick={() => copyToClipboard(metaLinks.hashscan.file!, 'file')}
            className="text-orange-600 hover:text-orange-800 transition-colors"
            title="Copy File ID"
          >
            {copiedId === 'file' ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default ProofPill;