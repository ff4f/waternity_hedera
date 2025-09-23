import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import ProofPillComponent from '../../../components/ui/ProofPillComponent';

const AuditAnchorSystem = () => {
  const [auditRecords, setAuditRecords] = useState([
    {
      id: 'AUDIT-001',
      wellId: 'WELL-NE-001',
      wellName: 'Ngong Hills Community Well',
      recordType: 'Settlement',
      merkleRoot: '0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      transactionCount: 156,
      dataSize: '2.4 MB',
      status: 'anchored',
      anchoredAt: '2024-08-25T18:30:00Z',
      hcsTopicId: '0.0.123456',
      ipfsCid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
      downloadUrl: '/reports/audit-001.pdf'
    },
    {
      id: 'AUDIT-002',
      wellId: 'WELL-NE-002',
      wellName: 'Kibera Access Point',
      recordType: 'Milestone Verification',
      merkleRoot: '0x60303ae22b998861bce3b28f33eec1be758a213c86c93c076dbe9f558c11c752',
      transactionCount: 89,
      dataSize: '1.8 MB',
      status: 'generating',
      anchoredAt: null,
      hcsTopicId: null,
      ipfsCid: null,
      downloadUrl: null
    },
    {
      id: 'AUDIT-003',
      wellId: 'WELL-NE-001',
      wellName: 'Ngong Hills Community Well',
      recordType: 'Revenue Distribution',
      merkleRoot: '0x5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5',
      transactionCount: 234,
      dataSize: '3.1 MB',
      status: 'pending',
      anchoredAt: null,
      hcsTopicId: null,
      ipfsCid: null,
      downloadUrl: null
    }
  ]);

  const [selectedRecord, setSelectedRecord] = useState(auditRecords?.[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAuditReport = async (recordId) => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      const mockHcsTopicId = '0.0.' + Math.floor(Math.random() * 999999);
      const mockIpfsCid = 'Qm' + Math.random()?.toString(36)?.substr(2, 44);
      
      setAuditRecords(prev => prev?.map(record => 
        record?.id === recordId 
          ? { 
              ...record, 
              status: 'anchored',
              anchoredAt: new Date()?.toISOString(),
              hcsTopicId: mockHcsTopicId,
              ipfsCid: mockIpfsCid,
              downloadUrl: `/reports/${recordId?.toLowerCase()}.pdf`
            }
          : record
      ));

      if (selectedRecord?.id === recordId) {
        setSelectedRecord(prev => ({
          ...prev,
          status: 'anchored',
          anchoredAt: new Date()?.toISOString(),
          hcsTopicId: mockHcsTopicId,
          ipfsCid: mockIpfsCid,
          downloadUrl: `/reports/${recordId?.toLowerCase()}.pdf`
        }));
      }

      setIsGenerating(false);
    }, 4000);
  };

  const downloadReport = (record) => {
    // Simulate PDF download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `${record?.wellName}-${record?.recordType}-${record?.id}.pdf`;
    link?.click();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'anchored':
        return 'text-success bg-success/10';
      case 'generating':
        return 'text-warning bg-warning/10';
      case 'pending':
        return 'text-muted-foreground bg-muted';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'anchored':
        return 'Shield';
      case 'generating':
        return 'Loader2';
      case 'pending':
        return 'Clock';
      default:
        return 'FileText';
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name="Archive" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Audit Anchor System</h3>
            <p className="text-sm text-muted-foreground">Merkle proof generation and HCS anchoring</p>
          </div>
        </div>
        <Button
          variant="default"
          onClick={() => generateAuditReport(selectedRecord?.id)}
          disabled={isGenerating || selectedRecord?.status === 'anchored'}
          loading={isGenerating}
          iconName="Plus"
          iconPosition="left"
        >
          Generate Report
        </Button>
      </div>
      {/* Record Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">Select Audit Record</label>
        <select
          value={selectedRecord?.id}
          onChange={(e) => setSelectedRecord(auditRecords?.find(r => r?.id === e?.target?.value))}
          className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        >
          {auditRecords?.map(record => (
            <option key={record?.id} value={record?.id}>
              {record?.wellName} - {record?.recordType}
            </option>
          ))}
        </select>
      </div>
      {/* Record Details */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-foreground">Record Details</h4>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRecord?.status)}`}>
            <Icon 
              name={getStatusIcon(selectedRecord?.status)} 
              size={12} 
              className={`inline mr-1 ${selectedRecord?.status === 'generating' ? 'animate-spin' : ''}`} 
            />
            {selectedRecord?.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Record Type</label>
            <div className="font-medium text-foreground">{selectedRecord?.recordType}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Transaction Count</label>
            <div className="font-medium text-foreground">{selectedRecord?.transactionCount?.toLocaleString()}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Data Size</label>
            <div className="font-medium text-foreground">{selectedRecord?.dataSize}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Well ID</label>
            <div className="font-medium text-foreground">{selectedRecord?.wellId}</div>
          </div>
        </div>
      </div>
      {/* Merkle Root */}
      <div className="mb-6 p-4 border border-border rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-foreground">Merkle Root</h4>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigator.clipboard?.writeText(selectedRecord?.merkleRoot)}
          >
            <Icon name="Copy" size={16} />
          </Button>
        </div>
        <div className="font-mono text-sm bg-muted p-3 rounded break-all text-foreground">
          {selectedRecord?.merkleRoot}
        </div>
      </div>
      {/* Blockchain Anchoring */}
      {selectedRecord?.status === 'anchored' && (
        <div className="mb-6 space-y-4">
          <h4 className="font-semibold text-foreground">Blockchain Anchoring</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">HCS Topic ID</span>
                <ProofPillComponent
                  transactionHash={selectedRecord?.hcsTopicId}
                  status="verified"
                  size="sm"
                  onVerificationClick={() => window.open(`https://hashscan.io/mainnet/topic/${selectedRecord?.hcsTopicId}`, '_blank')}
                />
              </div>
              <div className="font-mono text-sm text-foreground">
                {selectedRecord?.hcsTopicId}
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">IPFS CID</span>
                <button
                  onClick={() => window.open(`https://ipfs.io/ipfs/${selectedRecord?.ipfsCid || mockIpfsCid}/manifest.json`, '_blank')}
                  className="inline-flex items-center text-sky-700 underline"
                >
                  <Icon name="ExternalLink" size={14} />
                  <span className="ml-1">Open Manifest</span>
                </button>
              </div>
              <div className="font-mono text-sm text-foreground break-all">
                {selectedRecord?.ipfsCid}
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Anchored: {new Date(selectedRecord.anchoredAt)?.toLocaleString()}
          </div>
        </div>
      )}
      {/* Actions */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => downloadReport(selectedRecord)}
            disabled={selectedRecord?.status !== 'anchored'}
            iconName="Download"
            iconPosition="left"
            fullWidth
          >
            Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`https://hashscan.io/mainnet/topic/${selectedRecord?.hcsTopicId}`, '_blank')}
            disabled={!selectedRecord?.hcsTopicId}
            iconName="ExternalLink"
            iconPosition="left"
            fullWidth
          >
            View on HashScan
          </Button>
        </div>

        {selectedRecord?.status === 'pending' && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-center text-warning text-sm">
              <Icon name="Clock" size={16} className="mr-2" />
              Waiting for transaction confirmations before generating audit report
            </div>
          </div>
        )}
      </div>
      {/* Audit Records List */}
      <div className="mt-8 space-y-4">
        <h4 className="font-semibold text-foreground">Recent Audit Records</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {auditRecords?.map((record) => (
            <div 
              key={record?.id} 
              className={`p-3 border rounded-lg cursor-pointer transition-smooth hover:bg-muted/50 ${
                selectedRecord?.id === record?.id ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onClick={() => setSelectedRecord(record)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">{record?.wellName}</div>
                  <div className="text-sm text-muted-foreground">{record?.recordType}</div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record?.status)}`}>
                    {record?.status}
                  </span>
                  <div className="text-xs text-muted-foreground mt-1">
                    {record?.transactionCount} txns
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuditAnchorSystem;