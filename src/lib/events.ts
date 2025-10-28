import { EventEmitter } from 'events';

/**
 * Global event emitter for application-wide events
 */
export const eventEmitter = new EventEmitter();

/**
 * Event types for type safety
 */
export enum EventTypes {
  DOCUMENT_ANCHORED = 'document:anchored',
  SETTLEMENT_REQUESTED = 'settlement:requested',
  SETTLEMENT_APPROVED = 'settlement:approved',
  SETTLEMENT_EXECUTED = 'settlement:executed',
  HCS_MESSAGE_SENT = 'hcs:message:sent',
  HCS_MESSAGE_RECEIVED = 'hcs:message:received',
}

/**
 * Event payload interfaces
 */
export interface DocumentAnchoredEvent {
  documentId: string;
  wellId: string;
  cid: string;
  hfsFileId?: string;
  messageId: string;
}

export interface SettlementEvent {
  settlementId: string;
  wellId: string;
  status: string;
  messageId?: string;
}

export interface HcsMessageEvent {
  messageId: string;
  topicId: string;
  wellId?: string;
  type: string;
  payload: unknown;
}