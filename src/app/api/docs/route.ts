import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

export async function GET() {
  const yamlPath = path.join(process.cwd(), 'openapi.yaml');
  const fileContent = readFileSync(yamlPath, 'utf8');
  return new NextResponse(fileContent, {
    headers: {
      'Content-Type': 'application/yaml',
    },
  });
}