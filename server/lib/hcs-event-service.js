const { v4: uuidv4 } = require('uuid');
const { HCSService, generateHashScanLink, HEDERA_NET } = require('./hedera-client');

/**
 * HCS Event Service for Waternity
 * Handles all HCS event submissions with proper schema validation and idempotency
 */
class HCSEventService {
  constructor(client, topicId) {
    this.hcsService = new HCSService(client);
    this.topicId = topicId;
    this.eventBuffer = new Map(); // In-memory buffer for recent events
  }

  /**
   * Create base event structure
   * @param {string} eventType - Type of event
   * @param {object} payload - Event payload
   * @param {string} messageId - Optional message ID for idempotency
   * @param {object} location - Optional location data
   * @returns {object} Base event structure
   */
  createBaseEvent(eventType, payload, messageId = null, location = null) {
    const event = {
      messageId: messageId || uuidv4(),
      eventType,
      timestamp: new Date().toISOString(),
      version: '1.0',
      payload
    };

    if (location) {
      event.location = location;
    }

    return event;
  }

  /**
   * Submit event to HCS topic
   * @param {object} event - Event to submit
   * @returns {Promise<object>} Transaction result with HashScan link
   */
  async submitEvent(event) {
    try {
      // Check for duplicate messageId (idempotency)
      if (this.eventBuffer.has(event.messageId)) {
        const existing = this.eventBuffer.get(event.messageId);
        return {
          ...existing,
          duplicate: true,
          message: 'Event already submitted (idempotent)'
        };
      }

      const result = await this.hcsService.submitMessage(this.topicId, event, event.messageId);
      
      const response = {
        messageId: event.messageId,
        eventType: event.eventType,
        txId: result.txId,
        status: result.status,
        sequenceNumber: result.sequenceNumber,
        topicId: this.topicId,
        hashScanLink: generateHashScanLink(HEDERA_NET, 'transaction', result.txId),
        timestamp: event.timestamp
      };

      // Store in buffer for idempotency check
      this.eventBuffer.set(event.messageId, response);
      
      // Clean old entries (keep last 1000)
      if (this.eventBuffer.size > 1000) {
        const entries = Array.from(this.eventBuffer.entries());
        const toDelete = entries.slice(0, entries.length - 1000);
        toDelete.forEach(([key]) => this.eventBuffer.delete(key));
      }

      return response;
    } catch (error) {
      throw new Error(`Failed to submit HCS event: ${error.message}`);
    }
  }

  /**
   * Project Created Event
   */
  async projectCreated(projectData, messageId = null) {
    const event = this.createBaseEvent('projectCreated', {
      projectId: projectData.projectId,
      name: projectData.name,
      description: projectData.description,
      targetFunding: projectData.targetFunding,
      currency: projectData.currency || 'HBAR',
      operatorId: projectData.operatorId,
      location: projectData.location,
      estimatedCompletion: projectData.estimatedCompletion,
      projectType: projectData.projectType || 'WELL_CONSTRUCTION',
      status: 'CREATED'
    }, messageId, projectData.location);

    return await this.submitEvent(event);
  }

  /**
   * Project Updated Event
   */
  async projectUpdated(projectData, messageId = null) {
    const event = this.createBaseEvent('projectUpdated', {
      projectId: projectData.projectId,
      updates: projectData.updates,
      updatedBy: projectData.updatedBy,
      previousStatus: projectData.previousStatus,
      newStatus: projectData.newStatus,
      reason: projectData.reason
    }, messageId);

    return await this.submitEvent(event);
  }

  /**
   * Investment Made Event
   */
  async investmentMade(investmentData, messageId = null) {
    const event = this.createBaseEvent('investmentMade', {
      investmentId: investmentData.investmentId,
      projectId: investmentData.projectId,
      investorId: investmentData.investorId,
      amount: investmentData.amount,
      currency: investmentData.currency || 'HBAR',
      tokenAllocation: investmentData.tokenAllocation,
      investmentType: investmentData.investmentType || 'EQUITY',
      hederaTransaction: investmentData.hederaTransaction
    }, messageId);

    return await this.submitEvent(event);
  }

  /**
   * Milestone Created Event
   */
  async milestoneCreated(milestoneData, messageId = null) {
    const event = this.createBaseEvent('milestoneCreated', {
      milestoneId: milestoneData.milestoneId,
      projectId: milestoneData.projectId,
      title: milestoneData.title,
      description: milestoneData.description,
      targetDate: milestoneData.targetDate,
      requiredAmount: milestoneData.requiredAmount,
      currency: milestoneData.currency || 'HBAR',
      verificationCriteria: milestoneData.verificationCriteria,
      createdBy: milestoneData.createdBy
    }, messageId);

    return await this.submitEvent(event);
  }

  /**
   * Milestone Verified Event
   */
  async milestoneVerified(verificationData, messageId = null) {
    const event = this.createBaseEvent('milestoneVerified', {
      milestoneId: verificationData.milestoneId,
      projectId: verificationData.projectId,
      verifiedBy: verificationData.verifiedBy,
      verificationMethod: verificationData.verificationMethod,
      evidence: verificationData.evidence,
      completionDate: verificationData.completionDate,
      actualCost: verificationData.actualCost,
      currency: verificationData.currency || 'HBAR',
      qualityScore: verificationData.qualityScore,
      notes: verificationData.notes
    }, messageId, verificationData.location);

    return await this.submitEvent(event);
  }

  /**
   * Well Created Event
   */
  async wellCreated(wellData, messageId = null) {
    const event = this.createBaseEvent('wellCreated', {
      wellId: wellData.wellId,
      projectId: wellData.projectId,
      name: wellData.name,
      depth: wellData.depth,
      diameter: wellData.diameter,
      capacity: wellData.capacity,
      waterQuality: wellData.waterQuality,
      installationDate: wellData.installationDate,
      operatorId: wellData.operatorId,
      nftTokenId: wellData.nftTokenId,
      nftSerial: wellData.nftSerial
    }, messageId, wellData.location);

    return await this.submitEvent(event);
  }

  /**
   * Kiosk Created Event
   */
  async kioskCreated(kioskData, messageId = null) {
    const event = this.createBaseEvent('kioskCreated', {
      kioskId: kioskData.kioskId,
      wellId: kioskData.wellId,
      name: kioskData.name,
      kioskType: kioskData.kioskType,
      paymentMethods: kioskData.paymentMethods,
      tariffStructure: kioskData.tariffStructure,
      installationDate: kioskData.installationDate,
      operatorId: kioskData.operatorId
    }, messageId, kioskData.location);

    return await this.submitEvent(event);
  }

  /**
   * Valve Controlled Event
   */
  async valveControlled(valveData, messageId = null) {
    const event = this.createBaseEvent('valveControlled', {
      valveId: valveData.valveId,
      wellId: valveData.wellId,
      kioskId: valveData.kioskId,
      action: valveData.action, // 'OPEN' | 'CLOSE' | 'ADJUST'
      previousState: valveData.previousState,
      newState: valveData.newState,
      flowRate: valveData.flowRate,
      pressure: valveData.pressure,
      controlledBy: valveData.controlledBy,
      reason: valveData.reason,
      duration: valveData.duration
    }, messageId);

    return await this.submitEvent(event);
  }

  /**
   * Water Usage Recorded Event
   */
  async waterUsageRecorded(usageData, messageId = null) {
    const event = this.createBaseEvent('waterUsageRecorded', {
      usageId: usageData.usageId,
      wellId: usageData.wellId,
      kioskId: usageData.kioskId,
      customerId: usageData.customerId,
      volumeLiters: usageData.volumeLiters,
      tariffRate: usageData.tariffRate,
      totalCost: usageData.totalCost,
      currency: usageData.currency || 'HBAR',
      paymentMethod: usageData.paymentMethod,
      transactionHash: usageData.transactionHash,
      qualityMetrics: usageData.qualityMetrics
    }, messageId);

    return await this.submitEvent(event);
  }

  /**
   * Settlement Calculated Event
   */
  async settlementCalculated(settlementData, messageId = null) {
    const event = this.createBaseEvent('settlementCalculated', {
      settlementId: settlementData.settlementId,
      wellId: settlementData.wellId,
      periodStart: settlementData.periodStart,
      periodEnd: settlementData.periodEnd,
      totalVolume: settlementData.totalVolume,
      totalRevenue: settlementData.totalRevenue,
      currency: settlementData.currency || 'HBAR',
      revenueShares: settlementData.revenueShares,
      operatingCosts: settlementData.operatingCosts,
      netRevenue: settlementData.netRevenue,
      calculatedBy: settlementData.calculatedBy
    }, messageId);

    return await this.submitEvent(event);
  }

  /**
   * Settlement Processed Event
   */
  async settlementProcessed(processData, messageId = null) {
    const event = this.createBaseEvent('settlementProcessed', {
      settlementId: processData.settlementId,
      wellId: processData.wellId,
      distributions: processData.distributions,
      tokenTransfers: processData.tokenTransfers,
      processedBy: processData.processedBy,
      hederaTransactions: processData.hederaTransactions,
      status: processData.status
    }, messageId);

    return await this.submitEvent(event);
  }

  /**
   * Document Anchored Event
   */
  async documentAnchored(documentData, messageId = null) {
    const event = this.createBaseEvent('documentAnchored', {
      documentId: documentData.documentId,
      projectId: documentData.projectId,
      wellId: documentData.wellId,
      documentType: documentData.documentType,
      title: documentData.title,
      description: documentData.description,
      fileHash: documentData.fileHash,
      hfsFileId: documentData.hfsFileId,
      ipfsHash: documentData.ipfsHash,
      uploadedBy: documentData.uploadedBy,
      accessLevel: documentData.accessLevel
    }, messageId);

    return await this.submitEvent(event);
  }

  /**
   * System Alert Event
   */
  async systemAlert(alertData, messageId = null) {
    const event = this.createBaseEvent('systemAlert', {
      alertId: alertData.alertId,
      wellId: alertData.wellId,
      kioskId: alertData.kioskId,
      alertType: alertData.alertType,
      severity: alertData.severity,
      title: alertData.title,
      description: alertData.description,
      metrics: alertData.metrics,
      thresholds: alertData.thresholds,
      detectedBy: alertData.detectedBy,
      requiresAction: alertData.requiresAction,
      escalationLevel: alertData.escalationLevel
    }, messageId, alertData.location);

    return await this.submitEvent(event);
  }

  /**
   * Get recent events from buffer
   * @param {number} limit - Number of events to return
   * @returns {Array} Recent events
   */
  getRecentEvents(limit = 50) {
    const events = Array.from(this.eventBuffer.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
    
    return events;
  }

  /**
   * Get event by messageId
   * @param {string} messageId - Message ID to lookup
   * @returns {object|null} Event or null if not found
   */
  getEventByMessageId(messageId) {
    return this.eventBuffer.get(messageId) || null;
  }

  /**
   * Clear event buffer
   */
  clearBuffer() {
    this.eventBuffer.clear();
  }

  /**
   * Get recent events from buffer
   * @param {number} limit - Number of events to return
   * @returns {Array} Recent events
   */
  getRecentEvents(limit = 50) {
    return this.eventBuffer.slice(-limit).reverse();
  }

  /**
   * Get event buffer size
   * @returns {number} Buffer size
   */
  getBufferSize() {
    return this.eventBuffer.length;
  }

  /**
   * Clear event buffer
   */
  clearBuffer() {
    this.eventBuffer = [];
  }
}

module.exports = { HCSEventService };