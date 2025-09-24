'use client';

import { useState } from 'react';
import { Download, FileText, AlertCircle } from 'lucide-react';

export default function TestCSVExportPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  
  const testWellIds = [
    'cmfy26rnp000hwif4vpydztra', // Sunrise Valley Well
    'cmfy26rnp000jwif4die5e9mz', // Green Hills Water Source
    'cmfy26rnq000lwif4clw0svla'  // Blue Valley Well
  ];

  const downloadCSV = async (wellId: string, wellName: string) => {
    setIsDownloading(true);
    setDownloadStatus('');
    
    try {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      
      const url = `/api/audit/reports?wellId=${wellId}&format=csv&startDate=${startDate}&endDate=${endDate}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        setDownloadStatus(`Error: ${response.status} - ${errorText}`);
        return;
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `audit_report_${wellName.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
      setDownloadStatus(`Successfully downloaded CSV for ${wellName}`);
      
    } catch (error) {
      setDownloadStatus(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const wellNames = [
    'Sunrise Valley Well',
    'Green Hills Water Source', 
    'Blue Valley Well'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          CSV Export Test
        </h1>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-yellow-800 font-medium">Authentication Note</h3>
              <p className="text-yellow-700 text-sm mt-1">
                The audit reports API requires authentication. These downloads may fail with "unauthorized" errors.
                This is expected behavior for the current implementation.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {testWellIds.map((wellId, index) => (
            <div key={wellId} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {wellNames[index]}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Well ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{wellId}</code>
                  </p>
                </div>
                
                <button
                  onClick={() => downloadCSV(wellId, wellNames[index])}
                  disabled={isDownloading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDownloading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {isDownloading ? 'Downloading...' : 'Download CSV'}
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Date Range:</strong> 2024-01-01 to 2024-12-31</p>
                <p><strong>Format:</strong> CSV</p>
                <p><strong>Expected Content:</strong> Audit trail data, water quality records, settlements</p>
              </div>
            </div>
          ))}
        </div>
        
        {downloadStatus && (
          <div className={`mt-6 p-4 rounded-lg ${
            downloadStatus.includes('Error') || downloadStatus.includes('failed')
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            <div className="flex items-start">
              <FileText className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
              <p>{downloadStatus}</p>
            </div>
          </div>
        )}
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            CSV Testing Instructions
          </h2>
          <div className="space-y-3 text-blue-700">
            <p><strong>1. Download Test:</strong> Click "Download CSV" buttons to test the download functionality</p>
            <p><strong>2. File Format:</strong> Check if downloaded files open cleanly in Excel/Google Sheets</p>
            <p><strong>3. Data Validation:</strong> Verify CSV contains proper headers and data structure</p>
            <p><strong>4. Error Handling:</strong> Note any authentication errors (expected for current setup)</p>
            <p><strong>5. File Naming:</strong> Check if downloaded files have descriptive names with dates</p>
          </div>
        </div>
      </div>
    </div>
  );
}