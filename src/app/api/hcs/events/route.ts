import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { publishHcsMessage } from "@/lib/hedera/hcs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messageId, type, wellId, emittedBy, version, payload } = body;

    if (!wellId) {
      return new NextResponse("Well ID is required", { status: 400 });
    }

    const well = await prisma.well.findUnique({
      where: { id: wellId },
    });

    if (!well) {
      return new NextResponse("Well not found", { status: 404 });
    }

    const result = await publishHcsMessage({
      topicId: well.topicId,
      message: body,
    });

    return new NextResponse(JSON.stringify(result), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(error);
    return new NextResponse(error.message, { status: 500 });
  }
}