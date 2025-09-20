/**
 * Seed Data for Waternity Demo
 * Contains realistic sample data for hackathon presentation
 */

const { v4: uuidv4 } = require('uuid');

// Sample user accounts (using testnet account IDs)
const DEMO_ACCOUNTS = {
  investor1: '0.0.123456',
  investor2: '0.0.123457', 
  operator1: '0.0.123458',
  operator2: '0.0.123459',
  auditor1: '0.0.123460',
  admin: '0.0.123461'
};

// Sample projects data
const SAMPLE_PROJECTS = [
  {
    projectId: 'proj_001',
    name: 'Kibera Clean Water Initiative',
    description: 'Providing clean water access to 50,000 residents in Kibera slum, Nairobi',
    location: {
      country: 'Kenya',
      region: 'Nairobi',
      coordinates: { lat: -1.3133, lng: 36.7894 },
      community: 'Kibera'
    },
    operator: {
      operatorId: DEMO_ACCOUNTS.operator1,
      name: 'Kenya Water Solutions Ltd',
      experience: '15 years',
      certification: 'ISO 14001, WHO Standards'
    },
    financial: {
      targetAmount: 500000, // $500K USD
      raisedAmount: 350000,  // $350K raised
      currency: 'USD',
      expectedROI: 12.5, // 12.5% annual
      paybackPeriod: 7, // 7 years
      revenueModel: 'Pay-per-use + Monthly subscriptions'
    },
    technical: {
      waterSource: 'Borehole + Rainwater harvesting',
      capacity: '50,000 liters/day',
      technology: 'Solar-powered pumps, IoT monitoring',
      treatment: 'UV sterilization, Filtration'
    },
    impact: {
      beneficiaries: 50000,
      jobsCreated: 25,
      co2Reduction: '120 tons/year',
      sdgGoals: [3, 6, 8, 13] // Health, Clean Water, Jobs, Climate
    },
    timeline: {
      startDate: '2024-01-15',
      expectedCompletion: '2024-12-31',
      phases: 4
    },
    status: 'ACTIVE',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z'
  },
  {
    projectId: 'proj_002', 
    name: 'Lagos Water Distribution Network',
    description: 'Smart water distribution system for Lagos Island communities',
    location: {
      country: 'Nigeria',
      region: 'Lagos State',
      coordinates: { lat: 6.4541, lng: 3.3947 },
      community: 'Lagos Island'
    },
    operator: {
      operatorId: DEMO_ACCOUNTS.operator2,
      name: 'West Africa Water Corp',
      experience: '12 years',
      certification: 'ISO 9001, NWSC Certified'
    },
    financial: {
      targetAmount: 750000,
      raisedAmount: 200000,
      currency: 'USD', 
      expectedROI: 15.2,
      paybackPeriod: 6,
      revenueModel: 'Tiered pricing + Commercial sales'
    },
    technical: {
      waterSource: 'Municipal supply + Treatment plant',
      capacity: '100,000 liters/day',
      technology: 'Smart meters, Pressure sensors, Mobile payments',
      treatment: 'Multi-stage filtration, Chlorination'
    },
    impact: {
      beneficiaries: 75000,
      jobsCreated: 40,
      co2Reduction: '200 tons/year',
      sdgGoals: [1, 3, 6, 9, 11]
    },
    timeline: {
      startDate: '2024-02-01',
      expectedCompletion: '2025-01-31',
      phases: 5
    },
    status: 'FUNDRAISING',
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-02-05T12:15:00Z'
  },
  {
    projectId: 'proj_003',
    name: 'Cape Town Drought Resilience',
    description: 'Emergency water supply and conservation system for Cape Town townships',
    location: {
      country: 'South Africa',
      region: 'Western Cape',
      coordinates: { lat: -33.9249, lng: 18.4241 },
      community: 'Khayelitsha'
    },
    operator: {
      operatorId: DEMO_ACCOUNTS.operator1,
      name: 'SA Water Innovation',
      experience: '20 years',
      certification: 'SANS 241, Blue Drop Certified'
    },
    financial: {
      targetAmount: 1200000,
      raisedAmount: 800000,
      currency: 'USD',
      expectedROI: 10.8,
      paybackPeriod: 8,
      revenueModel: 'Government contracts + Community fees'
    },
    technical: {
      waterSource: 'Desalination + Recycled water',
      capacity: '200,000 liters/day',
      technology: 'Reverse osmosis, Smart distribution, Weather monitoring',
      treatment: 'Desalination, UV treatment, Remineralization'
    },
    impact: {
      beneficiaries: 120000,
      jobsCreated: 60,
      co2Reduction: '300 tons/year',
      sdgGoals: [3, 6, 11, 13, 14]
    },
    timeline: {
      startDate: '2024-03-01',
      expectedCompletion: '2025-06-30',
      phases: 6
    },
    status: 'ACTIVE',
    createdAt: '2024-03-01T09:30:00Z',
    updatedAt: '2024-03-10T14:20:00Z'
  }
];

// Sample wells data
const SAMPLE_WELLS = [
  {
    wellId: 'well_001',
    projectId: 'proj_001',
    name: 'Kibera Main Borehole',
    location: {
      coordinates: { lat: -1.3140, lng: 36.7890 },
      address: 'Olympic Estate, Kibera',
      elevation: 1680 // meters above sea level
    },
    specifications: {
      depth: 120, // meters
      diameter: 0.15, // meters
      capacity: 20000, // liters/day
      waterTable: 45, // meters
      quality: 'Potable after treatment'
    },
    equipment: {
      pump: 'Solar submersible pump - 2HP',
      storage: '10,000L overhead tank',
      treatment: 'UV sterilizer + Sand filter',
      monitoring: 'IoT sensors for flow, pressure, quality'
    },
    status: 'OPERATIONAL',
    operationalSince: '2024-01-20T00:00:00Z',
    lastMaintenance: '2024-01-18T10:00:00Z',
    nextMaintenance: '2024-02-18T10:00:00Z',
    createdAt: '2024-01-15T12:00:00Z'
  },
  {
    wellId: 'well_002',
    projectId: 'proj_001',
    name: 'Kibera Secondary Well',
    location: {
      coordinates: { lat: -1.3125, lng: 36.7885 },
      address: 'Soweto East, Kibera',
      elevation: 1675
    },
    specifications: {
      depth: 95,
      diameter: 0.12,
      capacity: 15000,
      waterTable: 38,
      quality: 'Good quality groundwater'
    },
    equipment: {
      pump: 'Solar submersible pump - 1.5HP',
      storage: '7,500L ground tank',
      treatment: 'Chlorination + Basic filtration',
      monitoring: 'Basic flow meters'
    },
    status: 'UNDER_CONSTRUCTION',
    expectedCompletion: '2024-02-15T00:00:00Z',
    createdAt: '2024-01-20T14:30:00Z'
  },
  {
    wellId: 'well_003',
    projectId: 'proj_002',
    name: 'Lagos Island Primary Well',
    location: {
      coordinates: { lat: 6.4545, lng: 3.3950 },
      address: 'Marina District, Lagos Island',
      elevation: 5
    },
    specifications: {
      depth: 80,
      diameter: 0.20,
      capacity: 35000,
      waterTable: 25,
      quality: 'Requires treatment due to salinity'
    },
    equipment: {
      pump: 'Electric submersible pump - 5HP',
      storage: '20,000L elevated tank',
      treatment: 'RO system + Remineralization',
      monitoring: 'Advanced IoT + Water quality sensors'
    },
    status: 'PLANNED',
    expectedStart: '2024-03-01T00:00:00Z',
    createdAt: '2024-02-01T10:00:00Z'
  }
];

// Sample investments data
const SAMPLE_INVESTMENTS = [
  {
    investmentId: 'inv_001',
    projectId: 'proj_001',
    investorId: DEMO_ACCOUNTS.investor1,
    investorName: 'Green Impact Fund',
    amount: 150000,
    currency: 'USD',
    investmentType: 'EQUITY',
    tokenAllocation: 30000, // 30K revenue tokens
    expectedReturn: 12.5,
    investmentDate: '2024-01-16T09:00:00Z',
    status: 'CONFIRMED',
    terms: {
      lockupPeriod: 12, // months
      distributionFrequency: 'QUARTERLY',
      exitOptions: ['SECONDARY_MARKET', 'BUYBACK']
    },
    hederaTransactionId: '0.0.123456@1705395600.123456789',
    tokenId: '0.0.789012'
  },
  {
    investmentId: 'inv_002',
    projectId: 'proj_001',
    investorId: DEMO_ACCOUNTS.investor2,
    investorName: 'African Development Partners',
    amount: 200000,
    currency: 'USD',
    investmentType: 'DEBT',
    tokenAllocation: 40000,
    expectedReturn: 10.0,
    investmentDate: '2024-01-18T14:30:00Z',
    status: 'CONFIRMED',
    terms: {
      lockupPeriod: 24,
      distributionFrequency: 'MONTHLY',
      exitOptions: ['BUYBACK']
    },
    hederaTransactionId: '0.0.123456@1705568200.987654321',
    tokenId: '0.0.789013'
  },
  {
    investmentId: 'inv_003',
    projectId: 'proj_002',
    investorId: DEMO_ACCOUNTS.investor1,
    investorName: 'Green Impact Fund',
    amount: 100000,
    currency: 'USD',
    investmentType: 'EQUITY',
    tokenAllocation: 13333,
    expectedReturn: 15.2,
    investmentDate: '2024-02-03T11:15:00Z',
    status: 'CONFIRMED',
    terms: {
      lockupPeriod: 18,
      distributionFrequency: 'QUARTERLY',
      exitOptions: ['SECONDARY_MARKET', 'BUYBACK']
    },
    hederaTransactionId: '0.0.123456@1706954100.456789123',
    tokenId: '0.0.789014'
  },
  {
    investmentId: 'inv_004',
    projectId: 'proj_003',
    investorId: DEMO_ACCOUNTS.investor2,
    investorName: 'African Development Partners',
    amount: 300000,
    currency: 'USD',
    investmentType: 'HYBRID',
    tokenAllocation: 25000,
    expectedReturn: 10.8,
    investmentDate: '2024-03-05T16:45:00Z',
    status: 'PENDING',
    terms: {
      lockupPeriod: 36,
      distributionFrequency: 'QUARTERLY',
      exitOptions: ['SECONDARY_MARKET']
    }
  }
];

// Sample milestones data
const SAMPLE_MILESTONES = [
  {
    milestoneId: 'ms_001',
    projectId: 'proj_001',
    title: 'Site Preparation and Permits',
    description: 'Complete site survey, obtain drilling permits, and prepare access roads',
    phase: 1,
    targetDate: '2024-01-31T00:00:00Z',
    completionDate: '2024-01-28T00:00:00Z',
    status: 'COMPLETED',
    verificationStatus: 'VERIFIED',
    verifiedBy: DEMO_ACCOUNTS.auditor1,
    verificationDate: '2024-01-30T10:00:00Z',
    deliverables: [
      'Site survey report',
      'Drilling permits',
      'Environmental impact assessment',
      'Community consultation report'
    ],
    paymentAmount: 50000,
    paymentStatus: 'PAID',
    evidence: {
      documents: ['survey_report.pdf', 'permits.pdf', 'eia_report.pdf'],
      photos: ['site_before.jpg', 'access_road.jpg', 'permit_display.jpg'],
      gpsCoordinates: { lat: -1.3133, lng: 36.7894 }
    },
    hcsEventId: 'event_ms_001_verified'
  },
  {
    milestoneId: 'ms_002',
    projectId: 'proj_001',
    title: 'Borehole Drilling and Testing',
    description: 'Drill primary borehole, conduct water quality tests, and install casing',
    phase: 2,
    targetDate: '2024-02-15T00:00:00Z',
    completionDate: '2024-02-12T00:00:00Z',
    status: 'COMPLETED',
    verificationStatus: 'VERIFIED',
    verifiedBy: DEMO_ACCOUNTS.auditor1,
    verificationDate: '2024-02-14T14:30:00Z',
    deliverables: [
      'Borehole completion report',
      'Water quality test results',
      'Yield test report',
      'Casing installation certificate'
    ],
    paymentAmount: 100000,
    paymentStatus: 'PAID',
    evidence: {
      documents: ['drilling_report.pdf', 'water_quality.pdf', 'yield_test.pdf'],
      photos: ['drilling_progress.jpg', 'water_sample.jpg', 'casing_install.jpg'],
      testResults: {
        depth: 120,
        yield: '20,000 L/day',
        quality: 'Potable after UV treatment'
      }
    },
    hcsEventId: 'event_ms_002_verified'
  },
  {
    milestoneId: 'ms_003',
    projectId: 'proj_001',
    title: 'Pump Installation and Power Setup',
    description: 'Install solar-powered pump system and electrical connections',
    phase: 3,
    targetDate: '2024-02-28T00:00:00Z',
    status: 'IN_PROGRESS',
    verificationStatus: 'PENDING',
    deliverables: [
      'Pump installation report',
      'Solar panel setup documentation',
      'Electrical safety certification',
      'System commissioning report'
    ],
    paymentAmount: 75000,
    paymentStatus: 'PENDING',
    progress: 75
  },
  {
    milestoneId: 'ms_004',
    projectId: 'proj_001',
    title: 'Distribution Network Construction',
    description: 'Build water distribution network and install kiosks',
    phase: 4,
    targetDate: '2024-03-31T00:00:00Z',
    status: 'PLANNED',
    verificationStatus: 'NOT_STARTED',
    deliverables: [
      'Pipeline installation report',
      'Kiosk construction completion',
      'Pressure testing results',
      'Network commissioning report'
    ],
    paymentAmount: 125000,
    paymentStatus: 'PENDING'
  },
  {
    milestoneId: 'ms_005',
    projectId: 'proj_002',
    title: 'Lagos Project Initiation',
    description: 'Project kickoff, team setup, and initial planning',
    phase: 1,
    targetDate: '2024-02-15T00:00:00Z',
    completionDate: '2024-02-10T00:00:00Z',
    status: 'COMPLETED',
    verificationStatus: 'VERIFIED',
    verifiedBy: DEMO_ACCOUNTS.auditor1,
    verificationDate: '2024-02-12T09:00:00Z',
    deliverables: [
      'Project charter',
      'Team assignment document',
      'Initial site assessment',
      'Stakeholder engagement plan'
    ],
    paymentAmount: 25000,
    paymentStatus: 'PAID',
    hcsEventId: 'event_ms_005_verified'
  }
];

// Sample water usage data
const SAMPLE_WATER_USAGE = [
  {
    usageId: 'usage_001',
    wellId: 'well_001',
    projectId: 'proj_001',
    timestamp: '2024-01-25T08:00:00Z',
    volume: 15000, // liters
    duration: 480, // minutes (8 hours)
    flowRate: 31.25, // L/min
    pressure: 2.5, // bar
    quality: {
      ph: 7.2,
      turbidity: 0.8, // NTU
      chlorine: 0.5, // mg/L
      bacteria: 0 // CFU/100ml
    },
    cost: 75, // USD
    beneficiaries: 750,
    operatorId: DEMO_ACCOUNTS.operator1
  },
  {
    usageId: 'usage_002',
    wellId: 'well_001',
    projectId: 'proj_001',
    timestamp: '2024-01-26T08:00:00Z',
    volume: 18000,
    duration: 520,
    flowRate: 34.6,
    pressure: 2.4,
    quality: {
      ph: 7.1,
      turbidity: 0.9,
      chlorine: 0.6,
      bacteria: 0
    },
    cost: 90,
    beneficiaries: 900,
    operatorId: DEMO_ACCOUNTS.operator1
  }
];

// Sample settlement data
const SAMPLE_SETTLEMENTS = [
  {
    settlementId: 'settle_001',
    projectId: 'proj_001',
    period: {
      start: '2024-01-01T00:00:00Z',
      end: '2024-01-31T23:59:59Z',
      type: 'MONTHLY'
    },
    revenue: {
      gross: 2250, // USD
      operational: 450, // 20% operational costs
      net: 1800
    },
    distribution: {
      investors: 1440, // 80% to investors
      operator: 270,   // 15% to operator
      platform: 90     // 5% platform fee
    },
    metrics: {
      totalVolume: 450000, // liters
      beneficiaries: 22500,
      averagePrice: 0.005, // USD per liter
      utilization: 0.75
    },
    status: 'PROCESSED',
    processedAt: '2024-02-01T10:00:00Z',
    hederaTransactionId: '0.0.123456@1706781600.111222333',
    tokenDistributions: [
      {
        investorId: DEMO_ACCOUNTS.investor1,
        tokenId: '0.0.789012',
        amount: 576, // 40% of investor share
        transactionId: '0.0.123456@1706781600.111222334'
      },
      {
        investorId: DEMO_ACCOUNTS.investor2,
        tokenId: '0.0.789013',
        amount: 864, // 60% of investor share
        transactionId: '0.0.123456@1706781600.111222335'
      }
    ]
  }
];

// Demo scenario configurations
const DEMO_SCENARIOS = {
  // Scenario 1: Successful project with regular operations
  scenario1: {
    name: 'Kibera Success Story',
    description: 'Fully operational project with regular revenue distribution',
    projects: ['proj_001'],
    timeframe: '6 months operational',
    highlights: [
      'Serving 50,000 beneficiaries daily',
      'Generated $13,500 revenue in 6 months',
      'Distributed $10,800 to investors',
      '95% system uptime',
      'All milestones completed on time'
    ]
  },
  
  // Scenario 2: Growing project seeking more investment
  scenario2: {
    name: 'Lagos Expansion Opportunity',
    description: 'Active project seeking additional funding for expansion',
    projects: ['proj_002'],
    timeframe: 'Early stage, 27% funded',
    highlights: [
      'Targeting 75,000 beneficiaries',
      'Advanced IoT and smart meter technology',
      'Strong operator with 12 years experience',
      'Government partnership secured',
      'Phase 1 milestones completed'
    ]
  },
  
  // Scenario 3: Emergency response project
  scenario3: {
    name: 'Cape Town Drought Response',
    description: 'Critical infrastructure project addressing water scarcity',
    projects: ['proj_003'],
    timeframe: 'Urgent deployment, 67% funded',
    highlights: [
      'Emergency response to drought conditions',
      'Desalination and water recycling technology',
      'Serving 120,000 people in townships',
      'Climate resilience focus',
      'Strong ESG impact metrics'
    ]
  }
};

module.exports = {
  DEMO_ACCOUNTS,
  SAMPLE_PROJECTS,
  SAMPLE_WELLS,
  SAMPLE_INVESTMENTS,
  SAMPLE_MILESTONES,
  SAMPLE_WATER_USAGE,
  SAMPLE_SETTLEMENTS,
  DEMO_SCENARIOS,
  
  // Helper functions
  generateMessageId: () => uuidv4(),
  
  getCurrentTimestamp: () => new Date().toISOString(),
  
  // Seed data loader function
  async loadSeedData(waternityService) {
    console.log('Loading seed data for Waternity demo...');
    
    try {
      // Load projects
      for (const project of SAMPLE_PROJECTS) {
        await waternityService.createProject(project, this.generateMessageId());
        console.log(`✓ Created project: ${project.name}`);
      }
      
      // Load wells
      for (const well of SAMPLE_WELLS) {
        await waternityService.createWell(well, this.generateMessageId());
        console.log(`✓ Created well: ${well.name}`);
      }
      
      // Load investments
      for (const investment of SAMPLE_INVESTMENTS) {
        if (investment.status === 'CONFIRMED') {
          await waternityService.makeInvestment(investment, this.generateMessageId());
          console.log(`✓ Created investment: ${investment.investorName} -> ${investment.amount} USD`);
        }
      }
      
      // Load milestones
      for (const milestone of SAMPLE_MILESTONES) {
        await waternityService.createMilestone(milestone, this.generateMessageId());
        console.log(`✓ Created milestone: ${milestone.title}`);
        
        // Verify completed milestones
        if (milestone.verificationStatus === 'VERIFIED') {
          await waternityService.verifyMilestone({
            milestoneId: milestone.milestoneId,
            verifiedBy: milestone.verifiedBy,
            evidence: milestone.evidence,
            notes: 'Seed data verification'
          }, this.generateMessageId());
          console.log(`✓ Verified milestone: ${milestone.title}`);
        }
      }
      
      // Load water usage data
      for (const usage of SAMPLE_WATER_USAGE) {
        await waternityService.recordWaterUsage(usage, this.generateMessageId());
        console.log(`✓ Recorded water usage: ${usage.volume}L on ${usage.timestamp}`);
      }
      
      // Load settlements
      for (const settlement of SAMPLE_SETTLEMENTS) {
        if (settlement.status === 'PROCESSED') {
          await waternityService.processSettlement(settlement, this.generateMessageId());
          console.log(`✓ Processed settlement: ${settlement.revenue.gross} USD for ${settlement.period.type}`);
        }
      }
      
      console.log('\n🎉 Seed data loaded successfully!');
      console.log(`📊 Summary:`);
      console.log(`   - ${SAMPLE_PROJECTS.length} projects`);
      console.log(`   - ${SAMPLE_WELLS.length} wells`);
      console.log(`   - ${SAMPLE_INVESTMENTS.filter(i => i.status === 'CONFIRMED').length} investments`);
      console.log(`   - ${SAMPLE_MILESTONES.length} milestones`);
      console.log(`   - ${SAMPLE_WATER_USAGE.length} usage records`);
      console.log(`   - ${SAMPLE_SETTLEMENTS.length} settlements`);
      
      return {
        success: true,
        summary: {
          projects: SAMPLE_PROJECTS.length,
          wells: SAMPLE_WELLS.length,
          investments: SAMPLE_INVESTMENTS.filter(i => i.status === 'CONFIRMED').length,
          milestones: SAMPLE_MILESTONES.length,
          usageRecords: SAMPLE_WATER_USAGE.length,
          settlements: SAMPLE_SETTLEMENTS.length
        }
      };
      
    } catch (error) {
      console.error('❌ Error loading seed data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};