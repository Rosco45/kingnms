import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, addAuditEntry } from '../../../../../lib/serverDb';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const db = getDatabase();
    const index = db.devices.findIndex(d => d.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const dev = db.devices[index];
    dev.isBlocked = false;
    dev.status = 'UP';
    dev.blockReason = undefined;
    dev.blockedAt = undefined;
    dev.interfaces = dev.interfaces.map(iface => ({
      ...iface,
      adminStatus: 'UP',
      operStatus: 'UP'
    }));

    saveDatabase(db);
    addAuditEntry('DEVICE_UNBLOCKED', `${dev.hostname} (${dev.ip})`, `Levée de la quarantaine et rétablissement des ports réseau.`);

    return NextResponse.json({ success: true, device: dev });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
