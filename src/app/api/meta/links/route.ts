import { NextRequest, NextResponse } from 'next/server';
import { getWellMetaLinks } from '@/lib/db/queries';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/log';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wellId = searchParams.get('wellId');

    if (!wellId) {
      logger.warn('Meta links request missing wellId parameter');
      return NextResponse.json(
        { error: 'wellId parameter is required' },
        { status: 400 }
      );
    }

    // Get well details including topicId
    const well = await prisma.well.findUnique({
      where: { id: wellId },
      select: {
        id: true,
        topicId: true
      }
    });

    if (!well) {
      logger.warn('Well not found for meta links', { wellId });
      return NextResponse.json(
        { error: 'Well not found' },
        { status: 404 }
      );
    }

    // Get the meta links
    const metaLinks = await getWellMetaLinks(wellId);

    if (!metaLinks) {
      logger.warn('Meta links not found for well', { wellId });
      return NextResponse.json(
        { error: 'Meta links not found for this well' },
        { status: 404 }
      );
    }

    const response = {
      wellId: well.id,
      topicId: well.topicId,
      links: {
        hashscan: metaLinks.hashscan,
        mirror: metaLinks.mirror
      }
    };

    logger.info('Meta links retrieved successfully', {
      wellId,
      topicId: well.topicId,
      hasHashscanLinks: !!metaLinks.hashscan,
      hasMirrorLinks: !!metaLinks.mirror
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching well meta links', {
      error: error instanceof Error ? error.message : 'Unknown error',
      wellId: request.nextUrl.searchParams.get('wellId')
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch well meta links' },
      { status: 500 }
    );
  }
}