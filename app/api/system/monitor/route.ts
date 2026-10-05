import { NextResponse } from 'next/server';
import { runMonitoringCycle } from '../../../../lib/monitorEngine';
import { getDatabase } from '../../../../lib/serverDb';

export async function POST() {
  try {
    const cycleResult = await runMonitoringCycle();
    const db = getDatabase();

    return NextResponse.json({
      success: true,
      cycle: cycleResult,
      totalDevices: db.devices.length,
      onlineCount: db.devices.filter(d => d.status === 'UP').length,
      downCount: db.devices.filter(d => d.status === 'DOWN').length,
      alertsCount: db.alerts.filter(a => a.status === 'active').length,
      lastUpdated: db.lastUpdated
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
