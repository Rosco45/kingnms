import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { subnet = '192.168.1.0/24', snmpCommunity = 'public' } = await req.json();

    // Simulated discovered hosts for the scan response
    const mockFound = [
      {
        ip: subnet.replace(/\.0\/\d+$/, '.1'),
        mac: '00:1E:13:4A:88:01',
        hostname: 'RT-CORE-01',
        vendor: 'Cisco Systems',
        type: 'router',
        os: 'Cisco IOS-XE 17.06.01a',
        latencyMs: 1.2,
        status: 'UP'
      },
      {
        ip: subnet.replace(/\.0\/\d+$/, '.2'),
        mac: '00:1E:13:4A:88:02',
        hostname: 'SW-CORE-01',
        vendor: 'Cisco Systems',
        type: 'switch',
        os: 'Cisco IOS-XE 16.12.04',
        latencyMs: 1.5,
        status: 'UP'
      },
      {
        ip: subnet.replace(/\.0\/\d+$/, '.45'),
        mac: '5C:E9:1E:A4:77:21',
        hostname: 'Galaxy-Tab-Directeur',
        vendor: 'Samsung Electronics',
        type: 'pc',
        os: 'Android 14',
        latencyMs: 5.4,
        status: 'UP',
        isNew: true
      }
    ];

    return NextResponse.json({
      success: true,
      subnet,
      community: snmpCommunity,
      totalScanned: 254,
      totalFound: mockFound.length,
      devices: mockFound
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
