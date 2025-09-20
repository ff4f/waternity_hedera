const { createHederaClient } = require('./hedera-client');
const { HCSEventService } = require('./hcs-event-service');
const { WaternityHTSService } = require('./hts-service');
const { WaternityHFSService } = require('./hfs-service');
const { v4: uuidv4 } = require('uuid');

/**
 * Main Waternity Service
 * Orchestrates all Hedera integrations (HCS, HTS, HFS)
 */
class WaternityService {
  constructor() {
    this.client = createHederaClient();
    this.hcsEventService = null;
    this.htsService = new WaternityHTSService(this.client);
    this.hfsService = new WaternityHFSService(this.client);
    
    // Topic IDs (will be set during initialization)
    this.eventsTopicId = null;
    this.settlementsTopicId = null;
    this.anchorsTopicId = null;
    
    // State management
    this.projects = new Map();
    this.wells = new Map();
    this.kiosks = new Map();
    this.investments = new Map();
    this.milestones = new Map();
    this.settlements = new Map();
    
    this.initialized = false;
  }

  /**
   * Initialize Waternity service with HCS topics
   * @param {object} config - Configuration options
   * @returns {Promise<object>} Initialization result
   */
  async initialize(config = {}) {
    try {
      const {
        eventsTopicId,
        settlementsTopicId,
        anchorsTopicId,
        createTopics = true,
        skipHederaInit = false
      } = config;

      // Demo mode - skip Hedera initialization
      if (skipHederaInit || process.env.SKIP_HEDERA_INIT === 'true') {
        console.log('🚀 Demo mode: Skipping Hedera initialization');
        this.eventsTopicId = 'demo-events-topic';
        this.settlementsTopicId = 'demo-settlements-topic';
        this.anchorsTopicId = 'demo-anchors-topic';
        this.initialized = true;
        
        return {
          initialized: true,
          demoMode: true,
          eventsTopicId: this.eventsTopicId,
          settlementsTopicId: this.settlementsTopicId,
          anchorsTopicId: this.anchorsTopicId
        };
      }

      // Use existing topics or create new ones
      if (eventsTopicId) {
        this.eventsTopicId = eventsTopicId;
      } else if (createTopics) {
        const eventsResult = await this.createHCSTopic('Waternity Events Topic');
        this.eventsTopicId = eventsResult.topicId;
      }

      if (settlementsTopicId) {
        this.settlementsTopicId = settlementsTopicId;
      } else if (createTopics) {
        const settlementsResult = await this.createHCSTopic('Waternity Settlements Topic');
        this.settlementsTopicId = settlementsResult.topicId;
      }

      if (anchorsTopicId) {
        this.anchorsTopicId = anchorsTopicId;
      } else if (createTopics) {
        const anchorsResult = await this.createHCSTopic('Waternity Anchors Topic');
        this.anchorsTopicId = anchorsResult.topicId;
      }

      // Initialize HCS Event Service with events topic
      if (this.eventsTopicId) {
        this.hcsEventService = new HCSEventService(this.client, this.eventsTopicId);
      }

      this.initialized = true;

      return {
        initialized: true,
        eventsTopicId: this.eventsTopicId,
        settlementsTopicId: this.settlementsTopicId,
        anchorsTopicId: this.anchorsTopicId
      };
    } catch (error) {
      throw new Error(`Failed to initialize Waternity service: ${error.message}`);
    }
  }

  /**
   * Create HCS topic
   * @param {string} memo - Topic memo
   * @returns {Promise<object>} Topic creation result
   */
  async createHCSTopic(memo) {
    const hcsService = new (require('./hedera-client').HCSService)(this.client);
    return await hcsService.createTopic(memo);
  }

  /**
   * Create new project
   * @param {object} projectData - Project information
   * @param {string} messageId - Optional message ID for idempotency
   * @returns {Promise<object>} Project creation result
   */
  async createProject(projectData, messageId = null) {
    this.ensureInitialized();
    
    const projectId = projectData.projectId || uuidv4();
    const project = {
      projectId,
      ...projectData,
      status: 'CREATED',
      createdAt: new Date().toISOString()
    };

    // Store project
    this.projects.set(projectId, project);

    let hcsResult = null;
    let hfsResult = null;

    // Submit HCS event (skip in demo mode)
    if (this.hcsEventService && process.env.SKIP_HEDERA_INIT !== 'true') {
      hcsResult = await this.hcsEventService.projectCreated(project, messageId);
    } else {
      hcsResult = {
        success: true,
        messageId: messageId || `demo-msg-${Date.now()}`,
        topicId: this.eventsTopicId,
        demoMode: true
      };
    }

    // Store project document on HFS (skip in demo mode)
    if (this.hfsService && process.env.SKIP_HEDERA_INIT !== 'true') {
      hfsResult = await this.hfsService.storeDocument({
        projectId,
        title: `Project: ${project.name}`,
        description: `Project documentation for ${project.name}`,
        content: JSON.stringify(project, null, 2),
        documentType: 'PROJECT_SPEC',
        uploadedBy: project.operatorId,
        accessLevel: 'PUBLIC'
      });
    } else {
      hfsResult = {
        success: true,
        fileId: `demo-file-${projectId}`,
        demoMode: true
      };
    }

    return {
      project,
      hcsEvent: hcsResult,
      hfsDocument: hfsResult,
      type: 'PROJECT_CREATED'
    };
  }

  /**
   * Make investment in project
   * @param {object} investmentData - Investment information
   * @param {string} messageId - Optional message ID for idempotency
   * @returns {Promise<object>} Investment result
   */
  async makeInvestment(investmentData, messageId = null) {
    this.ensureInitialized();
    
    const investmentId = investmentData.investmentId || uuidv4();
    const investment = {
      investmentId,
      ...investmentData,
      investedAt: new Date().toISOString()
    };

    // Store investment
    this.investments.set(investmentId, investment);

    // Create/mint revenue tokens if project has a well
    let tokenResult = null;
    const project = this.projects.get(investment.projectId);
    if (project && project.wellId) {
      const well = this.wells.get(project.wellId);
      if (well) {
        // Check if revenue token exists, create if not
        const tokens = this.htsService.getWellTokens(project.wellId);
        if (!tokens.revenue) {
          await this.htsService.createRevenueToken({
            wellId: project.wellId,
            name: well.name,
            targetRevenue: project.targetFunding
          });
        }

        // Calculate and mint tokens for investor
        const tokenAllocation = this.htsService.calculateTokenAllocation(
          investment.amount,
          project.targetFunding,
          1000000 // 1M token cap
        );

        tokenResult = await this.htsService.mintRevenueTokens(
          project.wellId,
          tokenAllocation,
          investmentId
        );

        investment.tokenAllocation = tokenAllocation;
        investment.tokenId = tokenResult.tokenId;
      }
    }

    // Submit HCS event
    const hcsResult = await this.hcsEventService.investmentMade(investment, messageId);

    return {
      investment,
      hcsEvent: hcsResult,
      tokenResult,
      type: 'INVESTMENT_MADE'
    };
  }

  /**
   * Create well
   * @param {object} wellData - Well information
   * @param {string} messageId - Optional message ID for idempotency
   * @returns {Promise<object>} Well creation result
   */
  async createWell(wellData, messageId = null) {
    this.ensureInitialized();
    
    const wellId = wellData.wellId || uuidv4();
    const well = {
      wellId,
      ...wellData,
      createdAt: new Date().toISOString()
    };

    // Store well
    this.wells.set(wellId, well);

    // Create Well NFT
    const nftResult = await this.htsService.createWellNFT(well);
    
    // Mint NFT with metadata
    const mintResult = await this.htsService.mintWellNFT(wellId, {
      depth: well.depth,
      capacity: well.capacity,
      installationDate: well.installationDate,
      waterQuality: well.waterQuality
    });

    well.nftTokenId = nftResult.tokenId;
    well.nftSerial = mintResult.serials[0];

    // Submit HCS event
    const hcsResult = await this.hcsEventService.wellCreated(well, messageId);

    // Store well documentation
    const hfsResult = await this.hfsService.storeDocument({
      wellId,
      projectId: well.projectId,
      title: `Well: ${well.name}`,
      description: `Technical documentation for well ${well.name}`,
      content: JSON.stringify(well, null, 2),
      documentType: 'WELL_SPEC',
      uploadedBy: well.operatorId,
      accessLevel: 'PUBLIC'
    });

    return {
      well,
      nftResult,
      mintResult,
      hcsEvent: hcsResult,
      hfsDocument: hfsResult,
      type: 'WELL_CREATED'
    };
  }

  /**
   * Create milestone
   * @param {object} milestoneData - Milestone information
   * @param {string} messageId - Optional message ID for idempotency
   * @returns {Promise<object>} Milestone creation result
   */
  async createMilestone(milestoneData, messageId = null) {
    this.ensureInitialized();
    
    const milestoneId = milestoneData.milestoneId || uuidv4();
    const milestone = {
      milestoneId,
      ...milestoneData,
      status: 'CREATED',
      createdAt: new Date().toISOString()
    };

    // Store milestone
    this.milestones.set(milestoneId, milestone);

    // Submit HCS event
    const hcsResult = await this.hcsEventService.milestoneCreated(milestone, messageId);

    return {
      milestone,
      hcsEvent: hcsResult,
      type: 'MILESTONE_CREATED'
    };
  }

  /**
   * Verify milestone
   * @param {object} verificationData - Verification information
   * @param {string} messageId - Optional message ID for idempotency
   * @returns {Promise<object>} Verification result
   */
  async verifyMilestone(verificationData, messageId = null) {
    this.ensureInitialized();
    
    const milestone = this.milestones.get(verificationData.milestoneId);
    if (!milestone) {
      throw new Error(`Milestone ${verificationData.milestoneId} not found`);
    }

    // Update milestone status
    milestone.status = 'VERIFIED';
    milestone.verifiedAt = new Date().toISOString();
    milestone.verificationData = verificationData;

    // Store evidence on HFS
    const hfsResult = await this.hfsService.storeMilestoneEvidence({
      milestoneId: verificationData.milestoneId,
      projectId: milestone.projectId,
      wellId: milestone.wellId,
      evidence: verificationData.evidence,
      verificationData,
      verifiedBy: verificationData.verifiedBy
    });

    // Submit HCS event
    const hcsResult = await this.hcsEventService.milestoneVerified(verificationData, messageId);

    return {
      milestone,
      hcsEvent: hcsResult,
      hfsEvidence: hfsResult,
      type: 'MILESTONE_VERIFIED'
    };
  }

  /**
   * Record water usage
   * @param {object} usageData - Usage information
   * @param {string} messageId - Optional message ID for idempotency
   * @returns {Promise<object>} Usage recording result
   */
  async recordWaterUsage(usageData, messageId = null) {
    this.ensureInitialized();
    
    const usageId = usageData.usageId || uuidv4();
    const usage = {
      usageId,
      ...usageData,
      recordedAt: new Date().toISOString()
    };

    // Submit HCS event
    const hcsResult = await this.hcsEventService.waterUsageRecorded(usage, messageId);

    return {
      usage,
      hcsEvent: hcsResult,
      type: 'WATER_USAGE_RECORDED'
    };
  }

  /**
   * Process settlement
   * @param {object} settlementData - Settlement information
   * @param {string} messageId - Optional message ID for idempotency
   * @returns {Promise<object>} Settlement result
   */
  async processSettlement(settlementData, messageId = null) {
    this.ensureInitialized();
    
    const settlementId = settlementData.settlementId || uuidv4();
    const settlement = {
      settlementId,
      ...settlementData,
      processedAt: new Date().toISOString()
    };

    // Store settlement
    this.settlements.set(settlementId, settlement);

    // Calculate revenue distribution
    const wellId = settlement.wellId;
    const tokenHolders = settlement.tokenHolders || [];
    
    let distributionResult = null;
    if (wellId && tokenHolders.length > 0) {
      const distributions = this.htsService.calculateRevenueDistribution(
        wellId,
        settlement.totalRevenue,
        tokenHolders
      );

      distributionResult = await this.htsService.distributeRevenue(wellId, {
        totalRevenue: settlement.totalRevenue,
        distributions,
        settlementId
      });
    }

    // Submit HCS events
    const calculatedResult = await this.hcsEventService.settlementCalculated(settlement, messageId);
    
    const processedResult = await this.hcsEventService.settlementProcessed({
      settlementId,
      wellId,
      distributions: distributionResult?.distributions || [],
      tokenTransfers: distributionResult?.results?.map(d => d.transaction) || [],
      processedBy: settlement.processedBy,
      hederaTransactions: distributionResult?.results?.map(d => d.transaction) || [],
      status: 'COMPLETED'
    });

    return {
      settlement,
      distributionResult,
      hcsEvents: {
        calculated: calculatedResult,
        processed: processedResult
      },
      type: 'SETTLEMENT_PROCESSED'
    };
  }

  /**
   * Get project information
   * @param {string} projectId - Project ID
   * @returns {object|null} Project information
   */
  getProject(projectId) {
    return this.projects.get(projectId) || null;
  }

  /**
   * Get well information
   * @param {string} wellId - Well ID
   * @returns {object|null} Well information
   */
  getWell(wellId) {
    const well = this.wells.get(wellId);
    if (well) {
      const tokens = this.htsService.getWellTokens(wellId);
      return { ...well, tokens };
    }
    return null;
  }

  /**
   * Get system status
   * @returns {object} System status
   */
  getSystemStatus() {
    return {
      initialized: this.initialized,
      topics: {
        events: this.eventsTopicId,
        settlements: this.settlementsTopicId,
        anchors: this.anchorsTopicId
      },
      counts: {
        projects: this.projects.size,
        wells: this.wells.size,
        investments: this.investments.size,
        milestones: this.milestones.size,
        settlements: this.settlements.size
      },
      services: {
        hcs: !!this.hcsEventService,
        hts: !!this.htsService,
        hfs: !!this.hfsService
      },
      statistics: {
        tokens: this.htsService.getTokenStatistics(),
        storage: this.hfsService.getStorageStatistics()
      }
    };
  }

  /**
   * Get recent events
   * @param {number} limit - Number of events to return
   * @returns {Array} Recent events
   */
  getRecentEvents(limit = 50) {
    if (!this.hcsEventService) return [];
    return this.hcsEventService.getRecentEvents(limit);
  }

  /**
   * Get milestone information
   * @param {string} milestoneId - Milestone ID
   * @returns {object|null} Milestone information
   */
  getMilestone(milestoneId) {
    return this.milestones.get(milestoneId) || null;
  }

  /**
   * Get investment information
   * @param {string} investmentId - Investment ID
   * @returns {object|null} Investment information
   */
  getInvestment(investmentId) {
    return this.investments.get(investmentId) || null;
  }

  /**
   * Get settlement information
   * @param {string} settlementId - Settlement ID
   * @returns {object|null} Settlement information
   */
  getSettlement(settlementId) {
    return this.settlements.get(settlementId) || null;
  }

  /**
   * Get projects by investor
   * @param {string} investorId - Investor ID
   * @returns {Array} Projects invested by the investor
   */
  getProjectsByInvestor(investorId) {
    const investorProjects = [];
    for (const investment of this.investments.values()) {
      if (investment.investorId === investorId) {
        const project = this.projects.get(investment.projectId);
        if (project) {
          investorProjects.push({
            ...project,
            investment
          });
        }
      }
    }
    return investorProjects;
  }

  /**
   * Get wells by project
   * @param {string} projectId - Project ID
   * @returns {Array} Wells belonging to the project
   */
  getWellsByProject(projectId) {
    return Array.from(this.wells.values()).filter(well => well.projectId === projectId);
  }

  /**
   * Get milestones by project
   * @param {string} projectId - Project ID
   * @returns {Array} Milestones belonging to the project
   */
  getMilestonesByProject(projectId) {
    return Array.from(this.milestones.values()).filter(milestone => milestone.projectId === projectId);
  }

  /**
   * Get investments by project
   * @param {string} projectId - Project ID
   * @returns {Array} Investments in the project
   */
  getInvestmentsByProject(projectId) {
    return Array.from(this.investments.values()).filter(investment => investment.projectId === projectId);
  }

  /**
   * Get all projects
   * @returns {Array} All projects
   */
  getAllProjects() {
    return Array.from(this.projects.values());
  }

  /**
   * Get all wells
   * @returns {Array} All wells
   */
  getAllWells() {
    return Array.from(this.wells.values());
  }

  /**
   * Get all investments
   * @returns {Array} All investments
   */
  getAllInvestments() {
    return Array.from(this.investments.values());
  }

  /**
   * Get all milestones
   * @returns {Array} All milestones
   */
  getAllMilestones() {
    return Array.from(this.milestones.values());
  }

  /**
   * Get all settlements
   * @returns {Array} All settlements
   */
  getAllSettlements() {
    return Array.from(this.settlements.values());
  }

  /**
   * Ensure service is initialized
   * @private
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Waternity service not initialized. Call initialize() first.');
    }
  }
}

module.exports = { WaternityService };