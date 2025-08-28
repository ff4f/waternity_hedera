import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import ProofPillComponent from '../../../components/ui/ProofPillComponent';

const QRMilestoneManager = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [milestones, setMilestones] = useState([
    {
      id: 1,
      wellId: 'WELL-NE-001',
      milestone: 'Permit Approval',
      progress: 100,
      status: 'completed',
      fundRelease: '12.5%',
      scannedAt: '2024-08-20T14:30:00Z',
      transactionHash: '0x742d35Cc6634C0532925a3b8D4C9db4C4b8b8b8b',
      signature: 'verified'
    },
    {
      id: 2,
      wellId: 'WELL-NE-001',
      milestone: 'Drilling Complete',
      progress: 100,
      status: 'completed',
      fundRelease: '25%',
      scannedAt: '2024-08-22T09:15:00Z',
      transactionHash: '0x8b8b8b4C4b8b8b8bC0532925a3b8D4C9db4C742d35',
      signature: 'verified'
    },
    {
      id: 3,
      wellId: 'WELL-NE-001',
      milestone: 'Casing Installation',
      progress: 75,
      status: 'in-progress',
      fundRelease: '15%',
      scannedAt: null,
      transactionHash: null,
      signature: 'pending'
    },
    {
      id: 4,
      wellId: 'WELL-NE-002',
      milestone: 'Pump Installation',
      progress: 0,
      status: 'pending',
      fundRelease: '20%',
      scannedAt: null,
      transactionHash: null,
      signature: 'pending'
    }
  ]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices?.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef?.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Camera access is required for QR scanning');
    }
  };

  const stopScanning = () => {
    if (videoRef?.current && videoRef?.current?.srcObject) {
      const tracks = videoRef?.current?.srcObject?.getTracks();
      tracks?.forEach(track => track?.stop());
    }
    setIsScanning(false);
  };

  const simulateQRScan = () => {
    // Simulate QR code scan with mock data
    const mockScanData = {
      wellId: 'WELL-NE-001',
      milestone: 'Casing Installation',
      nonce: Date.now(),
      signature: 'mock_signature_' + Date.now(),
      timestamp: new Date()?.toISOString()
    };
    
    setScannedData(mockScanData);
    stopScanning();
    
    // Update milestone status
    setMilestones(prev => prev?.map(m => 
      m?.wellId === mockScanData?.wellId && m?.milestone === mockScanData?.milestone
        ? { 
            ...m, 
            progress: 100, 
            status: 'completed',
            scannedAt: mockScanData?.timestamp,
            transactionHash: '0x' + Math.random()?.toString(16)?.substr(2, 40),
            signature: 'verified'
          }
        : m
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10';
      case 'in-progress':
        return 'text-warning bg-warning/10';
      case 'pending':
        return 'text-muted-foreground bg-muted';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getProgressColor = (progress) => {
    if (progress === 100) return 'bg-success';
    if (progress > 50) return 'bg-warning';
    return 'bg-primary';
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="bg-card rounded-lg border border-border p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name="QrCode" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">QR Milestone Manager</h3>
            <p className="text-sm text-muted-foreground">Scan progress updates with anti-replay protection</p>
          </div>
        </div>
        <Button
          variant={isScanning ? "destructive" : "default"}
          onClick={isScanning ? stopScanning : startScanning}
          iconName={isScanning ? "Square" : "Camera"}
          iconPosition="left"
        >
          {isScanning ? 'Stop Scan' : 'Start Scan'}
        </Button>
      </div>
      {/* Camera View */}
      {isScanning && (
        <div className="mb-6 relative">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-primary rounded-lg relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={simulateQRScan}
              iconName="Scan"
              iconPosition="left"
            >
              Simulate QR Scan
            </Button>
          </div>
        </div>
      )}
      {/* Scanned Data Display */}
      {scannedData && (
        <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-success">QR Scan Successful</h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setScannedData(null)}
            >
              <Icon name="X" size={16} />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Well ID:</span>
              <div className="font-medium text-foreground">{scannedData?.wellId}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Milestone:</span>
              <div className="font-medium text-foreground">{scannedData?.milestone}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Nonce:</span>
              <div className="font-mono text-xs text-foreground">{scannedData?.nonce}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Signature:</span>
              <div className="font-mono text-xs text-success">Verified</div>
            </div>
          </div>
        </div>
      )}
      {/* Milestones List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <h4 className="font-semibold text-foreground">Active Milestones</h4>
        {milestones?.map((milestone) => (
          <div key={milestone?.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-smooth">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(milestone?.status)}`}>
                    {milestone?.status}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-foreground">{milestone?.milestone}</div>
                  <div className="text-sm text-muted-foreground">{milestone?.wellId}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">{milestone?.fundRelease}</div>
                <div className="text-xs text-muted-foreground">Fund Release</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{milestone?.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(milestone?.progress)}`}
                  style={{ width: `${milestone?.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {milestone?.scannedAt ? (
                  `Scanned: ${new Date(milestone.scannedAt)?.toLocaleDateString()}`
                ) : (
                  'Awaiting scan verification'
                )}
              </div>
              {milestone?.transactionHash && (
                <ProofPillComponent
                  transactionHash={milestone?.transactionHash}
                  status="verified"
                  size="sm"
                  onVerificationClick={() => {}}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QRMilestoneManager;