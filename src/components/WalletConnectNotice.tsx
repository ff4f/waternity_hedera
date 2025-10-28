import React from 'react';

interface WalletConnectNoticeProps {
  show?: boolean;
  className?: string;
  message?: string;
}

const WalletConnectNotice: React.FC<WalletConnectNoticeProps> = ({ 
  show = true, 
  className = '',
  message = 'Connect your Hedera wallet to proceed'
}) => {
  if (!show) return null;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm ${className}`}>
      <svg 
        className="w-4 h-4 text-amber-600" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
        />
      </svg>
      <span className="font-medium">{message}</span>
    </div>
  );
};

export default WalletConnectNotice;