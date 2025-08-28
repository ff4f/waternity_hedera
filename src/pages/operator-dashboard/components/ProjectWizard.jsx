import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

import ProofPillComponent from '../../../components/ui/ProofPillComponent';

const ProjectWizard = ({ onStepComplete, currentProject }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [projectData, setProjectData] = useState({
    name: '',
    location: '',
    capex: '',
    targetCommunities: '',
    description: '',
    tariff: '0.0008'
  });
  const [qrCode, setQrCode] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState('disconnected');

  const steps = [
    {
      id: 1,
      title: 'Document Upload',
      description: 'Upload permits and site documentation',
      icon: 'Upload'
    },
    {
      id: 2,
      title: 'NFT Minting',
      description: 'Create Well NFT with project details',
      icon: 'Coins'
    },
    {
      id: 3,
      title: 'Device Pairing',
      description: 'Connect hardware and set tariffs',
      icon: 'Wifi'
    }
  ];

  const documentTypes = [
    { value: 'permit', label: 'Construction Permit' },
    { value: 'site_photo', label: 'Site Photos' },
    { value: 'survey', label: 'Geological Survey' },
    { value: 'environmental', label: 'Environmental Assessment' }
  ];

  const handleFileUpload = async (files) => {
    setIsUploading(true);
    const newFiles = [];

    for (let file of files) {
      // Simulate SHA-256 hash generation
      const hash = `sha256_${Math.random()?.toString(36)?.substring(2, 15)}`;
      const uploadedFile = {
        id: Date.now() + Math.random(),
        name: file?.name,
        size: file?.size,
        type: file?.type,
        hash: hash,
        status: 'uploading',
        progress: 0,
        hfsUrl: null
      };

      newFiles?.push(uploadedFile);
      setUploadedFiles(prev => [...prev, uploadedFile]);

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadedFiles(prev => 
          prev?.map(f => 
            f?.id === uploadedFile?.id 
              ? { ...f, progress }
              : f
          )
        );
      }

      // Complete upload
      setUploadedFiles(prev => 
        prev?.map(f => 
          f?.id === uploadedFile?.id 
            ? { 
                ...f, 
                status: 'completed',
                hfsUrl: `hfs://0.0.123456/${hash}`,
                transactionHash: `0x${Math.random()?.toString(16)?.substring(2, 42)}`
              }
            : f
        )
      );
    }

    setIsUploading(false);
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    const files = Array.from(e?.dataTransfer?.files);
    handleFileUpload(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e?.target?.files);
    handleFileUpload(files);
  };

  const generateQRCode = () => {
    const deviceId = `WELL_${Math.random()?.toString(36)?.substring(2, 8)?.toUpperCase()}`;
    setQrCode({
      deviceId,
      data: `waternity://pair/${deviceId}`,
      timestamp: new Date()?.toISOString()
    });
  };

  const handleDevicePairing = () => {
    setDeviceStatus('connecting');
    setTimeout(() => {
      setDeviceStatus('connected');
    }, 3000);
  };

  const mintNFT = async () => {
    // Simulate NFT minting process
    const nftData = {
      ...projectData,
      tokenId: `WELL-${Math.random()?.toString(36)?.substring(2, 8)?.toUpperCase()}`,
      contractAddress: '0x742d35Cc6634C0532925a3b8D4C9db4C4b8b8b8b',
      transactionHash: `0x${Math.random()?.toString(16)?.substring(2, 42)}`,
      metadata: {
        name: projectData?.name,
        description: projectData?.description,
        image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400',
        attributes: [
          { trait_type: 'Location', value: projectData?.location },
          { trait_type: 'CAPEX', value: `$${projectData?.capex}` },
          { trait_type: 'Target Communities', value: projectData?.targetCommunities }
        ]
      }
    };

    return nftData;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">Upload Project Documents</h3>
              <p className="text-muted-foreground">Upload permits, site photos, and technical documentation</p>
            </div>
            {/* Drag & Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e?.preventDefault()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-smooth cursor-pointer"
            >
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Icon name="Upload" size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  Drop files here or click to upload
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, Images, and Documents up to 10MB each
                </p>
              </label>
            </div>
            {/* Uploaded Files List */}
            {uploadedFiles?.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Uploaded Files</h4>
                {uploadedFiles?.map((file) => (
                  <div key={file?.id} className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Icon name="File" size={16} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{file?.name}</span>
                      </div>
                      {file?.status === 'completed' && (
                        <ProofPillComponent
                          transactionHash={file?.transactionHash}
                          status="verified"
                          size="sm"
                          onVerificationClick={() => {
                            // Handle verification click - could open transaction details
                            console.log('Verification clicked for:', file?.transactionHash);
                          }}
                        />
                      )}
                    </div>
                    
                    {file?.status === 'uploading' && (
                      <div className="w-full bg-muted rounded-full h-2 mb-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file?.progress}%` }}
                        ></div>
                      </div>
                    )}

                    {file?.status === 'completed' && (
                      <div className="text-xs text-muted-foreground font-mono">
                        Hash: {file?.hash}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">Create Well NFT</h3>
              <p className="text-muted-foreground">Define project details and mint your Well NFT</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Project Form */}
              <div className="space-y-4">
                <Input
                  label="Project Name"
                  placeholder="e.g., Ngong Hills Community Well"
                  value={projectData?.name}
                  onChange={(e) => setProjectData(prev => ({ ...prev, name: e?.target?.value }))}
                  required
                />

                <Input
                  label="Location"
                  placeholder="e.g., Ngong Hills, Kajiado County"
                  value={projectData?.location}
                  onChange={(e) => setProjectData(prev => ({ ...prev, location: e?.target?.value }))}
                  required
                />

                <Input
                  label="CAPEX (USD)"
                  type="number"
                  placeholder="50000"
                  value={projectData?.capex}
                  onChange={(e) => setProjectData(prev => ({ ...prev, capex: e?.target?.value }))}
                  required
                />

                <Input
                  label="Target Communities"
                  type="number"
                  placeholder="1250"
                  value={projectData?.targetCommunities}
                  onChange={(e) => setProjectData(prev => ({ ...prev, targetCommunities: e?.target?.value }))}
                  required
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Project Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                    rows={4}
                    placeholder="Describe the water infrastructure project..."
                    value={projectData?.description}
                    onChange={(e) => setProjectData(prev => ({ ...prev, description: e?.target?.value }))}
                  />
                </div>
              </div>

              {/* NFT Preview */}
              <div className="bg-muted/30 rounded-lg p-6">
                <h4 className="font-medium text-foreground mb-4">NFT Preview</h4>
                <div className="bg-card rounded-lg p-4 border border-border">
                  <Image
                    src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400"
                    alt="Well NFT Preview"
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                  <h5 className="font-semibold text-foreground mb-2">
                    {projectData?.name || 'Project Name'}
                  </h5>
                  <p className="text-sm text-muted-foreground mb-3">
                    {projectData?.location || 'Location'}
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CAPEX:</span>
                      <span className="text-foreground">${projectData?.capex || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Communities:</span>
                      <span className="text-foreground">{projectData?.targetCommunities || '0'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">Device Pairing & Tariff Setup</h3>
              <p className="text-muted-foreground">Connect hardware devices and configure pricing</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {/* QR Code Generation */}
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-6 text-center">
                  <h4 className="font-medium text-foreground mb-4">Device Pairing</h4>
                  
                  {!qrCode ? (
                    <div className="space-y-4">
                      <Icon name="Smartphone" size={48} className="mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Generate QR code to pair with meter/valve hardware
                      </p>
                      <Button onClick={generateQRCode} iconName="QrCode" iconPosition="left">
                        Generate QR Code
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg inline-block">
                        <div className="w-32 h-32 bg-gray-900 rounded flex items-center justify-center">
                          <Icon name="QrCode" size={64} className="text-white" />
                        </div>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        Device ID: {qrCode?.deviceId}
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          deviceStatus === 'connected' ? 'bg-success' : 
                          deviceStatus === 'connecting'? 'bg-warning animate-pulse' : 'bg-muted-foreground'
                        }`}></div>
                        <span className="text-sm text-muted-foreground capitalize">
                          {deviceStatus}
                        </span>
                      </div>
                      {deviceStatus === 'disconnected' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleDevicePairing}
                          iconName="Wifi"
                          iconPosition="left"
                        >
                          Connect Device
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Network Status */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h5 className="font-medium text-foreground mb-3">Network Status</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Hedera Network:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <span className="text-success">Connected</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">HCS Topic:</span>
                      <span className="text-foreground font-mono text-xs">0.0.123456</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">HTS Token:</span>
                      <span className="text-foreground font-mono text-xs">0.0.789012</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tariff Configuration */}
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-6">
                  <h4 className="font-medium text-foreground mb-4">Tariff Configuration</h4>
                  
                  <div className="space-y-4">
                    <Input
                      label="Price per Liter (USDC)"
                      type="number"
                      step="0.0001"
                      placeholder="0.0008"
                      value={projectData?.tariff}
                      onChange={(e) => setProjectData(prev => ({ ...prev, tariff: e?.target?.value }))}
                      description="Recommended: $0.0008 - $0.0012 per liter"
                    />

                    <div className="bg-card rounded-lg p-4 border border-border">
                      <h5 className="font-medium text-foreground mb-3">Revenue Projection</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Daily Volume:</span>
                          <span className="text-foreground">5,000 L</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Daily Revenue:</span>
                          <span className="text-foreground">
                            ${(5000 * parseFloat(projectData?.tariff || 0))?.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monthly Revenue:</span>
                          <span className="text-success font-medium">
                            ${(5000 * parseFloat(projectData?.tariff || 0) * 30)?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card rounded-lg p-4 border border-border">
                      <h5 className="font-medium text-foreground mb-3">Revenue Split</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Operator (50%):</span>
                          <span className="text-foreground">
                            ${(5000 * parseFloat(projectData?.tariff || 0) * 30 * 0.5)?.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Investors (40%):</span>
                          <span className="text-foreground">
                            ${(5000 * parseFloat(projectData?.tariff || 0) * 30 * 0.4)?.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platform (10%):</span>
                          <span className="text-foreground">
                            ${(5000 * parseFloat(projectData?.tariff || 0) * 30 * 0.1)?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return uploadedFiles?.some(file => file?.status === 'completed');
      case 2:
        return projectData?.name && projectData?.location && projectData?.capex && projectData?.targetCommunities;
      case 3:
        return deviceStatus === 'connected' && projectData?.tariff;
      default:
        return false;
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 3) {
      // Complete the wizard
      const nftData = await mintNFT();
      onStepComplete(nftData);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps?.map((step, index) => (
          <div key={step?.id} className="flex items-center">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 transition-smooth
              ${currentStep >= step?.id 
                ? 'bg-primary border-primary text-primary-foreground' 
                : 'border-border text-muted-foreground'
              }
            `}>
              {currentStep > step?.id ? (
                <Icon name="Check" size={16} />
              ) : (
                <Icon name={step?.icon} size={16} />
              )}
            </div>
            <div className="ml-3 hidden sm:block">
              <div className={`text-sm font-medium ${
                currentStep >= step?.id ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step?.title}
              </div>
              <div className="text-xs text-muted-foreground">{step?.description}</div>
            </div>
            {index < steps?.length - 1 && (
              <div className={`w-12 h-0.5 mx-4 ${
                currentStep > step?.id ? 'bg-primary' : 'bg-border'
              }`}></div>
            )}
          </div>
        ))}
      </div>
      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>
      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => prev - 1)}
          disabled={currentStep === 1}
          iconName="ChevronLeft"
          iconPosition="left"
        >
          Previous
        </Button>

        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {steps?.length}
        </div>

        <Button
          onClick={handleNextStep}
          disabled={!canProceedToNextStep() || isUploading}
          loading={isUploading}
          iconName={currentStep === 3 ? "Coins" : "ChevronRight"}
          iconPosition="right"
        >
          {currentStep === 3 ? 'Mint NFT' : 'Next'}
        </Button>
      </div>
    </div>
  );
};

export default ProjectWizard;