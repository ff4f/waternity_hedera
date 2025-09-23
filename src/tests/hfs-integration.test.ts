import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  Client,
  FileCreateTransaction,
  FileAppendTransaction,
  FileInfoQuery,
  FileContentsQuery,
  FileDeleteTransaction,
  PrivateKey,
  AccountId,
  FileId,
  Hbar
} from '@hashgraph/sdk';
import { prisma } from '@/lib/prisma';
import { getHederaNetworkEndpoints } from '@/lib/env';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * HFS Integration Tests
 * Tests actual Hedera File Service integration with testnet
 * 
 * Prerequisites:
 * - Valid Hedera testnet account with HBAR balance
 * - HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY environment variables
 * - Network connectivity to Hedera testnet
 */
describe('HFS Integration Tests', () => {
  let client: Client;
  let operatorAccountId: AccountId;
  let operatorPrivateKey: PrivateKey;
  let testFileIds: FileId[] = [];
  let testResults: Array<{
    testName: string;
    transactionId?: string;
    fileId?: string;
    status: 'PASS' | 'FAIL';
    error?: string;
    duration: number;
    metrics?: Record<string, any>;
  }> = [];

  beforeAll(async () => {
    // Verify environment variables
    const operatorAccountIdString = process.env.HEDERA_ACCOUNT_ID!;
    const operatorPrivateKeyString = process.env.HEDERA_PRIVATE_KEY!;
    
    if (!operatorAccountIdString || !operatorPrivateKeyString) {
      throw new Error('Missing required Hedera environment variables');
    }

    operatorAccountId = AccountId.fromString(operatorAccountIdString);
    operatorPrivateKey = PrivateKey.fromStringED25519(operatorPrivateKeyString);
    
    // Create Hedera client for testnet
    client = Client.forTestnet();
    client.setOperator(operatorAccountId, operatorPrivateKey);

    console.log(`Testing HFS against Hedera ${process.env.HEDERA_NETWORK || 'testnet'}`);
    console.log(`Operator Account: ${operatorAccountId.toString()}`);
  }, 30000);

  afterAll(async () => {
    // Clean up test files
    for (const fileId of testFileIds) {
      try {
        const deleteTransaction = new FileDeleteTransaction()
          .setFileId(fileId);
        await deleteTransaction.execute(client);
        console.log(`Cleaned up test file: ${fileId.toString()}`);
      } catch (error) {
        console.warn(`Failed to delete test file ${fileId.toString()}:`, error);
      }
    }

    if (client) {
      client.close();
    }

    // Generate test results summary
    console.log('\n=== HFS Integration Test Results ===');
    testResults.forEach(result => {
      console.log(`${result.status}: ${result.testName} (${result.duration}ms)`);
      if (result.transactionId) {
        console.log(`  Transaction ID: ${result.transactionId}`);
      }
      if (result.fileId) {
        console.log(`  File ID: ${result.fileId}`);
      }
      if (result.metrics) {
        console.log(`  Metrics: ${JSON.stringify(result.metrics)}`);
      }
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.document.deleteMany({
      where: {
        type: {
          startsWith: 'test-'
        }
      }
    });
  });

  it('should create file successfully', async () => {
    const startTime = Date.now();
    const testName = 'File Creation';
    
    try {
      const testContent = JSON.stringify({
        documentType: 'milestone_evidence',
        wellId: 'WELL-001',
        milestoneId: 'MS-001',
        evidence: {
          photos: ['photo1.jpg', 'photo2.jpg'],
          description: 'Well construction milestone completed',
          verifiedBy: 'Inspector John Doe',
          timestamp: new Date().toISOString()
        },
        metadata: {
          version: '1.0',
          hash: crypto.createHash('sha256').update('test-content').digest('hex')
        }
      }, null, 2);

      const fileCreateTx = new FileCreateTransaction()
        .setContents(testContent)
        .setKeys([operatorPrivateKey])
        .setFileMemo('Waternity Test Document - Milestone Evidence')
        .setMaxTransactionFee(new Hbar(2));

      const response = await fileCreateTx.execute(client);
      const receipt = await response.getReceipt(client);
      const newFileId = receipt.fileId!;

      expect(newFileId).toBeDefined();
      expect(newFileId.toString()).toMatch(/^0\.0\.[0-9]+$/);

      testFileIds.push(newFileId);

      // Verify file info
      const fileInfo = await new FileInfoQuery()
        .setFileId(newFileId)
        .execute(client);

      expect(fileInfo.fileId.toString()).toBe(newFileId.toString());
      expect(fileInfo.size.toString()).toBe(testContent.length.toString());
      expect(fileInfo.fileMemo).toBe('Waternity Test Document - Milestone Evidence');

      testResults.push({
        testName,
        transactionId: response.transactionId.toString(),
        fileId: newFileId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          fileSize: fileInfo.size.toString(),
          contentLength: testContent.length,
          fileMemo: fileInfo.fileMemo
        }
      });

      console.log(`✅ Created file: ${newFileId.toString()}`);
      console.log(`   Transaction: ${response.transactionId.toString()}`);
      console.log(`   Size: ${fileInfo.size.toString()} bytes`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 30000);

  it('should append content to existing file', async () => {
    const startTime = Date.now();
    const testName = 'File Content Append';
    
    try {
      // First create a file
      const initialContent = JSON.stringify({
        documentType: 'audit_report',
        wellId: 'WELL-002',
        auditDate: new Date().toISOString(),
        findings: ['Initial finding 1', 'Initial finding 2']
      });

      const fileCreateTx = new FileCreateTransaction()
        .setContents(initialContent)
        .setKeys([operatorPrivateKey])
        .setFileMemo('Waternity Test Audit Report')
        .setMaxTransactionFee(new Hbar(2));

      const createResponse = await fileCreateTx.execute(client);
      const createReceipt = await createResponse.getReceipt(client);
      const fileId = createReceipt.fileId!;
      testFileIds.push(fileId);

      // Get initial file size
      const initialFileInfo = await new FileInfoQuery()
        .setFileId(fileId)
        .execute(client);
      const initialSize = initialFileInfo.size;

      // Append additional content
      const appendContent = JSON.stringify({
        additionalFindings: ['Additional finding 1', 'Additional finding 2'],
        appendedAt: new Date().toISOString()
      });

      const fileAppendTx = new FileAppendTransaction()
        .setFileId(fileId)
        .setContents('\n' + appendContent)
        .setMaxTransactionFee(new Hbar(2));

      const appendResponse = await fileAppendTx.execute(client);
      const appendReceipt = await appendResponse.getReceipt(client);

      expect(appendReceipt.status.toString()).toBe('SUCCESS');

      // Verify new file size
      const finalFileInfo = await new FileInfoQuery()
        .setFileId(fileId)
        .execute(client);
      const finalSize = finalFileInfo.size;

      const expectedSize = initialSize.toNumber() + appendContent.length + 1; // +1 for newline
      expect(finalSize.toNumber()).toBe(expectedSize);

      testResults.push({
        testName,
        transactionId: appendResponse.transactionId.toString(),
        fileId: fileId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          initialSize: initialSize.toString(),
          finalSize: finalSize.toString(),
          appendedBytes: appendContent.length + 1
        }
      });

      console.log(`✅ Appended content to file: ${fileId.toString()}`);
      console.log(`   Transaction: ${appendResponse.transactionId.toString()}`);
      console.log(`   Size change: ${initialSize.toString()} → ${finalSize.toString()} bytes`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 45000);

  it('should retrieve file contents', async () => {
    const startTime = Date.now();
    const testName = 'File Content Retrieval';
    
    try {
      const originalContent = JSON.stringify({
        documentType: 'settlement_report',
        wellId: 'WELL-003',
        period: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        },
        revenue: {
          total: 1500.75,
          currency: 'USD',
          breakdown: {
            waterSales: 1200.50,
            maintenanceFees: 300.25
          }
        },
        distributions: [
          { investorId: 'INV-001', amount: 600.30, percentage: 40 },
          { investorId: 'INV-002', amount: 450.23, percentage: 30 },
          { investorId: 'INV-003', amount: 450.22, percentage: 30 }
        ]
      }, null, 2);

      // Create file with content
      const fileCreateTx = new FileCreateTransaction()
        .setContents(originalContent)
        .setKeys([operatorPrivateKey])
        .setFileMemo('Waternity Settlement Report')
        .setMaxTransactionFee(new Hbar(2));

      const createResponse = await fileCreateTx.execute(client);
      const createReceipt = await createResponse.getReceipt(client);
      const fileId = createReceipt.fileId!;
      testFileIds.push(fileId);

      // Wait a moment for the file to be available
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Retrieve file contents
      const fileContents = await new FileContentsQuery()
        .setFileId(fileId)
        .execute(client);

      const retrievedContent = new TextDecoder().decode(fileContents);
      expect(retrievedContent).toBe(originalContent);

      // Verify content integrity
      const originalHash = crypto.createHash('sha256').update(originalContent).digest('hex');
      const retrievedHash = crypto.createHash('sha256').update(retrievedContent).digest('hex');
      expect(retrievedHash).toBe(originalHash);

      // Parse and verify JSON structure
      const parsedContent = JSON.parse(retrievedContent);
      expect(parsedContent.documentType).toBe('settlement_report');
      expect(parsedContent.wellId).toBe('WELL-003');
      expect(parsedContent.revenue.total).toBe(1500.75);
      expect(parsedContent.distributions.length).toBe(3);

      testResults.push({
        testName,
        transactionId: createResponse.transactionId.toString(),
        fileId: fileId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          originalSize: originalContent.length,
          retrievedSize: retrievedContent.length,
          hashMatch: originalHash === retrievedHash,
          contentType: parsedContent.documentType
        }
      });

      console.log(`✅ Retrieved file contents: ${fileId.toString()}`);
      console.log(`   Size: ${retrievedContent.length} bytes`);
      console.log(`   Hash verified: ${originalHash === retrievedHash}`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 45000);

  it('should handle large file uploads', async () => {
    const startTime = Date.now();
    const testName = 'Large File Upload';
    
    try {
      // Create a large document (close to HFS file size limits)
      const largeDocument = {
        documentType: 'project_document',
        wellId: 'WELL-004',
        projectData: {
          specifications: Array.from({ length: 100 }, (_, i) => ({
            id: `SPEC-${i.toString().padStart(3, '0')}`,
            description: `Detailed specification ${i + 1} for well construction including materials, dimensions, and quality requirements`,
            requirements: Array.from({ length: 10 }, (_, j) => `Requirement ${j + 1} for specification ${i + 1}`),
            metadata: {
              category: `Category ${(i % 5) + 1}`,
              priority: ['HIGH', 'MEDIUM', 'LOW'][i % 3],
              estimatedCost: Math.random() * 10000,
              timeline: `${Math.floor(Math.random() * 30) + 1} days`
            }
          })),
          timeline: Array.from({ length: 50 }, (_, i) => ({
            phase: `Phase ${i + 1}`,
            startDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
            deliverables: Array.from({ length: 5 }, (_, j) => `Deliverable ${j + 1} for phase ${i + 1}`)
          }))
        }
      };

      const largeContent = JSON.stringify(largeDocument, null, 2);
      console.log(`Large file size: ${largeContent.length} bytes`);

      // HFS has a limit, so ensure we're within bounds
      expect(largeContent.length).toBeLessThan(1024 * 1024); // 1MB limit

      const fileCreateTx = new FileCreateTransaction()
        .setContents(largeContent)
        .setKeys([operatorPrivateKey])
        .setFileMemo('Waternity Large Project Document')
        .setMaxTransactionFee(new Hbar(5)); // Higher fee for large file

      const response = await fileCreateTx.execute(client);
      const receipt = await response.getReceipt(client);
      const fileId = receipt.fileId!;
      testFileIds.push(fileId);

      // Verify file was created successfully
      const fileInfo = await new FileInfoQuery()
        .setFileId(fileId)
        .execute(client);

      expect(fileInfo.size.toString()).toBe(largeContent.length.toString());

      testResults.push({
        testName,
        transactionId: response.transactionId.toString(),
        fileId: fileId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          fileSize: fileInfo.size.toString(),
          contentLength: largeContent.length,
          specifications: largeDocument.projectData.specifications.length,
          timelinePhases: largeDocument.projectData.timeline.length
        }
      });

      console.log(`✅ Created large file: ${fileId.toString()}`);
      console.log(`   Transaction: ${response.transactionId.toString()}`);
      console.log(`   Size: ${fileInfo.size.toString()} bytes`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 60000);

  it('should verify file information via Mirror Node', async () => {
    const startTime = Date.now();
    const testName = 'Mirror Node File Information';
    
    try {
      // Create a test file first
      const testContent = JSON.stringify({
        documentType: 'compliance_certificate',
        wellId: 'WELL-005',
        certificateData: {
          issuer: 'Kenya Water Authority',
          issueDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          certificationLevel: 'Grade A',
          complianceChecks: [
            'Water quality standards met',
            'Environmental impact assessment passed',
            'Safety protocols implemented',
            'Community consultation completed'
          ]
        }
      });

      const fileCreateTx = new FileCreateTransaction()
        .setContents(testContent)
        .setKeys([operatorPrivateKey])
        .setFileMemo('Compliance Certificate')
        .setMaxTransactionFee(new Hbar(2));

      const response = await fileCreateTx.execute(client);
      const receipt = await response.getReceipt(client);
      const fileId = receipt.fileId!;
      testFileIds.push(fileId);

      // Wait for the transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 10000));

      const networkEndpoints = getHederaNetworkEndpoints();
      
      // Test file transaction via Mirror Node
      const transactionResponse = await fetch(
        `${networkEndpoints.mirrorNode}/transactions/${response.transactionId.toString()}`
      );
      expect(transactionResponse.ok).toBe(true);
      
      const transactionData = await transactionResponse.json();
      expect(transactionData.transactions).toBeDefined();
      expect(transactionData.transactions.length).toBeGreaterThan(0);
      
      const fileCreateTransaction = transactionData.transactions[0];
      expect(fileCreateTransaction.name).toBe('FILECREATE');
      expect(fileCreateTransaction.result).toBe('SUCCESS');
      expect(fileCreateTransaction.entity_id).toBe(fileId.toString());

      testResults.push({
        testName,
        transactionId: response.transactionId.toString(),
        fileId: fileId.toString(),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          transactionType: fileCreateTransaction.name,
          transactionResult: fileCreateTransaction.result,
          entityId: fileCreateTransaction.entity_id
        }
      });

      console.log(`✅ Verified file information via Mirror Node`);
      console.log(`   File ID: ${fileId.toString()}`);
      console.log(`   Transaction: ${response.transactionId.toString()}`);
      console.log(`   Result: ${fileCreateTransaction.result}`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 45000);

  it('should simulate document anchoring workflow', async () => {
    const startTime = Date.now();
    const testName = 'Document Anchoring Workflow';
    
    try {
      // Simulate a complete document anchoring workflow
      const documents = [
        {
          type: 'milestone_evidence',
          content: {
            milestoneId: 'MS-001',
            evidence: 'Foundation completed',
            photos: ['foundation1.jpg', 'foundation2.jpg'],
            verifiedBy: 'Site Engineer'
          }
        },
        {
          type: 'audit_report',
          content: {
            auditId: 'AUD-001',
            findings: ['All safety protocols followed', 'Quality standards met'],
            auditor: 'Independent Auditor Ltd',
            score: 95
          }
        },
        {
          type: 'settlement_report',
          content: {
            period: 'Q1-2024',
            revenue: 2500.00,
            distributions: [{ investor: 'INV-001', amount: 1000 }],
            fees: 150.00
          }
        }
      ];

      const anchoredDocuments: Array<{
        type: string;
        fileId: string;
        transactionId: string;
        hash: string;
      }> = [];

      for (const doc of documents) {
        const content = JSON.stringify({
          documentType: doc.type,
          wellId: 'WELL-WORKFLOW',
          timestamp: new Date().toISOString(),
          data: doc.content,
          metadata: {
            version: '1.0',
            creator: 'Waternity System'
          }
        }, null, 2);

        // Calculate document hash
        const documentHash = crypto.createHash('sha256').update(content).digest('hex');

        // Create file on HFS
        const fileCreateTx = new FileCreateTransaction()
          .setContents(content)
          .setKeys([operatorPrivateKey])
          .setFileMemo(`Waternity ${doc.type} - ${documentHash.substring(0, 8)}`)
          .setMaxTransactionFee(new Hbar(2));

        const response = await fileCreateTx.execute(client);
        const receipt = await response.getReceipt(client);
        const fileId = receipt.fileId!;
        testFileIds.push(fileId);

        anchoredDocuments.push({
          type: doc.type,
          fileId: fileId.toString(),
          transactionId: response.transactionId.toString(),
          hash: documentHash
        });

        // Small delay between file creations
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Verify all documents were anchored successfully
      expect(anchoredDocuments.length).toBe(documents.length);
      
      for (const doc of anchoredDocuments) {
        expect(doc.fileId).toMatch(/^0\.0\.[0-9]+$/);
        expect(doc.transactionId).toBeDefined();
        expect(doc.hash).toMatch(/^[a-f0-9]{64}$/);
      }

      testResults.push({
        testName,
        transactionId: anchoredDocuments.map(d => d.transactionId).join(', '),
        status: 'PASS',
        duration: Date.now() - startTime,
        metrics: {
          documentsAnchored: anchoredDocuments.length,
          documentTypes: anchoredDocuments.map(d => d.type),
          totalFiles: testFileIds.length
        }
      });

      console.log(`✅ Completed document anchoring workflow`);
      console.log(`   Documents anchored: ${anchoredDocuments.length}`);
      console.log(`   File IDs: ${anchoredDocuments.map(d => d.fileId).join(', ')}`);
    } catch (error) {
      testResults.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, 120000);
});