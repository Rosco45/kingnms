import { NextResponse } from 'next/server';
import { getLocalNetworkInterfaces } from '../../../../lib/realScanner';

export async function GET() {
  try {
    const netInfo = await getLocalNetworkInterfaces();
    return NextResponse.json({
      success: true,
      ...netInfo
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
