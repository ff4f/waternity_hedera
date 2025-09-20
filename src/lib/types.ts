import { HcsEvent, Settlement, Payout, Well, WellMembership, User, Token, Document, Anchor } from '@prisma/client';

export enum SettlementState {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  EXECUTED = "EXECUTED",
  REJECTED = "REJECTED",
}

export type { HcsEvent, Settlement, Payout, Well, WellMembership, User, Token, Document, Anchor };