import { getOperator } from "@/lib/hedera/client";
import { prisma } from "@/lib/db/prisma";
import { ulid } from "ulid";
import { TopicMessageSubmitTransaction, Client } from "@hashgraph/sdk";
import { Prisma } from "@prisma/client";

export interface HcsEventMessage {
  type: string;
  payload: { [key: string]: any };
}

export async function submitMessage(wellId: string, event: HcsEventMessage) {
  const messageId = ulid();

  const well = await prisma.well.findUnique({
    where: { id: wellId },
  });

  if (!well) {
    throw new Error(`Well not found for id: ${wellId}`);
  }

  const message = {
    type: event.type,
    messageId: messageId,
    payload: event.payload,
  };

  // TODO: Implement validateEvent
  // validateEvent(message);

  const { client } = getOperator();

  const tx = new TopicMessageSubmitTransaction({
    topicId: well.topicId,
    message: JSON.stringify(message),
  }).freezeWith(client);

  const txResponse = await tx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  const record = await txResponse.getRecord(client);

  const data: Prisma.HcsEventUncheckedCreateInput = {
    wellId: wellId,
    type: message.type,
    messageId: message.messageId,
    txId: txResponse.transactionId.toString(),
    payloadJson: JSON.stringify(message.payload),
    consensusTime: record.consensusTimestamp.toDate(),
  };

  if (receipt.topicSequenceNumber) {
    data.sequenceNumber = BigInt(receipt.topicSequenceNumber.toString());
  }

  const hcsEvent = await prisma.hcsEvent.create({
    data,
  });

  return {
    hcsEvent,
    messageId: hcsEvent.messageId,
    txId: hcsEvent.txId,
  };
}