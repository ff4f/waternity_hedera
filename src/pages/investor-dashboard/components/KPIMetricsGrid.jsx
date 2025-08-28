import React from 'react';
import Icon from '../../../components/AppIcon';

const KPIMetricsGrid = () => {
  const kpiData = [
    {
      id: 'tvl',
      title: 'Total Value Locked',
      value: '$2.4M',
      change: '+12.5%',
      trend: 'up',
      icon: 'DollarSign',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      id: 'apy',
      title: 'Average APY',
      value: '8.7%',
      change: '+0.3%',
      trend: 'up',
      icon: 'TrendingUp',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      id: 'wells',
      title: 'Active Wells',
      value: '47',
      change: '+3',
      trend: 'up',
      icon: 'Droplets',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      id: 'liters',
      title: 'Daily Liters',
      value: '125K',
      change: '+8.2%',
      trend: 'up',
      icon: 'Activity',
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      id: 'families',
      title: 'Families Served',
      value: '3,250',
      change: '+156',
      trend: 'up',
      icon: 'Users',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    }
  ];

  const getTrendIcon = (trend) => {
    return trend === 'up' ? 'ArrowUp' : trend === 'down' ? 'ArrowDown' : 'Minus';
  };

  const getTrendColor = (trend) => {
    return trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-muted-foreground';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {kpiData?.map((kpi) => (
        <div key={kpi?.id} className="bg-card border border-border rounded-lg p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${kpi?.bgColor}`}>
              <Icon name={kpi?.icon} size={20} className={kpi?.color} />
            </div>
            <div className={`flex items-center text-sm ${getTrendColor(kpi?.trend)}`}>
              <Icon name={getTrendIcon(kpi?.trend)} size={14} className="mr-1" />
              <span className="font-medium">{kpi?.change}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">{kpi?.value}</div>
            <div className="text-sm text-muted-foreground">{kpi?.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPIMetricsGrid;