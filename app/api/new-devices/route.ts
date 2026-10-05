import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, addAuditEntry, saveDevice } from '../../../lib/serverDb';
import { Device, DeviceType } from '../../../types';

export async function GET() {
  const db = getDatabase();
  return NextResponse.json({
    total: db.newDevices.length,
    newDevices: db.newDevices
  });
}

export async function POST(req: NextRequest) {
  try {
    const { action, id, customData, reason } = await req.json();
    const db = getDatabase();

    const targetIndex = db.newDevices.findIndex(nd => nd.id === id);
    if (targetIndex === -1) {
      return NextResponse.json({ error: 'Device not found in triage queue' }, { status: 404 });
    }

    const target = db.newDevices[targetIndex];

    if (action === 'authorize') {
      // Create official device
      const addedDev: Device = {
        id: `dev-${Date.now()}`,
        ip: customData?.ip || target.ip,
        hostname: customData?.hostname || target.hostname || `DEV-${target.ip.split('.').pop()}`,
        mac: target.mac,
        vendor: target.vendor,
        type: (customData?.type || target.suggestedType || 'pc') as DeviceType,
        status: 'UP',
        siteId: target.siteId || 'cotonou',
        vlanId: customData?.vlanId || 20,
        model: customData?.model || `${target.vendor} Network Node`,
        os: customData?.os || 'Système Détecté',
        serialNumber: `SN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        location: customData?.location || 'Réseau Local Actif',
        snmpEnabled: false,
        snmpVersion: 'v2c',
        snmpCommunity: 'public',
        isBlocked: false,
        firstSeen: target.firstSeen,
        lastSeen: new Date().toISOString().replace('T', ' ').substring(0, 19),
        metrics: {
          latencyMs: 1.8,
          minLatencyMs: 1.2,
          maxLatencyMs: 2.8,
          packetLossPct: 0,
          cpuPct: 15,
          cpuTempC: 38,
          ramUsedMb: 1024,
          ramTotalMb: 2048,
          ramPct: 50,
          uptimeSeconds: 3600,
          availabilityPct: 100,
          historyLatency: [1.8, 1.8, 1.8, 1.8, 1.8],
          historyCpu: [15, 15, 15, 15, 15],
          historyRam: [50, 50, 50, 50, 50]
        },
        interfaces: [
          {
            id: `if-${Date.now()}-1`,
            name: 'eth0',
            adminStatus: 'UP',
            operStatus: 'UP',
            speed: '1 Gbps',
            duplex: 'Full',
            trafficInMbps: 2.4,
            trafficOutMbps: 4.8,
            trafficUsagePct: 0.5,
            errorsIn: 0,
            errorsOut: 0,
            packetLoss: 0,
            collisions: 0,
            vlan: customData?.vlanId || 20
          }
        ]
      };

      saveDevice(addedDev);
      db.newDevices.splice(targetIndex, 1);
      saveDatabase(db);

      addAuditEntry('NEW_DEVICE_AUTHORIZED', `${addedDev.hostname} (${addedDev.ip})`, `Équipement autorisé et intégré dans l'inventaire officiel.`);
      return NextResponse.json({ success: true, device: addedDev });
    }

    if (action === 'block') {
      db.newDevices.splice(targetIndex, 1);
      saveDatabase(db);
      addAuditEntry('NEW_DEVICE_BLOCKED', `${target.ip} [${target.mac}]`, `Blocage de sécurité: ${reason || 'Appareil suspect non homologué'}. Inscription dans la liste noire MAC.`, 'Ing. Romaric (SuperAdmin)', 'danger');
      return NextResponse.json({ success: true, message: 'Device blocked' });
    }

    if (action === 'ignore') {
      db.newDevices.splice(targetIndex, 1);
      saveDatabase(db);
      return NextResponse.json({ success: true, message: 'Device ignored' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
