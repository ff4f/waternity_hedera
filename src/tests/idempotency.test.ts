import { describe, it, expect, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";
import handler from "@/pages/api/hcs/events";
import { prisma } from "@/lib/prisma";
import { User, Well } from "@prisma/client";

describe("/api/hcs/events", () => {
  let user: User;
  let well: Well;

  beforeEach(async () => {
    await prisma.payout.deleteMany();
    await prisma.settlement.deleteMany();
    await prisma.wellMembership.deleteMany();
    await prisma.anchor.deleteMany();
    await prisma.document.deleteMany();
    await prisma.hcsEvent.deleteMany();
    await prisma.token.deleteMany();
    await prisma.well.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        name: "Test User",
        role: "admin",
      },
    });

    well = await prisma.well.create({
      data: {
        name: "Test Well",
        code: "test-well-idempotency",
        location: "Test Location",
        topicId: "test-topic",
        operatorUserId: user.id,
      },
    });
  });

  it("should be idempotent", async () => {
    const messageId = "test-message-id";
    const body = {
      event: {
        messageId,
        message: "test-message",
        wellId: well.id,
      },
    };

    const { req: req1, res: res1 } = createMocks({
      method: "POST",
      body,
    });

    await handler(req1, res1);

    expect(res1._getStatusCode()).toBe(202);

    const { req: req2, res: res2 } = createMocks({
      method: "POST",
      body,
    });

    await handler(req2, res2);

    expect(res2._getStatusCode()).toBe(200);

    const count = await prisma.hcsEvent.count();
    expect(count).toBe(1);
  });
});