import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { requireUser, assertRole, createUnauthorizedResponse, createForbiddenResponse, AuthenticationError, AuthorizationError } from '@/lib/auth/roles';
import { isValidTopicId } from '@/lib/hedera/ids';

// Helper: try decode URL-safe Base64 string to UTF-8, return null if invalid
function decodeMaybeBase64(input: string): string | null {
  try {
    // Normalize URL-safe base64
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if missing
    const pad = normalized.length % 4;
    const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
    const decoded = Buffer.from(padded, 'base64').toString('utf-8');
    // Basic sanity check: only printable ASCII
    if (/^[\x20-\x7E]+$/.test(decoded)) {
      return decoded.trim();
    }
    return null;
  } catch {
    return null;
  }
}

const updateWellSchema = z.object({
  code: z.string().min(1, 'Well code is required').optional(),
  name: z.string().min(1, 'Well name is required').optional(),
  location: z.string().min(1, 'Location is required').optional(),
  topicId: z.string().min(1, 'Topic ID is required').optional(),
  operatorUserId: z.string().min(1, 'Operator user ID is required').optional(),
  tokenId: z.string().optional()
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    console.log('[API] GET /api/wells/[id] param:', params.id)
    // Common include config reused for all lookups
    const include = {
      operator: {
        select: { id: true, name: true }
      }
    } as const;

    // 1) Try by primary ID
    let well = await prisma.well.findUnique({
      where: { id: params.id },
      include
    });
    console.log('[API] findUnique by id ->', !!well)

    // 2) Fallbacks: by code, or decoded base64 id/code
    if (!well) {
      const decoded = decodeMaybeBase64(params.id);
      console.log('[API] decoded base64 ->', decoded)

      // Try by code directly
      well = await prisma.well.findFirst({
        where: { code: params.id },
        include
      });
      console.log('[API] findFirst by code ->', !!well)

      // If still not found, try decoded variants
      if (!well && decoded) {
        well = await prisma.well.findUnique({ where: { id: decoded }, include })
          ?? await prisma.well.findFirst({ where: { code: decoded }, include });
        console.log('[API] find by decoded ->', !!well)
      }
    }

    if (!well) {
      console.warn('[API] Well not found for id:', params.id)
      return NextResponse.json(
        { error: 'Well not found' },
        { status: 404 }
      );
    }

    console.log('[API] Well found:', well.id)
    return NextResponse.json(well);
  } catch (error) {
    console.error('[API] Error fetching well:', error instanceof Error ? error.message : error)
    if (error instanceof Error && (error as any).stack) {
      console.error('[API] Stack:', (error as any).stack)
    }
    return NextResponse.json(
      { error: 'Failed to fetch well' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    // Require OPERATOR or ADMIN role
    const user = await requireUser(request as NextRequest);
    assertRole(user, 'OPERATOR', 'ADMIN');
    
    const body = await request.json();
    const validatedData = updateWellSchema.parse(body);

    // Validate topicId format if provided
    if (validatedData.topicId && !isValidTopicId(validatedData.topicId)) {
      return NextResponse.json(
        {
          error: 'invalid_topic_id',
          details: [`Invalid topicId format: ${validatedData.topicId}. Expected format: x.y.z (e.g., 0.0.123)`]
        },
        { status: 400 }
      );
    }

    // Check if well exists
    const existingWell = await prisma.well.findUnique({
      where: { id: params.id }
    });

    if (!existingWell) {
      return NextResponse.json(
        { error: 'Well not found' },
        { status: 404 }
      );
    }

    // If updating operator, check if new operator exists
    if (validatedData.operatorUserId) {
      const operator = await prisma.user.findUnique({
        where: { id: validatedData.operatorUserId }
      });

      if (!operator) {
        return NextResponse.json(
          { error: 'Operator user not found' },
          { status: 404 }
        );
      }
    }

    // If updating code, check uniqueness
    if (validatedData.code && validatedData.code !== existingWell.code) {
      const codeExists = await prisma.well.findFirst({
        where: {
          code: validatedData.code,
          id: { not: params.id }
        }
      });

      if (codeExists) {
        return NextResponse.json(
          { error: 'Well code already exists' },
          { status: 409 }
        );
      }
    }

    const updatedWell = await prisma.well.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        operator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(updatedWell);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating well:', error);
    return NextResponse.json(
      { error: 'Failed to update well' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    // Require ADMIN role for deletion
    const user = await requireUser(request as NextRequest);
    assertRole(user, 'ADMIN');
    
    // Check if well exists
    const existingWell = await prisma.well.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            events: true,
            settlements: true,
            memberships: true
          }
        }
      }
    });

    if (!existingWell) {
      return NextResponse.json(
        { error: 'Well not found' },
        { status: 404 }
      );
    }

    // Check if well has dependencies
    const hasData = existingWell._count.events > 0 || 
                   existingWell._count.settlements > 0 || 
                   existingWell._count.memberships > 0;

    if (hasData) {
      return NextResponse.json(
        { 
          error: 'Cannot delete well with existing data',
          details: {
            events: existingWell._count.events,
            settlements: existingWell._count.settlements,
            memberships: existingWell._count.memberships
          }
        },
        { status: 409 }
      );
    }

    await prisma.well.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Well deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    
    if (error instanceof AuthorizationError) {
      return createForbiddenResponse();
    }
    
    console.error('Error deleting well:', error);
    return NextResponse.json(
      { error: 'Failed to delete well' },
      { status: 500 }
    );
  }
}