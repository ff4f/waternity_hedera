import React from 'react';
import { TrendingUp, Droplet, Zap, Shield } from 'lucide-react';

const KPIMetricCard = ({ icon, label, value, change, changeType }) => {
  const changeColor = changeType === 'increase' ? 'text-green-500' : 'text-red-500';

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-primary/10 text-primary p-3 rounded-full">
          {icon}
        </div>
        {change && (
          <div className={`flex items-center text-sm font-medium ${changeColor}`}>
            <TrendingUp size={16} className="mr-1" />
            {change}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-foreground">{value}</h3>
      </div>
    </div>
  );
};

const KPIMetricsGrid = () => {
  const metrics = [
    {
      icon: <TrendingUp />,
      label: 'Portfolio Value',
      value: '$12,850.75',
      change: '+2.5%',
      changeType: 'increase',
    },
    {
      icon: <Droplet />,
      label: 'Total Water Dispensed',
      value: '4,500 L',
      change: '+10%',
      changeType: 'increase',
    },
    {
      icon: <Zap />,
      label: 'Average APY',
      value: '8.2%',
      change: '-0.2%',
      changeType: 'decrease',
    },
    {
      icon: <Shield />,
      label: 'Portfolio Health',
      value: '92%',
      change: '+1.5%',
      changeType: 'increase',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <KPIMetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

export default KPIMetricsGrid;