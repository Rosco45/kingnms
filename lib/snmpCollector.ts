import snmp from 'net-snmp';

export interface SnmpQueryResult {
  success: boolean;
  ip: string;
  sysDescr?: string;
  sysName?: string;
  sysUpTime?: number;
  cpuPct?: number;
  ramPct?: number;
  interfaces?: {
    index: number;
    name: string;
    adminStatus: 'UP' | 'DOWN';
    operStatus: 'UP' | 'DOWN';
    speed: string;
    inOctets?: number;
    outOctets?: number;
  }[];
  error?: string;
}

// Query real SNMP MIB-II attributes
export async function queryRealSnmp(
  ip: string,
  community = 'public',
  version: 'v1' | 'v2c' = 'v2c',
  port = 161,
  timeout = 2500
): Promise<SnmpQueryResult> {
  return new Promise((resolve) => {
    const snmpVersion = version === 'v1' ? snmp.Version1 : snmp.Version2c;
    const session = snmp.createSession(ip, community, {
      port,
      version: snmpVersion,
      timeout,
      retries: 1
    });

    const oids = [
      '1.3.6.1.2.1.1.1.0', // sysDescr
      '1.3.6.1.2.1.1.3.0', // sysUpTime
      '1.3.6.1.2.1.1.5.0'  // sysName
    ];

    session.get(oids, (error, varbinds) => {
      if (error || !varbinds) {
        session.close();
        resolve({
          success: false,
          ip,
          error: error ? error.message : 'Aucune donnée SNMP retournée (varbinds vide)'
        });
        return;
      }

      let sysDescr = 'Équipement Réseau SNMP';
      let sysUpTime = 0;
      let sysName = ip;

      for (let i = 0; i < varbinds.length; i++) {
        if (snmp.isVarbindError(varbinds[i])) {
          continue;
        }
        if (i === 0 && varbinds[0]?.value) sysDescr = varbinds[0].value.toString();
        if (i === 1 && varbinds[1]?.value) sysUpTime = Math.floor(Number(varbinds[1].value) / 100);
        if (i === 2 && varbinds[2]?.value) sysName = varbinds[2].value.toString();
      }

      session.close();
      resolve({
        success: true,
        ip,
        sysDescr,
        sysUpTime,
        sysName
      });
    });
  });
}

// Perform real administrative port shutdown / no shutdown via SNMP SET
export async function setPortAdminStatusSnmp(
  ip: string,
  community: string,
  ifIndex: number,
  status: 'UP' | 'DOWN',
  version: 'v1' | 'v2c' = 'v2c'
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const snmpVersion = version === 'v1' ? snmp.Version1 : snmp.Version2c;
    const session = snmp.createSession(ip, community, {
      version: snmpVersion,
      timeout: 3000,
      retries: 1
    });

    // 1.3.6.1.2.1.2.2.1.7.<ifIndex> : ifAdminStatus (1 = UP, 2 = DOWN)
    const oid = `1.3.6.1.2.1.2.2.1.7.${ifIndex}`;
    const value = status === 'UP' ? 1 : 2;

    const varbind = {
      oid,
      type: snmp.ObjectType.Integer,
      value
    };

    session.set([varbind], (error, varbinds) => {
      session.close();
      if (error) {
        resolve({
          success: false,
          message: `Échec SNMP SET sur ${ip} (${error.message})`
        });
      } else {
        resolve({
          success: true,
          message: `Port ${ifIndex} réglé avec succès vers ${status} (ifAdminStatus=${value}) via SNMP`
        });
      }
    });
  });
}
