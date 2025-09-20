import { NextResponse } from 'next/server';

export async function GET() {
  // Add logic to fetch wells
  return NextResponse.json({ wells: [] });
}