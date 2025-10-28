import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4' 
}) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${width} ${height} ${className}`}
    />
  );
};

// Wells List Skeleton
export const WellsListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton width="w-32" height="h-5" />
              <Skeleton width="w-48" height="h-4" />
            </div>
            <Skeleton width="w-20" height="h-6" className="rounded-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton width="w-24" height="h-4" />
            <Skeleton width="w-28" height="h-4" />
            <Skeleton width="w-20" height="h-4" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Well Detail KPIs Skeleton
export const WellKPISkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg border space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton width="w-8" height="h-8" className="rounded" />
            <Skeleton width="w-4" height="h-4" />
          </div>
          <div className="space-y-2">
            <Skeleton width="w-16" height="h-8" />
            <Skeleton width="w-24" height="h-4" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Events List Skeleton
export const EventsListSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton width="w-28" height="h-5" />
              <Skeleton width="w-40" height="h-4" />
            </div>
            <Skeleton width="w-24" height="h-4" />
          </div>
          <div className="space-y-2">
            <Skeleton width="w-full" height="h-4" />
            <Skeleton width="w-3/4" height="h-4" />
          </div>
          <div className="flex gap-2">
            <Skeleton width="w-20" height="h-6" className="rounded-full" />
            <Skeleton width="w-16" height="h-6" className="rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Settlement Item Skeleton
export const SettlementSkeleton: React.FC = () => {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton width="w-32" height="h-5" />
          <Skeleton width="w-48" height="h-4" />
        </div>
        <Skeleton width="w-24" height="h-6" className="rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Skeleton width="w-16" height="h-4" />
          <Skeleton width="w-20" height="h-6" />
        </div>
        <div className="space-y-1">
          <Skeleton width="w-20" height="h-4" />
          <Skeleton width="w-24" height="h-6" />
        </div>
        <div className="space-y-1">
          <Skeleton width="w-18" height="h-4" />
          <Skeleton width="w-16" height="h-6" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton width="w-20" height="h-8" className="rounded" />
        <Skeleton width="w-24" height="h-8" className="rounded" />
      </div>
    </div>
  );
};

// Dashboard Card Skeleton
export const DashboardCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton width="w-32" height="h-6" />
        <Skeleton width="w-8" height="h-8" className="rounded" />
      </div>
      <div className="space-y-2">
        <Skeleton width="w-20" height="h-8" />
        <Skeleton width="w-40" height="h-4" />
      </div>
      <Skeleton width="w-full" height="h-2" className="rounded-full" />
    </div>
  );
};

export default Skeleton;