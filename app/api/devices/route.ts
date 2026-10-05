import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDevice, addAuditEntry } from '../../../lib/serverDb';
import { Device } from '../../../types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const site = searchParams.get('site');
  const type = searchParams.get('type');
  const status = searchParams.get('status');

  const db = getDatabase();
  let list = [...db.devices];

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

    const newDevice: Device = {
      id: data.id || `dev-${Date.now()}`,
      ip: data.ip,
      hostname: data.hostname || `DEV-${data.ip.split('.').pop()}`,
      mac: data.mac || '00:00:00:00:00:00',
      vendor: data.vendor || 'Générique',
      type: data.type || 'server',
      status: 'UP',
      siteId: data.siteId || 'cotonou',
      vlanId: data.vlanId || 10,
      model: data.model || 'Périphérique Réseau',
      os: data.os || 'Linux / OS Réseau',
      serialNumber: data.serialNumber || `SN-${Date.now()}`,
      location: data.location || 'Local Réseau',
      snmpEnabled: data.snmpEnabled ?? true,
      snmpVersion: data.snmpVersion || 'v2c',
      snmpCommunity: data.snmpCommunity || 'public',
      isBlocked: false,
      firstSeen: new Date().toISOString().replace('T', ' ').substring(0, 19),
      lastSeen: new Date().toISOString().replace('T', ' ').substring(0, 19),
      metrics: {
        latencyMs: 1.5,
        minLatencyMs: 1.0,
        maxLatencyMs: 2.5,
        packetLossPct: 0,
        cpuPct: 20,
        cpuTempC: 40,
        ramUsedMb: 1024,
        ramTotalMb: 2048,
        ramPct: 50,
        uptimeSeconds: 3600,
        availabilityPct: 100,
        historyLatency: [1.5, 1.5, 1.5, 1.5, 1.5],
        historyCpu: [20, 20, 20, 20, 20],
        historyRam: [50, 50, 50, 50, 50]
      },
      interfaces: data.interfaces || [
        {
          id: `if-${Date.now()}-1`,
          name: 'eth0',
          adminStatus: 'UP',
          operStatus: 'UP',
          speed: '1 Gbps',
          duplex: 'Full',
          trafficInMbps: 12.5,
          trafficOutMbps: 8.4,
          trafficUsagePct: 1.2,
          errorsIn: 0,
          errorsOut: 0,
          packetLoss: 0,
          collisions: 0,
          vlan: data.vlanId || 10
        }
      ],
      notes: data.notes || 'Équipement enregistré en production.'
    };

    saveDevice(newDevice);
    addAuditEntry('DEVICE_REGISTERED', `${newDevice.hostname} (${newDevice.ip})`, `Enregistrement officiel de l'équipement dans la base KingNMS`, 'Ing. Romaric (SuperAdmin)', 'info');

    return NextResponse.json({
      success: true,
      device: newDevice
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
