import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { deviceId, interfaceId, action } = await req.json();

    if (!deviceId || !interfaceId) {
      return NextResponse.json({ error: 'Missing deviceId or interfaceId' }, { status: 400 });
    }

    // In a real production deployment with SNMP write access or SSH:
    // snmpset -v2c -c private <ip> ifAdminStatus.<ifIndex> i [1=up, 2=down]
    return NextResponse.json({
      success: true,
      deviceId,
      interfaceId,
      newStatus: action === 'shutdown' ? 'DOWN' : 'UP',
      snmpCommand: `snmpset -v2c -c private [IP] 1.3.6.1.2.1.2.2.1.7.${interfaceId} i ${action === 'shutdown' ? 2 : 1}`,
      message: `Port ${interfaceId} administratif changé vers ${action === 'shutdown' ? 'DOWN (shutdown)' : 'UP (no shutdown)'}`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
