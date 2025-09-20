import React from 'react';

// Define the props for the ProofPill component
type ProofPillProps = {
  transactionId: string;
  // Add other props as needed, e.g., for different networks
};

const ProofPill: React.FC<ProofPillProps> = ({ transactionId }) => {
  // Base URL for HashScan
  const hashScanUrl = `https://hashscan.io/testnet/transaction/${transactionId}`;

  return (
    <a
      href={hashScanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"
    >
      View on HashScan
    </a>
  );
};

export default ProofPill;