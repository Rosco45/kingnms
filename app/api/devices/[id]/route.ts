import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, saveDatabase, deleteDeviceById, addAuditEntry } from '../../../../lib/serverDb';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const db = getDatabase();
  const device = db.devices.find(d => d.id === id);

  if (!device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  return NextResponse.json({ device });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await req.json();

    const db = getDatabase();
    const index = db.devices.findIndex(d => d.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    db.devices[index] = { ...db.devices[index], ...updates };
    saveDatabase(db);
    addAuditEntry('DEVICE_UPDATED', db.devices[index].hostname, 'Mise à jour des paramètres de supervision');

    return NextResponse.json({ success: true, device: db.devices[index] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const db = getDatabase();
  const target = db.devices.find(d => d.id === id);

  const deleted = deleteDeviceById(id);
  if (deleted) {
    addAuditEntry('DEVICE_DELETED', target?.hostname || id, 'Suppression définitive du référentiel réseau', 'Ing. Romaric (SuperAdmin)', 'warning');
    return NextResponse.json({ success: true, message: 'Device deleted' });
  }

  return NextResponse.json({ error: 'Device not found' }, { status: 404 });
}
