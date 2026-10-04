import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_ALERTS } from '../../../lib/mockData';

export async function GET() {
  return NextResponse.json({ alerts: INITIAL_ALERTS });
}

export async function POST(req: NextRequest) {
  try {
    const { id, action } = await req.json();
    return NextResponse.json({
      success: true,
      message: `Alert ${id} updated with action ${action}`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
