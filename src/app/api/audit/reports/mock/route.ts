import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wellId = searchParams.get('wellId');
  const format = searchParams.get('format');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!wellId) {
    return NextResponse.json({ error: 'wellId is required' }, { status: 400 });
  }

  // Mock data for testing
  const mockData = [
    {
      timestamp: '2024-01-15T10:30:00Z',
      wellId: wellId,
      wellName: 'Sunrise Valley Well',
      eventType: 'WATER_QUALITY_TEST',
      messageId: '0.0.12345-1705315800-001',
      topicId: '0.0.12345',
      tokenId: '0.0.67890',
      fileId: '0.0.98765',
      hashscanUrl: 'https://hashscan.io/testnet/topic/0.0.12345',
      mirrorUrl: 'https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.12345/messages',
      ph: '7.2',
      turbidity: '0.5',
      temperature: '22.5',
      status: 'PASSED'
    },
    {
      timestamp: '2024-01-20T14:15:00Z',
      wellId: wellId,
      wellName: 'Sunrise Valley Well',
      eventType: 'SETTLEMENT',
      messageId: '0.0.12345-1705747700-002',
      topicId: '0.0.12345',
      tokenId: '0.0.67890',
      fileId: '0.0.98766',
      hashscanUrl: 'https://hashscan.io/testnet/topic/0.0.12345',
      mirrorUrl: 'https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.12345/messages',
      amount: '150.00',
      currency: 'HBAR',
      status: 'COMPLETED'
    },
    {
      timestamp: '2024-02-01T09:45:00Z',
      wellId: wellId,
      wellName: 'Sunrise Valley Well',
      eventType: 'DOCUMENT_ANCHOR',
      messageId: '0.0.12345-1706780700-003',
      topicId: '0.0.12345',
      tokenId: '0.0.67890',
      fileId: '0.0.98767',
      hashscanUrl: 'https://hashscan.io/testnet/topic/0.0.12345',
      mirrorUrl: 'https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.12345/messages',
      documentType: 'COMPLIANCE_REPORT',
      documentHash: 'QmX1Y2Z3...',
      status: 'ANCHORED'
    }
  ];

  if (format === 'csv') {
    // Generate CSV content
    const headers = [
      'Timestamp',
      'Well ID',
      'Well Name',
      'Event Type',
      'Message ID',
      'Topic ID',
      'Token ID',
      'File ID',
      'HashScan URL',
      'Mirror URL',
      'pH',
      'Turbidity',
      'Temperature',
      'Amount',
      'Currency',
      'Document Type',
      'Document Hash',
      'Status'
    ];

    const csvRows = [headers.join(',')];
    
    mockData.forEach(row => {
      const csvRow = [
        row.timestamp,
        row.wellId,
        `"${row.wellName}"`,
        row.eventType,
        row.messageId,
        row.topicId,
        row.tokenId,
        row.fileId,
        `"${row.hashscanUrl}"`,
        `"${row.mirrorUrl}"`,
        row.ph || '',
        row.turbidity || '',
        row.temperature || '',
        row.amount || '',
        row.currency || '',
        row.documentType || '',
        row.documentHash || '',
        row.status
      ];
      csvRows.push(csvRow.join(','));
    });

    const csvContent = csvRows.join('\n');
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit_report_${wellId}_${startDate}_${endDate}.csv"`
      }
    });
  }

  // Return JSON format by default
  return NextResponse.json({
    wellId,
    dateRange: { startDate, endDate },
    data: mockData,
    total: mockData.length
  });
}