// TODO: Projects API endpoints (GET all, POST new)
import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Fetch projects from database
  return NextResponse.json({ projects: [] });
}

export async function POST() {
  // TODO: Create new project
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}
