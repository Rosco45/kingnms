import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_DEVICES } from '../../../lib/mockData';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const site = searchParams.get('site');
  const type = searchParams.get('type');
  const status = searchParams.get('status');

  let list = [...INITIAL_DEVICES];
  if (site && site !== 'all') {
    list = list.filter(d => d.siteId === site);
  }
  if (type && type !== 'all') {
    list = list.filter(d => d.type === type);
  }
  if (status && status !== 'all') {
    list = list.filter(d => d.status === status);
  }

  return NextResponse.json({
    total: list.length,
    devices: list
  });
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    return NextResponse.json({
      success: true,
      message: 'Device added to inventory',
      device: data
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
