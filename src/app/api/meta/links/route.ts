import { NextRequest, NextResponse } from 'next/server';
import { getWellMetaLinks } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wellId = searchParams.get('wellId');

    if (!wellId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: wellId' },
        { status: 400 },
      );
    }

    const metaLinks = await getWellMetaLinks(wellId);

    if (!metaLinks) {
      return NextResponse.json(
        { error: 'Well not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(metaLinks);
  } catch (error) {
    console.error('Error fetching meta links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meta links' },
      { status: 500 },
    );
  }
}