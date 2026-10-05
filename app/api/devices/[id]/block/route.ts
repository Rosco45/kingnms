import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, addAuditEntry } from '../../../../../lib/serverDb';
import { Alert } from '../../../../../types';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Quarantaine administrative pour sécurité réseau';

    const db = getDatabase();
    const index = db.devices.findIndex(d => d.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const dev = db.devices[index];
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 19);

    dev.isBlocked = true;
    dev.status = 'DOWN';
    dev.blockReason = reason;
    dev.blockedAt = nowTime;
    dev.interfaces = dev.interfaces.map(iface => ({
      ...iface,
      adminStatus: 'DOWN',
      operStatus: 'DOWN',
      trafficInMbps: 0,
      trafficOutMbps: 0
    }));

    // Generate security alert
    const secAlert: Alert = {
      id: `alt-block-${Date.now()}`,
      deviceId: dev.id,
      deviceName: dev.hostname,
      deviceIp: dev.ip,
      severity: 'high',
      type: 'security',
      title: `Équipement placé en quarantaine`,
      message: `L'hôte ${dev.hostname} (${dev.ip}) a été bloqué administrativement. Motif: ${reason}`,
      status: 'active',
      timestamp: nowTime
    };
    db.alerts.unshift(secAlert);

    saveDatabase(db);
    addAuditEntry('DEVICE_BLOCKED', `${dev.hostname} (${dev.ip})`, `Blocage réseau appliqué. Motif: ${reason}. Ports switch désactivés.`, 'Ing. Romaric (SuperAdmin)', 'danger');

    return NextResponse.json({ success: true, device: dev });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
