import React from 'react';

interface ProgressProps {
  value?: number;
  className?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, className = '' }, ref) => {
    const percentage = Math.min(Math.max(value, 0), 100);
    
    return (
      <div
        ref={ref}
        className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}
      >
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };