'use client';

import ProofPill from '@/components/ProofPill';

export default function TestProofPillPage() {
  const testWellIds = [
    'cmfy26rnp000hwif4vpydztra', // Sunrise Valley Well
    'cmfy26rnp000jwif4die5e9mz', // Green Hills Water Source
    'cmfy26rnq000lwif4clw0svla'  // Blue Valley Well
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          ProofPill Component Test
        </h1>
        
        <div className="space-y-8">
          {testWellIds.map((wellId, index) => (
            <div key={wellId} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Test Well #{index + 1}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Well ID: <code className="bg-gray-100 px-2 py-1 rounded">{wellId}</code>
              </p>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-700 mb-3">
                  ProofPill Component:
                </h3>
                <ProofPill 
                  hashscanUrl={`https://hashscan.io/testnet/topic/${wellId}`}
                  mirrorUrl={`https://testnet.mirrornode.hedera.com/api/v1/topics/${wellId}`}
                  idLabel="Topic"
                />
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded">
                <h4 className="font-medium text-gray-700 mb-2">Expected Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• HashScan link with external icon</li>
                  <li>• Mirror Node link with external icon</li>
                  <li>• Copy-to-clipboard buttons for Topic ID</li>
                  <li>• Token ID copy button (if available)</li>
                  <li>• File ID copy button (if available)</li>
                  <li>• Visual feedback when copying (check icon)</li>
                </ul>
              </div>
            </div>
          ))}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              Testing Instructions
            </h2>
            <div className="space-y-3 text-blue-700">
              <p><strong>1. Click HashScan links</strong> - Should open HashScan topic pages in new tabs</p>
              <p><strong>2. Click Mirror links</strong> - Should open Mirror Node API endpoints in new tabs</p>
              <p><strong>3. Test copy buttons</strong> - Click copy icons to copy Topic/Token/File IDs to clipboard</p>
              <p><strong>4. Visual feedback</strong> - Copy buttons should show check mark for 2 seconds after copying</p>
              <p><strong>5. Responsive design</strong> - Component should work well on different screen sizes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}