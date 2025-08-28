import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ValveControlPanel = () => {
  const [wells, setWells] = useState([
    {
      id: 'WELL-NE-001',
      name: 'Ngong Hills Community Well',
      location: 'Ngong Hills, Kenya',
      status: 'active',
      flowRate: 4.2,
      maxFlow: 5.0,
      valveStatus: 'open',
      coverage: 85,
      lastPayment: '2024-08-25T10:30:00Z',
      paymentStatus: 'current',
      emergencyShutoff: false
    },
    {
      id: 'WELL-NE-002',
      name: 'Kibera Access Point',
      location: 'Kibera, Nairobi',
      status: 'active',
      flowRate: 3.8,
      maxFlow: 4.5,
      valveStatus: 'open',
      coverage: 92,
      lastPayment: '2024-08-24T15:45:00Z',
      paymentStatus: 'current',
      emergencyShutoff: false
    },
    {
      id: 'WELL-NE-003',
      name: 'Mathare Valley Well',
      location: 'Mathare, Nairobi',
      status: 'warning',
      flowRate: 1.2,
      maxFlow: 3.0,
      valveStatus: 'restricted',
      coverage: 45,
      lastPayment: '2024-08-20T08:20:00Z',
      paymentStatus: 'overdue',
      emergencyShutoff: false
    }
  ]);

  const [selectedWell, setSelectedWell] = useState(wells?.[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleValveControl = async (wellId, action) => {
    setIsProcessing(true);
    
    // Simulate valve control operation
    setTimeout(() => {
      setWells(prev => prev?.map(well => 
        well?.id === wellId 
          ? { 
              ...well, 
              valveStatus: action,
              flowRate: action === 'open' ? well?.maxFlow * 0.85 : 0,
              emergencyShutoff: action === 'emergency_close'
            }
          : well
      ));
      
      if (selectedWell?.id === wellId) {
        setSelectedWell(prev => ({
          ...prev,
          valveStatus: action,
          flowRate: action === 'open' ? prev?.maxFlow * 0.85 : 0,
          emergencyShutoff: action === 'emergency_close'
        }));
      }
      
      setIsProcessing(false);
    }, 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-success bg-success/10';
      case 'warning':
        return 'text-warning bg-warning/10';
      case 'offline':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getValveStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'text-success';
      case 'restricted':
        return 'text-warning';
      case 'closed':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getCoverageColor = (coverage) => {
    if (coverage >= 80) return 'text-success';
    if (coverage >= 60) return 'text-warning';
    return 'text-error';
  };

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setWells(prev => prev?.map(well => ({
        ...well,
        flowRate: well?.valveStatus === 'open' 
          ? Math.max(0, well?.flowRate + (Math.random() - 0.5) * 0.2)
          : 0,
        coverage: Math.min(100, Math.max(0, well?.coverage + (Math.random() - 0.5) * 2))
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card rounded-lg border border-border p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <Icon name="Gauge" size={20} className="text-secondary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Valve Control Panel</h3>
            <p className="text-sm text-muted-foreground">Real-time flow monitoring and emergency controls</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Live</span>
        </div>
      </div>
      {/* Well Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">Select Well</label>
        <select
          value={selectedWell?.id}
          onChange={(e) => setSelectedWell(wells?.find(w => w?.id === e?.target?.value))}
          className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        >
          {wells?.map(well => (
            <option key={well?.id} value={well?.id}>
              {well?.name} - {well?.location}
            </option>
          ))}
        </select>
      </div>
      {/* Coverage Gauge */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-foreground">Coverage Gauge</h4>
          <span className={`text-2xl font-bold ${getCoverageColor(selectedWell?.coverage)}`}>
            {selectedWell?.coverage}%
          </span>
        </div>
        
        <div className="relative">
          <div className="w-full bg-muted rounded-full h-4">
            <div 
              className={`h-4 rounded-full transition-all duration-500 ${
                selectedWell?.coverage >= 80 ? 'bg-success' :
                selectedWell?.coverage >= 60 ? 'bg-warning' : 'bg-error'
              }`}
              style={{ width: `${selectedWell?.coverage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
      {/* Flow Rate Monitor */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="p-4 border border-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Current Flow</span>
            <Icon name="Droplets" size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {selectedWell?.flowRate?.toFixed(1)} L/min
          </div>
          <div className="text-xs text-muted-foreground">
            Max: {selectedWell?.maxFlow} L/min
          </div>
        </div>

        <div className="p-4 border border-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Valve Status</span>
            <Icon 
              name={selectedWell?.valveStatus === 'open' ? 'Unlock' : 'Lock'} 
              size={16} 
              className={getValveStatusColor(selectedWell?.valveStatus)} 
            />
          </div>
          <div className={`text-lg font-semibold capitalize ${getValveStatusColor(selectedWell?.valveStatus)}`}>
            {selectedWell?.valveStatus}
          </div>
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date()?.toLocaleTimeString()}
          </div>
        </div>
      </div>
      {/* Valve Controls */}
      <div className="mb-6 space-y-3">
        <h4 className="font-semibold text-foreground">Valve Controls</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="success"
            onClick={() => handleValveControl(selectedWell?.id, 'open')}
            disabled={isProcessing || selectedWell?.valveStatus === 'open'}
            loading={isProcessing}
            iconName="Unlock"
            iconPosition="left"
            fullWidth
          >
            Open Valve
          </Button>
          
          <Button
            variant="warning"
            onClick={() => handleValveControl(selectedWell?.id, 'restricted')}
            disabled={isProcessing}
            loading={isProcessing}
            iconName="AlertTriangle"
            iconPosition="left"
            fullWidth
          >
            Restrict Flow
          </Button>
          
          <Button
            variant="destructive"
            onClick={() => handleValveControl(selectedWell?.id, 'emergency_close')}
            disabled={isProcessing}
            loading={isProcessing}
            iconName="ShieldAlert"
            iconPosition="left"
            fullWidth
          >
            Emergency Stop
          </Button>
        </div>
      </div>
      {/* Payment Status */}
      <div className="p-4 border border-border rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-foreground">Payment Status</h4>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            selectedWell?.paymentStatus === 'current' ?'text-success bg-success/10' :'text-error bg-error/10'
          }`}>
            {selectedWell?.paymentStatus}
          </span>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Last Payment: {new Date(selectedWell.lastPayment)?.toLocaleDateString()}
        </div>
        
        {selectedWell?.paymentStatus === 'overdue' && (
          <div className="mt-3 p-3 bg-error/10 border border-error/20 rounded-lg">
            <div className="flex items-center text-error text-sm">
              <Icon name="AlertCircle" size={16} className="mr-2" />
              Payment overdue - Consider flow restriction
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValveControlPanel;