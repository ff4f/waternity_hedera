const { HFSService, generateHashScanLink, HEDERA_NET } = require('./hedera-client');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Waternity HFS Service
 * Manages document storage and anchoring on Hedera File Service
 */
class WaternityHFSService {
  constructor(client) {
    this.hfsService = new HFSService(client);
    this.documentRegistry = new Map(); // documentId -> file info
    this.bundleRegistry = new Map(); // bundleId -> bundle info
  }

  /**
   * Calculate file hash
   * @param {string|Buffer} content - File content
   * @returns {string} SHA-256 hash
   */
  calculateHash(content) {
    const data = typeof content === 'string' ? Buffer.from(content) : content;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Store document on HFS
   * @param {object} documentData - Document information
   * @returns {Promise<object>} Storage result
   */
  async storeDocument(documentData) {
    try {
      const {
        documentId = uuidv4(),
        projectId,
        wellId,
        title,
        description,
        content,
        documentType,
        uploadedBy,
        accessLevel = 'PUBLIC'
      } = documentData;

      // Calculate content hash for integrity
      const contentHash = this.calculateHash(content);
      
      // Create document metadata
      const metadata = {
        documentId,
        projectId,
        wellId,
        title,
        description,
        documentType,
        uploadedBy,
        accessLevel,
        contentHash,
        uploadedAt: new Date().toISOString(),
        version: '1.0',
        network: HEDERA_NET
      };

      // Combine metadata and content
      const fileContent = JSON.stringify({
        metadata,
        content: typeof content === 'string' ? content : content.toString('base64')
      });

      const memo = `Waternity Doc: ${title} (${documentType})`;
      const result = await this.hfsService.createFile(fileContent, memo);
      
      // Store in registry
      const documentInfo = {
        ...metadata,
        fileId: result.fileId,
        txId: result.txId,
        status: result.status,
        size: Buffer.byteLength(fileContent, 'utf8'),
        hashScanLink: generateHashScanLink(HEDERA_NET, 'transaction', result.txId)
      };
      
      this.documentRegistry.set(documentId, documentInfo);

      return {
        documentId,
        fileId: result.fileId,
        contentHash,
        txId: result.txId,
        status: result.status,
        hashScanLink: documentInfo.hashScanLink,
        size: documentInfo.size,
        type: 'DOCUMENT_STORED'
      };
    } catch (error) {
      throw new Error(`Failed to store document on HFS: ${error.message}`);
    }
  }

  /**
   * Append to existing document (for updates/revisions)
   * @param {string} documentId - Document ID
   * @param {object} appendData - Data to append
   * @returns {Promise<object>} Append result
   */
  async appendToDocument(documentId, appendData) {
    try {
      const documentInfo = this.documentRegistry.get(documentId);
      if (!documentInfo) {
        throw new Error(`Document ${documentId} not found`);
      }

      const appendContent = {
        appendedAt: new Date().toISOString(),
        appendedBy: appendData.uploadedBy,
        revision: (documentInfo.revision || 0) + 1,
        changes: appendData.changes,
        content: appendData.content
      };

      const appendString = `\n---REVISION---\n${JSON.stringify(appendContent)}`;
      const result = await this.hfsService.appendToFile(documentInfo.fileId, appendString);
      
      // Update registry
      documentInfo.revision = appendContent.revision;
      documentInfo.lastModified = appendContent.appendedAt;
      documentInfo.lastModifiedBy = appendData.uploadedBy;
      documentInfo.appendTxId = result.txId;
      
      this.documentRegistry.set(documentId, documentInfo);

      return {
        documentId,
        fileId: documentInfo.fileId,
        revision: appendContent.revision,
        txId: result.txId,
        status: result.status,
        hashScanLink: generateHashScanLink(HEDERA_NET, 'transaction', result.txId),
        type: 'DOCUMENT_UPDATED'
      };
    } catch (error) {
      throw new Error(`Failed to append to document: ${error.message}`);
    }
  }

  /**
   * Create document bundle (multiple documents in one file)
   * @param {object} bundleData - Bundle information
   * @returns {Promise<object>} Bundle result
   */
  async createDocumentBundle(bundleData) {
    try {
      const {
        bundleId = uuidv4(),
        projectId,
        wellId,
        title,
        description,
        documents,
        bundleType = 'MILESTONE_BUNDLE',
        createdBy
      } = bundleData;

      // Validate documents exist
      const bundleDocuments = [];
      for (const docId of documents) {
        const doc = this.documentRegistry.get(docId);
        if (!doc) {
          throw new Error(`Document ${docId} not found for bundle`);
        }
        bundleDocuments.push({
          documentId: docId,
          title: doc.title,
          documentType: doc.documentType,
          fileId: doc.fileId,
          contentHash: doc.contentHash,
          uploadedAt: doc.uploadedAt
        });
      }

      // Create bundle metadata
      const bundleMetadata = {
        bundleId,
        projectId,
        wellId,
        title,
        description,
        bundleType,
        createdBy,
        createdAt: new Date().toISOString(),
        documentCount: bundleDocuments.length,
        documents: bundleDocuments,
        version: '1.0',
        network: HEDERA_NET
      };

      // Calculate bundle hash (merkle-like)
      const documentHashes = bundleDocuments.map(doc => doc.contentHash);
      const bundleHash = this.calculateMerkleRoot(documentHashes);
      bundleMetadata.bundleHash = bundleHash;

      const bundleContent = JSON.stringify(bundleMetadata, null, 2);
      const memo = `Waternity Bundle: ${title} (${bundleDocuments.length} docs)`;
      
      const result = await this.hfsService.createFile(bundleContent, memo);
      
      // Store in bundle registry
      const bundleInfo = {
        ...bundleMetadata,
        fileId: result.fileId,
        txId: result.txId,
        status: result.status,
        size: Buffer.byteLength(bundleContent, 'utf8'),
        hashScanLink: generateHashScanLink(HEDERA_NET, 'transaction', result.txId)
      };
      
      this.bundleRegistry.set(bundleId, bundleInfo);

      return {
        bundleId,
        fileId: result.fileId,
        bundleHash,
        documentCount: bundleDocuments.length,
        txId: result.txId,
        status: result.status,
        hashScanLink: bundleInfo.hashScanLink,
        size: bundleInfo.size,
        type: 'DOCUMENT_BUNDLE'
      };
    } catch (error) {
      throw new Error(`Failed to create document bundle: ${error.message}`);
    }
  }

  /**
   * Calculate merkle root for document hashes
   * @param {Array<string>} hashes - Array of document hashes
   * @returns {string} Merkle root hash
   */
  calculateMerkleRoot(hashes) {
    if (hashes.length === 0) return '';
    if (hashes.length === 1) return hashes[0];

    let currentLevel = [...hashes];
    
    while (currentLevel.length > 1) {
      const nextLevel = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left; // Duplicate if odd number
        const combined = left + right;
        const hash = crypto.createHash('sha256').update(combined).digest('hex');
        nextLevel.push(hash);
      }
      
      currentLevel = nextLevel;
    }
    
    return currentLevel[0];
  }

  /**
   * Store audit report
   * @param {object} auditData - Audit report data
   * @returns {Promise<object>} Storage result
   */
  async storeAuditReport(auditData) {
    try {
      const {
        auditId = uuidv4(),
        projectId,
        wellId,
        auditType,
        auditorId,
        findings,
        recommendations,
        compliance,
        evidence
      } = auditData;

      const auditReport = {
        auditId,
        projectId,
        wellId,
        auditType,
        auditorId,
        auditDate: new Date().toISOString(),
        findings,
        recommendations,
        compliance,
        evidence,
        version: '1.0',
        network: HEDERA_NET
      };

      return await this.storeDocument({
        documentId: auditId,
        projectId,
        wellId,
        title: `Audit Report - ${auditType}`,
        description: `Audit report for ${auditType} conducted by ${auditorId}`,
        content: JSON.stringify(auditReport, null, 2),
        documentType: 'AUDIT_REPORT',
        uploadedBy: auditorId,
        accessLevel: 'RESTRICTED'
      });
    } catch (error) {
      throw new Error(`Failed to store audit report: ${error.message}`);
    }
  }

  /**
   * Store milestone evidence
   * @param {object} milestoneData - Milestone evidence data
   * @returns {Promise<object>} Storage result
   */
  async storeMilestoneEvidence(milestoneData) {
    try {
      const {
        milestoneId,
        projectId,
        wellId,
        evidence,
        verificationData,
        verifiedBy
      } = milestoneData;

      const evidenceDoc = {
        milestoneId,
        projectId,
        wellId,
        verificationDate: new Date().toISOString(),
        verifiedBy,
        evidence,
        verificationData,
        version: '1.0',
        network: HEDERA_NET
      };

      return await this.storeDocument({
        documentId: `${milestoneId}-evidence`,
        projectId,
        wellId,
        title: `Milestone Evidence - ${milestoneId}`,
        description: `Verification evidence for milestone ${milestoneId}`,
        content: JSON.stringify(evidenceDoc, null, 2),
        documentType: 'MILESTONE_EVIDENCE',
        uploadedBy: verifiedBy,
        accessLevel: 'PUBLIC'
      });
    } catch (error) {
      throw new Error(`Failed to store milestone evidence: ${error.message}`);
    }
  }

  /**
   * Get document information
   * @param {string} documentId - Document ID
   * @returns {object|null} Document information
   */
  getDocument(documentId) {
    return this.documentRegistry.get(documentId) || null;
  }

  /**
   * Get bundle information
   * @param {string} bundleId - Bundle ID
   * @returns {object|null} Bundle information
   */
  getBundle(bundleId) {
    return this.bundleRegistry.get(bundleId) || null;
  }

  /**
   * List documents by project
   * @param {string} projectId - Project ID
   * @returns {Array} Documents for project
   */
  getDocumentsByProject(projectId) {
    return Array.from(this.documentRegistry.values())
      .filter(doc => doc.projectId === projectId)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }

  /**
   * List documents by well
   * @param {string} wellId - Well ID
   * @returns {Array} Documents for well
   */
  getDocumentsByWell(wellId) {
    return Array.from(this.documentRegistry.values())
      .filter(doc => doc.wellId === wellId)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }

  /**
   * Get storage statistics
   * @returns {object} Storage statistics
   */
  getStorageStatistics() {
    const documents = Array.from(this.documentRegistry.values());
    const bundles = Array.from(this.bundleRegistry.values());
    
    const totalDocuments = documents.length;
    const totalBundles = bundles.length;
    const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0) +
                     bundles.reduce((sum, bundle) => sum + (bundle.size || 0), 0);
    
    const documentTypes = documents.reduce((acc, doc) => {
      acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
      return acc;
    }, {});

    return {
      totalDocuments,
      totalBundles,
      totalSize,
      documentTypes,
      averageDocumentSize: totalDocuments > 0 ? totalSize / totalDocuments : 0,
      network: HEDERA_NET
    };
  }

  /**
   * Get documents by type
   * @returns {object} Documents grouped by type
   */
  getDocumentsByType() {
    const documents = Array.from(this.documentRegistry.values());
    return documents.reduce((acc, doc) => {
      acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Get all documents
   * @returns {Array} All documents
   */
  getAllDocuments() {
    return Array.from(this.documentRegistry.values());
  }

  /**
   * Get all bundles
   * @returns {Array} All bundles
   */
  getAllBundles() {
    return Array.from(this.bundleRegistry.values());
  }

  /**
   * Clear registries (for testing)
   */
  clearRegistries() {
    this.documentRegistry.clear();
    this.bundleRegistry.clear();
  }
}

module.exports = { WaternityHFSService };