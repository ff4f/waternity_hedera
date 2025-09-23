import React, { useEffect, useState } from 'react';

// Define the props for the ProofPill component
type ProofPillProps = {
  wellId: string;
};

type LinksData = {
  hashscan: {
    topic: string;
    token?: string;
    file?: string;
  };
  mirror: {
    topic: string;
  };
};

const ProofPill: React.FC<ProofPillProps> = ({ wellId }) => {
  const [links, setLinks] = useState<LinksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await fetch(`/api/meta/links?wellId=${wellId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch links');
        }
        const data = await response.json();
        setLinks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (wellId) {
      fetchLinks();
    }
  }, [wellId]);

  if (loading) {
    return (
      <div className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-500 mr-2 mb-2">
        Loading...
      </div>
    );
  }

  if (error || !links) {
    return (
      <div className="inline-block bg-red-100 rounded-full px-3 py-1 text-sm text-red-600 mr-2 mb-2">
        Error loading proof links
      </div>
    );
  }

  return (
    <div className="inline-flex gap-2">
      <a
        href={links.hashscan.topic}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-blue-100 hover:bg-blue-200 rounded-full px-3 py-1 text-sm font-semibold text-blue-700 transition-colors"
      >
        HashScan
      </a>
      <a
        href={links.mirror.topic}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-green-100 hover:bg-green-200 rounded-full px-3 py-1 text-sm font-semibold text-green-700 transition-colors"
      >
        Mirror Node
      </a>
    </div>
  );
};

export default ProofPill;