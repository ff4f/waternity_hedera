import { HcsEvent, Settlement, Payout, Well, WellMembership, User, Token, Document, Anchor } from '@prisma/client';

export enum SettlementState {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  EXECUTED = "EXECUTED",
  REJECTED = "REJECTED",
}

export enum Role {
  INVESTOR = "INVESTOR",
  OPERATOR = "OPERATOR", 
  AGENT = "AGENT",
  ADMIN = "ADMIN",
}

export interface AuthUser {
  sub: string;
  name: string;
  role: Role;
  iat: number;
  exp: number;
}

export type { HcsEvent, Settlement, Payout, Well, WellMembership, User, Token, Document, Anchor };