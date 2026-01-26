// TODO: Donor inquiry API endpoints
import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Fetch inquiries from database
  return NextResponse.json({ inquiries: [] });
}

export async function POST() {
  // TODO: Create new inquiry
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}
