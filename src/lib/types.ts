// Core application types for Waternity

// User and Authentication Types
export interface User {
  id: string;
  name: string;
  walletEvm: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Role {
  id: string;
  name: RoleName;
  description?: string;
  permissions?: Record<string, boolean>;
  createdAt: Date;
}

export enum RoleName {
  INVESTOR = 'INVESTOR',
  OPERATOR = 'OPERATOR',
  AGENT = 'AGENT',
  ADMIN = 'ADMIN'
}

// Well and Project Types
export interface Well {
  id: string;
  code: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  topicId: string;
  tokenId?: string;
  operatorUserId: string;
  depth?: number;
  capacity?: number;
  status: WellStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum WellStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE'
}

export interface WellMembership {
  id: string;
  userId: string;
  wellId: string;
  roleName: RoleName;
  shareBps?: number; // basis points (0-10000)
  createdAt: Date;
  updatedAt: Date;
}

// Hedera and Blockchain Types
export interface HcsEvent {
  id: string;
  wellId: string;
  type: HcsEventType;
  messageId: string;
  consensusTime: Date;
  sequenceNumber: bigint;
  txId?: string;
  payloadJson: Record<string, any>;
  hash?: string;
  createdAt: Date;
}

export enum HcsEventType {
  WELL_CREATED = 'WELL_CREATED',
  MILESTONE_VERIFIED = 'MILESTONE_VERIFIED',
  SETTLEMENT_REQUESTED = 'SETTLEMENT_REQUESTED',
  SETTLEMENT_EXECUTED = 'SETTLEMENT_EXECUTED',
  TOKEN_MINTED = 'TOKEN_MINTED',
  PAYOUT_EXECUTED = 'PAYOUT_EXECUTED',
  DOCUMENT_ANCHORED = 'DOCUMENT_ANCHORED',
  VALVE_CONTROLLED = 'VALVE_CONTROLLED'
}

export interface Token {
  id: string;
  wellId: string;
  tokenId: string;
  type: TokenType;
  name: string;
  symbol: string;
  treasuryAccount: string;
  decimals: number;
  totalSupply: number;
  circulatingSupply: number;
  createdAt: Date;
}

export enum TokenType {
  HTS_FT = 'HTS_FT',
  HTS_NFT = 'HTS_NFT'
}

// Document and File Types
export interface Document {
  id: string;
  wellId: string;
  type: DocumentType;
  title: string;
  description?: string;
  cid: string; // IPFS Content ID
  hfsFileId?: string; // Hedera File Service ID
  anchoredEventId?: string;
  uploadedBy: string;
  fileSize?: number;
  mimeType?: string;
  checksum?: string;
  createdAt: Date;
}

export enum DocumentType {
  CONTRACT = 'CONTRACT',
  PERMIT = 'PERMIT',
  REPORT = 'REPORT',
  PHOTO = 'PHOTO',
  CERTIFICATE = 'CERTIFICATE',
  INVOICE = 'INVOICE',
  OTHER = 'OTHER'
}

// Financial and Settlement Types
export interface Settlement {
  id: string;
  wellId: string;
  periodStart: Date;
  periodEnd: Date;
  kwhTotal: number;
  grossRevenue: number;
  netRevenue: number;
  operationalCosts: number;
  status: SettlementStatus;
  requestEventId?: string;
  executeEventId?: string;
  escrowTxId?: string;
  calculatedAt?: Date;
  executedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum SettlementStatus {
  DRAFT = 'DRAFT',
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  EXECUTED = 'EXECUTED',
  FAILED = 'FAILED'
}

export interface Payout {
  id: string;
  settlementId: string;
  recipientWallet: string;
  recipientUserId?: string;
  assetType: AssetType;
  amount: number;
  tokenId?: string;
  txId?: string;
  status: PayoutStatus;
  executedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum AssetType {
  HBAR = 'HBAR',
  TOKEN = 'TOKEN'
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  EXECUTED = 'EXECUTED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// Data Integrity Types
export interface Anchor {
  id: string;
  sourceType: AnchorSourceType;
  sourceId: string;
  hcsEventId: string;
  digestAlgo: DigestAlgorithm;
  digestHex: string;
  createdAt: Date;
}

export enum AnchorSourceType {
  DOCUMENT = 'DOCUMENT',
  SETTLEMENT = 'SETTLEMENT',
  METER_READING = 'METER_READING'
}

export enum DigestAlgorithm {
  SHA256 = 'SHA256',
  SHA512 = 'SHA512'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy';
  error?: string;
  timestamp: string;
}

// Dashboard and Analytics Types
export interface DashboardStats {
  totalWells: number;
  activeWells: number;
  totalRevenue: number;
  totalPayouts: number;
  recentEvents: HcsEvent[];
}

export interface WellAnalytics {
  wellId: string;
  wellCode: string;
  wellName: string;
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  kwhGenerated: number;
  efficiency: number;
  lastSettlement?: Date;
  memberCount: number;
}

export interface TimelineEvent {
  id: string;
  type: HcsEventType;
  title: string;
  description: string;
  timestamp: Date;
  txId?: string;
  wellCode?: string;
  metadata?: Record<string, any>;
}

// Form and Input Types
export interface CreateWellInput {
  code: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  depth?: number;
  capacity?: number;
  operatorUserId: string;
}

export interface UpdateWellInput extends Partial<CreateWellInput> {
  id: string;
  status?: WellStatus;
}

export interface CreateSettlementInput {
  wellId: string;
  periodStart: Date;
  periodEnd: Date;
  kwhTotal: number;
  grossRevenue: number;
  operationalCosts: number;
}

export interface CreatePayoutInput {
  settlementId: string;
  recipientWallet: string;
  assetType: AssetType;
  amount: number;
  tokenId?: string;
}

// Hedera Integration Types
export interface HederaConfig {
  network: 'testnet' | 'mainnet' | 'previewnet';
  accountId: string;
  privateKey: string;
  mirrorNodeUrl: string;
  hashscanBase: string;
}

export interface HederaTransaction {
  transactionId: string;
  consensusTimestamp: string;
  charged_tx_fee: number;
  memo_base64?: string;
  result: string;
  scheduled: boolean;
  transaction_hash: string;
  valid_duration_seconds: number;
  valid_start_timestamp: string;
}

export interface HederaAccount {
  account: string;
  alias?: string;
  auto_renew_period: number;
  balance: {
    balance: number;
    timestamp: string;
    tokens?: Array<{
      token_id: string;
      balance: number;
    }>;
  };
  created_timestamp: string;
  decline_reward: boolean;
  deleted: boolean;
  ethereum_nonce?: number;
  evm_address?: string;
  expiry_timestamp?: string;
  key?: {
    _type: string;
    key: string;
  };
  max_automatic_token_associations: number;
  memo: string;
  pending_reward: number;
  receiver_sig_required: boolean;
  staked_account_id?: string;
  staked_node_id?: number;
  stake_period_start?: string;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  HEDERA_ERROR = 'HEDERA_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// Component Props Types
export interface WellCardProps {
  well: Well & {
    operator: Pick<User, 'id' | 'name' | 'walletEvm'>;
    _count: {
      events: number;
      documents: number;
      settlements: number;
    };
  };
  onSelect?: (well: Well) => void;
}

export interface TimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ReactNode;
  loading?: boolean;
}

// Navigation and Routing Types
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

// Theme and UI Types
export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}