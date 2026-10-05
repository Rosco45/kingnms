import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  Device,
  Alert,
  NewDevice,
  VLAN,
  Site,
  Probe,
  AuditLog,
  AlertRule
} from '../types';
import {
  INITIAL_DEVICES,
  INITIAL_ALERTS,
  INITIAL_NEW_DEVICES,
  INITIAL_VLANS,
  INITIAL_SITES,
  INITIAL_PROBES,
  INITIAL_AUDIT_LOGS,
  INITIAL_RULES
} from './mockData';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

export interface KingDatabase {
  devices: Device[];
  alerts: Alert[];
  newDevices: NewDevice[];
  vlans: VLAN[];
  sites: Site[];
  probes: Probe[];
  auditLogs: AuditLog[];
  rules: AlertRule[];
  lastUpdated: string;
}

// Ensure database file exists with initial live seed
export function getDatabase(): KingDatabase {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialDb: KingDatabase = {
        devices: INITIAL_DEVICES,
        alerts: INITIAL_ALERTS,
        newDevices: INITIAL_NEW_DEVICES,
        vlans: INITIAL_VLANS,
        sites: INITIAL_SITES,
        probes: INITIAL_PROBES,
        auditLogs: INITIAL_AUDIT_LOGS,
        rules: INITIAL_RULES,
        lastUpdated: new Date().toISOString()
      };

      // Add real host machine to devices list if not present
      const hostIp = '192.168.100.74';
      const gatewayIp = '192.168.100.1';

      const realHostDevice: Device = {
        id: 'dev-localhost-pc',
        ip: hostIp,
        hostname: `${os.hostname()} (Hôte KingNMS)`,
        mac: '84:3A:4B:9D:07:A8',
        vendor: 'Dell Technologies / Intel',
        type: 'pc',
        status: 'UP',
        siteId: 'cotonou',
        vlanId: 10,
        model: 'Dell Latitude E6230 Enterprise',
        os: `${os.type()} Linux Kernel ${os.release()}`,
        serialNumber: 'LATITUDE-E6230-PRO',
        location: 'Console Centrale d’Exploitation NOC',
        snmpEnabled: false,
        snmpVersion: 'v2c',
        snmpCommunity: 'public',
        isBlocked: false,
        firstSeen: new Date().toISOString().replace('T', ' ').substring(0, 19),
        lastSeen: new Date().toISOString().replace('T', ' ').substring(0, 19),
        metrics: {
          latencyMs: 0.1,
          minLatencyMs: 0.1,
          maxLatencyMs: 0.2,
          packetLossPct: 0,
          cpuPct: 18,
          cpuTempC: 45,
          ramUsedMb: 6144,
          ramTotalMb: 16384,
          ramPct: 37.5,
          uptimeSeconds: Math.floor(os.uptime()),
          availabilityPct: 100,
          historyLatency: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
          historyCpu: [15, 18, 20, 18, 17, 19, 18, 18, 18, 18],
          historyRam: [37, 37, 37, 37, 37, 37, 37, 37, 37, 37]
        },
        interfaces: [
          {
            id: 'if-host-wlan0',
            name: 'wlp2s0 (Wi-Fi 802.11ac Intel)',
            adminStatus: 'UP',
            operStatus: 'UP',
            speed: '1 Gbps',
            duplex: 'Full',
            trafficInMbps: 24.5,
            trafficOutMbps: 18.2,
            trafficUsagePct: 2.5,
            errorsIn: 0,
            errorsOut: 0,
            packetLoss: 0,
            collisions: 0,
            connectedDevice: 'Routeur Passerelle (192.168.100.1)',
            connectedMac: '60:A6:C5:5E:E5:76',
            vlan: 10
          }
        ],
        notes: 'Machine serveur maître exécutant KingNMS en production locale.'
      };

      const realGatewayDevice: Device = {
        id: 'dev-gateway-router',
        ip: gatewayIp,
        hostname: 'ROUTEUR-PASSERELLE-FIBRE',
        mac: '60:A6:C5:5E:E5:76',
        vendor: 'Huawei Technologies',
        type: 'router',
        status: 'UP',
        siteId: 'cotonou',
        vlanId: 10,
        model: 'Huawei EchoLife HG8245 GPON ONT',
        os: 'Huawei VRP Embedded',
        serialNumber: 'HWTC-60A6C55EE576',
        location: 'Arrivée Fibre Optique WAN',
        snmpEnabled: true,
        snmpVersion: 'v2c',
        snmpCommunity: 'public',
        isBlocked: false,
        firstSeen: new Date().toISOString().replace('T', ' ').substring(0, 19),
        lastSeen: new Date().toISOString().replace('T', ' ').substring(0, 19),
        metrics: {
          latencyMs: 1.4,
          minLatencyMs: 1.2,
          maxLatencyMs: 2.5,
          packetLossPct: 0,
          cpuPct: 24,
          cpuTempC: 42,
          ramUsedMb: 512,
          ramTotalMb: 1024,
          ramPct: 50,
          uptimeSeconds: 864000,
          availabilityPct: 99.98,
          historyLatency: [1.4, 1.5, 1.4, 1.4, 1.3, 1.4, 1.4, 1.4, 1.4, 1.4],
          historyCpu: [22, 24, 25, 24, 23, 25, 24, 24, 24, 24],
          historyRam: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
        },
        interfaces: [
          {
            id: 'if-gw-pon',
            name: 'PON / WAN (Liaison Fibre Optique)',
            adminStatus: 'UP',
            operStatus: 'UP',
            speed: '1 Gbps',
            duplex: 'Full',
            trafficInMbps: 180.5,
            trafficOutMbps: 95.2,
            trafficUsagePct: 18.0,
            errorsIn: 0,
            errorsOut: 0,
            packetLoss: 0,
            collisions: 0,
            connectedDevice: 'OLT Central Telecom',
            vlan: 10
          },
          {
            id: 'if-gw-wlan',
            name: 'WLAN 2.4/5GHz (Wi-Fi Local)',
            adminStatus: 'UP',
            operStatus: 'UP',
            speed: '1 Gbps',
            duplex: 'Full',
            trafficInMbps: 45.2,
            trafficOutMbps: 62.0,
            trafficUsagePct: 6.2,
            errorsIn: 0,
            errorsOut: 0,
            packetLoss: 0,
            collisions: 0,
            connectedDevice: 'Clients Wi-Fi Réseau Local',
            vlan: 20
          }
        ],
        notes: 'Passerelle Internet par défaut du réseau local.'
      };

      initialDb.devices = [realGatewayDevice, realHostDevice, ...initialDb.devices];

      saveDatabase(initialDb);
      return initialDb;
    }

    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data) as KingDatabase;
  } catch (err) {
    console.error('Error reading KingNMS database:', err);
    return {
      devices: INITIAL_DEVICES,
      alerts: INITIAL_ALERTS,
      newDevices: INITIAL_NEW_DEVICES,
      vlans: INITIAL_VLANS,
      sites: INITIAL_SITES,
      probes: INITIAL_PROBES,
      auditLogs: INITIAL_AUDIT_LOGS,
      rules: INITIAL_RULES,
      lastUpdated: new Date().toISOString()
    };
  }
}

export function saveDatabase(db: KingDatabase): void {
  try {
    db.lastUpdated = new Date().toISOString();
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing KingNMS database:', err);
  }
}

// Helpers for CRUD
export function getDevices(): Device[] {
  return getDatabase().devices;
}

export function saveDevice(device: Device): Device {
  const db = getDatabase();
  const index = db.devices.findIndex(d => d.id === device.id);
  if (index >= 0) {
    db.devices[index] = device;
  } else {
    db.devices.unshift(device);
  }
  saveDatabase(db);
  return device;
}

export function deleteDeviceById(id: string): boolean {
  const db = getDatabase();
  const initialLen = db.devices.length;
  db.devices = db.devices.filter(d => d.id !== id);
  if (db.devices.length !== initialLen) {
    saveDatabase(db);
    return true;
  }
  return false;
}

export function addAuditEntry(action: string, target: string, details: string, user = 'Ing. Romaric (SuperAdmin)', severity: 'info' | 'warning' | 'danger' = 'info'): void {
  const db = getDatabase();
  const newLog: AuditLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    user,
    action,
    target,
    details,
    severity
  };
  db.auditLogs.unshift(newLog);
  if (db.auditLogs.length > 200) db.auditLogs = db.auditLogs.slice(0, 200);
  saveDatabase(db);
}
