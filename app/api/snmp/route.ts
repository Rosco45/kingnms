import { NextRequest, NextResponse } from 'next/server';
import { queryRealSnmp, setPortAdminStatusSnmp } from '../../../lib/snmpCollector';
import { addAuditEntry } from '../../../lib/serverDb';

export async function POST(req: NextRequest) {
  try {
    const { action = 'query', ip, community = 'public', version = 'v2c', ifIndex, portStatus } = await req.json();

    if (!ip) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    if (action === 'set_port' && ifIndex !== undefined && portStatus) {
      const res = await setPortAdminStatusSnmp(ip, community, ifIndex, portStatus, version);
      addAuditEntry('SNMP_PORT_SET', `${ip} -> Port ${ifIndex}`, `Changement d'état vers ${portStatus} via SNMP SET`);
      return NextResponse.json(res);
    }

    // Default: query MIB-II
    const queryRes = await queryRealSnmp(ip, community, version);
    return NextResponse.json(queryRes);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
