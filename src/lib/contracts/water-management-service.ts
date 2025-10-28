/**
 * Water Management Smart Contract Service
 * Provides TypeScript interface for interacting with the deployed WaterManagement contract
 */

import { ethers } from 'ethers';
import { createHederaClient } from '../hedera/client';

// Contract ABI (Application Binary Interface)
const WATER_MANAGEMENT_ABI = [
  // Events
  "event WellRegistered(uint256 indexed wellId, address indexed owner, string location, uint256 capacity)",
  "event WaterAllocated(uint256 indexed wellId, address indexed user, uint256 amount, uint256 pricePerLiter)",
  "event WaterUsed(uint256 indexed wellId, address indexed user, uint256 amount, uint256 timestamp)",
  "event PaymentProcessed(uint256 indexed wellId, address indexed user, uint256 amount, uint256 totalCost)",
  "event QualityDataSubmitted(uint256 indexed wellId, address indexed submitter, uint256 ph, uint256 tds, uint256 turbidity)",
  "event ConservationRewardIssued(address indexed user, uint256 amount, string reason)",
  
  // Read functions
  "function getWellInfo(uint256 _wellId) view returns (tuple(uint256 id, address owner, string location, uint256 capacity, uint256 availableCapacity, uint256 pricePerLiter, bool isActive, uint256 registeredAt))",
  "function getUserWaterAllocation(uint256 _wellId, address _user) view returns (tuple(uint256 allocatedAmount, uint256 usedAmount, uint256 remainingAmount, uint256 expiresAt, bool isValid))",
  "function getQualityHistory(uint256 _wellId, uint256 _limit) view returns (tuple(uint256 ph, uint256 tds, uint256 turbidity, uint256 timestamp, address submitter)[])",
  "function getConservationMetrics(address _user) view returns (tuple(uint256 totalSaved, uint256 rewardsEarned, uint256 lastRewardTime, uint256 conservationScore))",
  "function getContractStats() view returns (tuple(uint256 totalWells, uint256 totalAllocated, uint256 totalRewards))",
  
  // Write functions
  "function registerWell(string memory _location, uint256 _capacity, uint256 _pricePerLiter)",
  "function allocateWater(uint256 _wellId, address _user, uint256 _amount, uint256 _duration)",
  "function recordWaterUsage(uint256 _wellId, address _user, uint256 _amount)",
  "function submitQualityData(uint256 _wellId, uint256 _ph, uint256 _tds, uint256 _turbidity)",
  "function recordConservation(address _user, uint256 _waterSaved, string memory _reason)",
  
  // Admin functions
  "function addOperator(address _operator)",
  "function removeOperator(address _operator)",
  "function deactivateWell(uint256 _wellId)",
  "function emergencyWithdraw(address _token, uint256 _amount)"
];

export interface WellInfo {
  id: bigint;
  owner: string;
  location: string;
  capacity: bigint;
  availableCapacity: bigint;
  pricePerLiter: bigint;
  isActive: boolean;
  registeredAt: bigint;
}

export interface WaterAllocation {
  allocatedAmount: bigint;
  usedAmount: bigint;
  remainingAmount: bigint;
  expiresAt: bigint;
  isValid: boolean;
}

export interface QualityData {
  ph: bigint;
  tds: bigint;
  turbidity: bigint;
  timestamp: bigint;
  submitter: string;
}

export interface ConservationMetrics {
  totalSaved: bigint;
  rewardsEarned: bigint;
  lastRewardTime: bigint;
  conservationScore: bigint;
}

export interface ContractStats {
  totalWells: bigint;
  totalAllocated: bigint;
  totalRewards: bigint;
}

export class WaterManagementService {
  private contract?: ethers.Contract;
  private provider?: ethers.JsonRpcProvider;
  private signer?: ethers.Wallet;
  private mockMode: boolean;

  constructor() {
    const contractAddress = process.env.NEXT_PUBLIC_WATER_MANAGEMENT_CONTRACT_ADDRESS;
    
    // Check if we should use mock mode
    this.mockMode = process.env.HEDERA_MOCK_MODE === 'true' || !contractAddress;
    
    if (!this.mockMode && contractAddress) {
      try {
        // Initialize Hedera client for read operations
        const client = createHederaClient();
        this.provider = new ethers.JsonRpcProvider(process.env.HEDERA_JSON_RPC_URL || 'https://testnet.hashio.io/api');
        this.contract = new ethers.Contract(contractAddress, WATER_MANAGEMENT_ABI, this.provider) as ethers.Contract;
        
        // Initialize signer for write operations (server-side only)
        if (process.env.HEDERA_PRIVATE_KEY) {
          this.signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, this.provider);
        }
      } catch (error) {
        console.warn('Failed to initialize contract, falling back to mock mode:', error);
        this.mockMode = true;
      }
    }
  }

  // Read functions
  async getWellInfo(wellId: number): Promise<WellInfo> {
    if (this.mockMode) {
      // Return mock data
      return {
        id: BigInt(wellId),
        owner: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
        location: `Mock Well Location ${wellId}`,
        capacity: BigInt(10000),
        availableCapacity: BigInt(7500),
        pricePerLiter: BigInt('100000000000000000'), // 0.1 HBAR
        isActive: true,
        registeredAt: BigInt(Math.floor(Date.now() / 1000))
      };
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.getWellInfo(wellId);
      return {
        id: result[0],
        owner: result[1],
        location: result[2],
        capacity: result[3],
        availableCapacity: result[4],
        pricePerLiter: result[5],
        isActive: result[6],
        registeredAt: result[7]
      };
    } catch (error) {
      console.error('Error getting well info:', error);
      throw error;
    }
  }

  async getUserWaterAllocation(wellId: number, userAddress: string): Promise<WaterAllocation> {
    if (this.mockMode) {
      // Return mock data
      return {
        allocatedAmount: BigInt(1000),
        usedAmount: BigInt(250),
        remainingAmount: BigInt(750),
        expiresAt: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30), // 30 days from now
        isValid: true
      };
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.getUserWaterAllocation(wellId, userAddress);
      return {
        allocatedAmount: result[0],
        usedAmount: result[1],
        remainingAmount: result[2],
        expiresAt: result[3],
        isValid: result[4]
      };
    } catch (error) {
      console.error('Error getting user water allocation:', error);
      throw error;
    }
  }

  async getQualityHistory(wellId: number, limit: number = 10): Promise<QualityData[]> {
    if (this.mockMode) {
      // Return mock data
      const mockData: QualityData[] = [];
      for (let i = 0; i < Math.min(limit, 5); i++) {
        mockData.push({
          ph: BigInt(700 + Math.floor(Math.random() * 100)), // pH 7.0-8.0
          tds: BigInt(100 + Math.floor(Math.random() * 200)), // TDS 100-300 ppm
          turbidity: BigInt(Math.floor(Math.random() * 10)), // Turbidity 0-10 NTU
          timestamp: BigInt(Math.floor(Date.now() / 1000) - i * 3600), // Each hour back
          submitter: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87'
        });
      }
      return mockData;
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.getQualityHistory(wellId, limit);
      return result.map((item: any) => ({
        ph: item[0],
        tds: item[1],
        turbidity: item[2],
        timestamp: item[3],
        submitter: item[4]
      }));
    } catch (error) {
      console.error('Error getting quality history:', error);
      throw error;
    }
  }

  async getConservationMetrics(userAddress: string): Promise<ConservationMetrics> {
    if (this.mockMode) {
      // Return mock data
      return {
        totalSaved: BigInt(5000),
        rewardsEarned: BigInt('500000000000000000'), // 0.5 HBAR
        lastRewardTime: BigInt(Math.floor(Date.now() / 1000) - 86400), // 1 day ago
        conservationScore: BigInt(85)
      };
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.getConservationMetrics(userAddress);
      return {
        totalSaved: result[0],
        rewardsEarned: result[1],
        lastRewardTime: result[2],
        conservationScore: result[3]
      };
    } catch (error) {
      console.error('Error getting conservation metrics:', error);
      throw error;
    }
  }

  async getContractStats(): Promise<ContractStats> {
    if (this.mockMode) {
      // Return mock data
      return {
        totalWells: BigInt(25),
        totalAllocated: BigInt(150000),
        totalRewards: BigInt('10000000000000000000') // 10 HBAR
      };
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.getContractStats();
      return {
        totalWells: result[0],
        totalAllocated: result[1],
        totalRewards: result[2]
      };
    } catch (error) {
      console.error('Error getting contract stats:', error);
      throw error;
    }
  }

  // Write functions (require signer)
  async registerWell(location: string, capacity: number, pricePerLiter: number): Promise<string> {
    if (this.mockMode) {
      // Return mock transaction hash
      console.log('Mock: Registering well', { location, capacity, pricePerLiter });
      return '0x' + Math.random().toString(16).substr(2, 64);
    }

    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.registerWell(
        location,
        ethers.parseUnits(capacity.toString(), 0),
        ethers.parseUnits(pricePerLiter.toString(), 18)
      );
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error registering well:', error);
      throw error;
    }
  }

  async allocateWater(wellId: number, userAddress: string, amount: number, duration: number): Promise<string> {
    if (this.mockMode) {
      // Return mock transaction hash
      console.log('Mock: Allocating water', { wellId, userAddress, amount, duration });
      return '0x' + Math.random().toString(16).substr(2, 64);
    }

    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.allocateWater(
        wellId,
        userAddress,
        ethers.parseUnits(amount.toString(), 0),
        duration
      );
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error allocating water:', error);
      throw error;
    }
  }

  async recordWaterUsage(wellId: number, userAddress: string, amount: number): Promise<string> {
    if (this.mockMode) {
      // Return mock transaction hash
      console.log('Mock: Recording water usage', { wellId, userAddress, amount });
      return '0x' + Math.random().toString(16).substr(2, 64);
    }

    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.recordWaterUsage(wellId, userAddress, ethers.parseUnits(amount.toString(), 0));
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error recording water usage:', error);
      throw error;
    }
  }

  async submitQualityData(wellId: number, ph: number, tds: number, turbidity: number): Promise<string> {
    if (this.mockMode) {
      // Return mock transaction hash
      console.log('Mock: Submitting quality data', { wellId, ph, tds, turbidity });
      return '0x' + Math.random().toString(16).substr(2, 64);
    }

    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.submitQualityData(
        wellId,
        Math.round(ph * 100), // Convert to 2 decimal places
        tds,
        turbidity
      );
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error submitting quality data:', error);
      throw error;
    }
  }

  async recordConservation(userAddress: string, waterSaved: number, reason: string): Promise<string> {
    if (this.mockMode) {
      // Return mock transaction hash
      console.log('Mock: Recording conservation', { userAddress, waterSaved, reason });
      return '0x' + Math.random().toString(16).substr(2, 64);
    }

    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.recordConservation(
        userAddress,
        ethers.parseUnits(waterSaved.toString(), 0),
        reason
      );
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error recording conservation:', error);
      throw error;
    }
  }

  // Utility functions
  formatWaterAmount(amount: bigint): string {
    return ethers.formatUnits(amount, 0) + ' L';
  }

  formatPrice(price: bigint): string {
    return ethers.formatUnits(price, 18) + ' HBAR';
  }

  formatTimestamp(timestamp: bigint): Date {
    return new Date(Number(timestamp) * 1000);
  }
}

// Export singleton instance
export const waterManagementService = new WaterManagementService();