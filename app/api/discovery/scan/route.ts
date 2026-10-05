import { NextRequest, NextResponse } from 'next/server';
import { performRealSubnetScan, getLocalNetworkInterfaces } from '../../../../lib/realScanner';
import { addAuditEntry } from '../../../../lib/serverDb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let { subnet, snmpCommunity = 'public' } = body;

    // If subnet not provided or default requested, auto-detect host's real subnet
    if (!subnet || subnet === 'auto') {
      const netInfo = await getLocalNetworkInterfaces();
      subnet = netInfo.defaultSubnet;
    }

    // Execute real network scan
    const foundDevices = await performRealSubnetScan(subnet, snmpCommunity);

    addAuditEntry(
      'NETWORK_DISCOVERY_SCAN',
      subnet,
      `Scan réel terminé avec succès. ${foundDevices.length} hôte(s) actif(s) découvert(s) sur le réseau local.`
    );

    return NextResponse.json({
      success: true,
      subnet,
      community: snmpCommunity,
      totalScanned: 254,
      totalFound: foundDevices.length,
      devices: foundDevices
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
