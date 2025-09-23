import React from 'react';
import Icon from '../../../components/AppIcon';

const OperatorKPICards = () => {
  const kpiData = [
    {
      id: 'total-projects',
      title: 'Total Projects',
      value: '12',
      change: '+2',
      changeType: 'positive',
      icon: 'Building',
      description: 'Active water infrastructure projects'
    },
    {
      id: 'total-funding',
      title: 'Total Funding Raised',
      value: '$485K',
      change: '+$125K',
      changeType: 'positive',
      icon: 'DollarSign',
      description: 'Cumulative funding across all projects'
    },
    {
      id: 'active-wells',
      title: 'Operational Wells',
      value: '8',
      change: '+3',
      changeType: 'positive',
      icon: 'Droplets',
      description: 'Wells currently generating revenue'
    },
    {
      id: 'monthly-revenue',
      title: 'Monthly Revenue',
      value: '$2,340',
      change: '+18%',
      changeType: 'positive',
      icon: 'TrendingUp',
      description: 'Total operator revenue this month'
    },
    {
      id: 'communities-served',
      title: 'Communities Served',
      value: '15,200',
      change: '+2,100',
      changeType: 'positive',
      icon: 'Users',
      description: 'People with access to clean water'
    },
    {
      id: 'avg-completion',
      title: 'Avg. Project Completion',
      value: '87%',
      change: '+5%',
      changeType: 'positive',
      icon: 'CheckCircle',
      description: 'Average milestone completion rate'
    }
  ];

  const getChangeColor = (changeType) => {
    switch (changeType) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case 'positive':
        return 'TrendingUp';
      case 'negative':
        return 'TrendingDown';
      default:
        return 'Minus';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpiData?.map((kpi) => (
        <div key={kpi?.id} className="bg-card rounded-lg border border-border p-6 hover:shadow-card transition-smooth">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                <Icon name={kpi?.icon} size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">{kpi?.title}</h3>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-2xl font-bold text-foreground">{kpi?.value}</div>
            
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 ${getChangeColor(kpi?.changeType)}`}>
                <Icon name={getChangeIcon(kpi?.changeType)} size={14} />
                <span className="text-sm font-medium">{kpi?.change}</span>
              </div>
              <span className="text-sm text-muted-foreground">vs last month</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {kpi?.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OperatorKPICards;