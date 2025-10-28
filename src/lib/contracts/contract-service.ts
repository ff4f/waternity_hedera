import {
  Client,
  PrivateKey,
  AccountId,
  ContractCreateFlow,
  ContractExecuteTransaction,
  ContractCallQuery,
  ContractFunctionParameters,
  ContractId,
  Hbar,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCreateTransaction,
  FileId
} from '@hashgraph/sdk';
import fs from 'fs';
import path from 'path';

export interface ContractConfig {
  operatorId: string;
  operatorKey: string;
  network: 'testnet' | 'mainnet';
}

export interface WellData {
  id: number;
  operator: string;
  location: string;
  name: string;
  totalCapacity: number;
  availableCapacity: number;
  pricePerLiter: number;
  isActive: boolean;
  hcsTopicId: string;
}

export interface AllocationData {
  allocatedAmount: number;
  usedAmount: number;
  remainingAmount: number;
  expiresAt: number;
  isActive: boolean;
}

export interface QualityData {
  wellId: number;
  dataHash: string;
  ph: number;
  turbidity: number;
  temperature: number;
  timestamp: number;
  submittedBy: string;
}

export interface ConservationMetrics {
  totalSaved: number;
  rewardsEarned: number;
  lastRewardTime: number;
  conservationScore: number;
}

export class WaterManagementContractService {
  private client: Client;
  private operatorKey: PrivateKey;
  private operatorId: AccountId;
  private contractId?: ContractId;
  private contractABI: any;

  constructor(config: ContractConfig) {
    // Initialize Hedera client
    if (config.network === 'testnet') {
      this.client = Client.forTestnet();
    } else {
      this.client = Client.forMainnet();
    }

    this.operatorKey = PrivateKey.fromString(config.operatorKey);
    this.operatorId = AccountId.fromString(config.operatorId);
    
    this.client.setOperator(this.operatorId, this.operatorKey);
    
    // Load contract ABI (you would need to compile the Solidity contract first)
    this.loadContractABI();
  }

  private loadContractABI() {
    // This would typically load from compiled contract artifacts
    // For now, we'll define the essential function signatures
    this.contractABI = {
      registerWell: 'registerWell(string,string,uint256,uint256,string)',
      allocateWater: 'allocateWater(uint256,address,uint256,uint256)',
      recordWaterUsage: 'recordWaterUsage(uint256,address,uint256)',
      submitQualityData: 'submitQualityData(uint256,string,uint256,uint256,uint256)',
      recordConservation: 'recordConservation(address,uint256,string)',
      getWell: 'getWell(uint256)',
      getUserAllocation: 'getUserAllocation(uint256,address)',
      getQualityHistory: 'getQualityHistory(uint256,uint256)',
      getConservationMetrics: 'getConservationMetrics(address)'
    };
  }

  /**
   * Deploy the WaterManagement smart contract
   */
  async deployContract(
    paymentTokenAddress: string,
    rewardTokenAddress: string,
    contractBytecode: string
  ): Promise<ContractId> {
    try {
      // Create file to store contract bytecode
      const fileCreateTx = new FileCreateTransaction()
        .setContents(contractBytecode)
        .setKeys([this.operatorKey.publicKey])
        .setMaxTransactionFee(new Hbar(2));

      const fileCreateResponse = await fileCreateTx.execute(this.client);
      const fileCreateReceipt = await fileCreateResponse.getReceipt(this.client);
      const bytecodeFileId = fileCreateReceipt.fileId;

      if (!bytecodeFileId) {
        throw new Error('Failed to create bytecode file');
      }

      // Deploy contract
      const contractCreateTx = new ContractCreateTransaction()
        .setBytecodeFileId(bytecodeFileId)
        .setGas(1000000)
        .setConstructorParameters(
          new ContractFunctionParameters()
            .addAddress(paymentTokenAddress)
            .addAddress(rewardTokenAddress)
        )
        .setMaxTransactionFee(new Hbar(20));

      const contractCreateResponse = await contractCreateTx.execute(this.client);
      const contractCreateReceipt = await contractCreateResponse.getReceipt(this.client);
      
      const contractId = contractCreateReceipt.contractId;
      
      if (!contractId) {
        throw new Error('Failed to deploy contract');
      }
      
      this.contractId = contractId;

      console.log(`Contract deployed with ID: ${this.contractId}`);
      return this.contractId;
    } catch (error) {
      console.error('Error deploying contract:', error);
      throw new Error('Failed to deploy WaterManagement contract');
    }
  }

  /**
   * Set the contract ID for an already deployed contract
   */
  setContractId(contractId: string) {
    this.contractId = ContractId.fromString(contractId);
  }

  // ===== WELL MANAGEMENT FUNCTIONS =====

  /**
   * Register a new water well
   */
  async registerWell(
    location: string,
    name: string,
    totalCapacity: number,
    pricePerLiter: number,
    hcsTopicId: string
  ): Promise<string> {
    if (!this.contractId) {
      throw new Error('Contract not deployed or ID not set');
    }

    try {
      const transaction = new ContractExecuteTransaction()
        .setContractId(this.contractId)
        .setGas(300000)
        .setFunction(
          this.contractABI.registerWell,
          new ContractFunctionParameters()
            .addString(location)
            .addString(name)
            .addUint256(totalCapacity)
            .addUint256(pricePerLiter)
            .addString(hcsTopicId)
        )
        .setMaxTransactionFee(new Hbar(2));

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      return response.transactionId.toString();
    } catch (error) {
      console.error('Error registering well:', error);
      throw new Error('Failed to register well');
    }
  }

  /**
   * Get well information
   */
  async getWell(wellId: number): Promise<WellData> {
    if (!this.contractId) {
      throw new Error('Contract not deployed or ID not set');
    }

    try {
      const query = new ContractCallQuery()
        .setContractId(this.contractId)
        .setGas(100000)
        .setFunction(
          this.contractABI.getWell,
          new ContractFunctionParameters().addUint256(wellId)
        );

      const result = await query.execute(this.client);
      
      // Parse the result (this would need proper ABI decoding)
      // For now, we'll return a mock structure
      return {
        id: wellId,
        operator: '0x' + result.getAddress(1),
        location: result.getString(2),
        name: result.getString(3),
        totalCapacity: result.getUint256(4).toNumber(),
        availableCapacity: result.getUint256(5).toNumber(),
        pricePerLiter: result.getUint256(6).toNumber(),
        isActive: result.getBool(7),
        hcsTopicId: result.getString(8)
      };
    } catch (error) {
      console.error('Error getting well data:', error);
      throw new Error('Failed to get well information');
    }
  }

  // ===== WATER ALLOCATION FUNCTIONS =====

  /**
   * Allocate water to a user
   */
  async allocateWater(
    wellId: number,
    userAddress: string,
    amount: number,
    durationDays: number
  ): Promise<string> {
    if (!this.contractId) {
      throw new Error('Contract not deployed or ID not set');
    }

    try {
      const transaction = new ContractExecuteTransaction()
        .setContractId(this.contractId)
        .setGas(300000)
        .setFunction(
          this.contractABI.allocateWater,
          new ContractFunctionParameters()
            .addUint256(wellId)
            .addAddress(userAddress)
            .addUint256(amount)
            .addUint256(durationDays)
        )
        .setMaxTransactionFee(new Hbar(2));

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      return response.transactionId.toString();
    } catch (error) {
      console.error('Error allocating water:', error);
      throw new Error('Failed to allocate water');
    }
  }

  /**
   * Record water usage
   */
  async recordWaterUsage(
    wellId: number,
    userAddress: string,
    amount: number
  ): Promise<string> {
    if (!this.contractId) {
      throw new Error('Contract not deployed or ID not set');
    }

    try {
      const transaction = new ContractExecuteTransaction()
        .setContractId(this.contractId)
        .setGas(200000)
        .setFunction(
          this.contractABI.recordWaterUsage,
          new ContractFunctionParameters()
            .addUint256(wellId)
            .addAddress(userAddress)
            .addUint256(amount)
        )
        .setMaxTransactionFee(new Hbar(1));

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      return response.transactionId.toString();
    } catch (error) {
      console.error('Error recording water usage:', error);
      throw new Error('Failed to record water usage');
    }
  }

  /**
   * Get user's water allocation
   */
  async getUserAllocation(wellId: number, userAddress: string): Promise<AllocationData> {
    if (!this.contractId) {
      throw new Error('Contract not deployed or ID not set');
    }

    try {
      const query = new ContractCallQuery()
        .setContractId(this.contractId)
        .setGas(100000)
        .setFunction(
          this.contractABI.getUserAllocation,
          new ContractFunctionParameters()
            .addUint256(wellId)
            .addAddress(userAddress)
        );

      const result = await query.execute(this.client);
      
      return {
        allocatedAmount: result.getUint256(0).toNumber(),
        usedAmount: result.getUint256(1).toNumber(),
        remainingAmount: result.getUint256(2).toNumber(),
        expiresAt: result.getUint256(3).toNumber(),
        isActive: result.getBool(4)
      };
    } catch (error) {
      console.error('Error getting user allocation:', error);
      throw new Error('Failed to get user allocation');
    }
  }

  // ===== QUALITY MANAGEMENT FUNCTIONS =====

  /**
   * Submit water quality data
   */
  async submitQualityData(
    wellId: number,
    dataHash: string,
    ph: number,
    turbidity: number,
    temperature: number
  ): Promise<string> {
    if (!this.contractId) {
      throw new Error('Contract not deployed or ID not set');
    }

    try {
      const transaction = new ContractExecuteTransaction()
        .setContractId(this.contractId)
        .setGas(200000)
        .setFunction(
          this.contractABI.submitQualityData,
          new ContractFunctionParameters()
            .addUint256(wellId)
            .addString(dataHash)
            .addUint256(Math.floor(ph * 100)) // Convert to integer
            .addUint256(Math.floor(turbidity * 100))
            .addUint256(Math.floor(temperature * 100))
        )
        .setMaxTransactionFee(new Hbar(1));

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      return response.transactionId.toString();
    } catch (error) {
      console.error('Error submitting quality data:', error);
      throw new Error('Failed to submit quality data');
    }
  }

  /**
   * Get quality history for a well
   */
  async getQualityHistory(wellId: number, limit: number = 10): Promise<QualityData[]> {
    if (!this.contractId) {
      throw new Error('Contract not deployed or ID not set');
    }

    try {
      const query = new ContractCallQuery()
        .setContractId(this.contractId)
        .setGas(200000)
        .setFunction(
          this.contractABI.getQualityHistory,
          new ContractFunctionParameters()
            .addUint256(wellId)
            .addUint256(limit)
        );

      const result = await query.execute(this.client);
      
      // This would need proper ABI decoding for array results
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting quality history:', error);
      throw new Error('Failed to get quality history');
    }
  }

  // ===== CONSERVATION FUNCTIONS =====

  /**
   * Record conservation achievement
   */
  async recordConservation(
    userAddress: string,
    waterSaved: number,
    reason: string
  ): Promise<string> {
    if (!this.contractId) {
      throw new Error('Contract not deployed or ID not set');
    }

    try {
      const transaction = new ContractExecuteTransaction()
        .setContractId(this.contractId)
        .setGas(200000)
        .setFunction(
          this.contractABI.recordConservation,
          new ContractFunctionParameters()
            .addAddress(userAddress)
            .addUint256(waterSaved)
            .addString(reason)
        )
        .setMaxTransactionFee(new Hbar(1));

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      return response.transactionId.toString();
    } catch (error) {
      console.error('Error recording conservation:', error);
      throw new Error('Failed to record conservation');
    }
  }

  /**
   * Get user's conservation metrics
   */
  async getConservationMetrics(userAddress: string): Promise<ConservationMetrics> {
    if (!this.contractId) {
      throw new Error('Contract not deployed or ID not set');
    }

    try {
      const query = new ContractCallQuery()
        .setContractId(this.contractId)
        .setGas(100000)
        .setFunction(
          this.contractABI.getConservationMetrics,
          new ContractFunctionParameters().addAddress(userAddress)
        );

      const result = await query.execute(this.client);
      
      return {
        totalSaved: result.getUint256(0).toNumber(),
        rewardsEarned: result.getUint256(1).toNumber(),
        lastRewardTime: result.getUint256(2).toNumber(),
        conservationScore: result.getUint256(3).toNumber()
      };
    } catch (error) {
      console.error('Error getting conservation metrics:', error);
      throw new Error('Failed to get conservation metrics');
    }
  }

  // ===== UTILITY FUNCTIONS =====

  /**
   * Get contract statistics
   */
  async getContractStats(): Promise<{
    totalWells: number;
    totalAllocated: number;
    totalRewards: number;
    contractBalance: number;
  }> {
    if (!this.contractId) {
      throw new Error('Contract not deployed or ID not set');
    }

    try {
      const query = new ContractCallQuery()
        .setContractId(this.contractId)
        .setGas(100000)
        .setFunction('getContractStats()');

      const result = await query.execute(this.client);
      
      return {
        totalWells: result.getUint256(0).toNumber(),
        totalAllocated: result.getUint256(1).toNumber(),
        totalRewards: result.getUint256(2).toNumber(),
        contractBalance: result.getUint256(3).toNumber()
      };
    } catch (error) {
      console.error('Error getting contract stats:', error);
      throw new Error('Failed to get contract statistics');
    }
  }

  /**
   * Close the client connection
   */
  close(): void {
    this.client.close();
  }
}

// Create singleton instance
const contractConfig: ContractConfig = {
  operatorId: process.env.HEDERA_OPERATOR_ID || '',
  operatorKey: process.env.HEDERA_OPERATOR_KEY || '',
  network: (process.env.HEDERA_NETWORK as 'testnet' | 'mainnet') || 'testnet'
};

export const waterManagementContract = new WaterManagementContractService(contractConfig);