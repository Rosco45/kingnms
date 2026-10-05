import os from 'os';
import dns from 'dns';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DeviceType } from '../types';

const execAsync = promisify(exec);

// Rich embedded IEEE OUI Database for instant offline MAC resolution
const OUI_DATABASE: Record<string, string> = {
  // Network Infrastructure
  '00:1E:13': 'Cisco Systems',
  '00:1E:49': 'Cisco Systems',
  '00:24:D7': 'HP Aruba Networks',
  '70:3A:0E': 'HP Aruba Networks',
  'B4:FB:E4': 'Ubiquiti Networks',
  '74:83:C2': 'Ubiquiti Networks',
  '24:A4:3C': 'Ubiquiti Networks',
  '48:8F:5A': 'MikroTik',
  '64:D1:54': 'MikroTik',
  '70:4C:A5': 'Fortinet Inc.',
  '00:09:0F': 'Fortinet Inc.',
  '00:11:32': 'Synology Inc.',
  '00:08:9B': 'QNAP Systems',
  '00:0C:29': 'VMware ESXi Virtual',
  '00:50:56': 'VMware Workstation',
  '52:54:00': 'QEMU / KVM Virtual',
  '08:00:27': 'Oracle VirtualBox',

  // Gateways & Telecom Routers (Orange, MTN, Moov, GPON ONTs)
  '60:A6:C5': 'Huawei Technologies',
  '00:E0:FC': 'Huawei Technologies',
  '48:46:FB': 'Huawei Technologies',
  '20:08:89': 'Huawei Technologies',
  'CC:96:E5': 'ZTE Corporation',
  '00:1E:73': 'ZTE Corporation',
  'A8:57:4E': 'Fiberhome Telecommunication',
  '50:C7:BF': 'TP-Link Corporation',
  'D8:07:B6': 'TP-Link Corporation',
  '14:CC:20': 'TP-Link Corporation',
  '00:18:E7': 'D-Link Corporation',
  '28:80:23': 'Netgear Inc.',

  // Personal Computers & Laptops
  '84:3A:4B': 'Intel Corporate (Dell Laptop)',
  '00:1A:A0': 'Dell Technologies',
  '18:66:DA': 'Dell Technologies',
  'F8:F2:1E': 'Dell Technologies',
  '74:86:7A': 'Dell / Intel Gigabit NIC',
  '00:23:24': 'Giga-Byte Technology',
  '54:E1:AD': 'Lenovo PC',
  '00:21:CC': 'Lenovo ThinkPad',
  '00:03:7F': 'Atheros Communications',
  '00:E0:4C': 'Realtek Semiconductor',

  // Mobile Devices & Smartphones (Very common in African & Global networks)
  '80:79:5D': 'Infinix Mobility Limited',
  '04:72:95': 'Infinix / Tecno Mobile (Transsion)',
  '88:14:41': 'Infinix Mobility Limited',
  'A4:6C:F1': 'Tecno Mobile Limited',
  '08:E0:F8': 'Transsion Holdings',
  '5C:E9:1E': 'Samsung Electronics',
  '3C:CD:36': 'Samsung Electronics',
  '90:F1:AA': 'Samsung Electronics',
  'A4:C3:F0': 'Apple Inc. (iPhone/iPad/Mac)',
  'F0:18:98': 'Apple Inc. (MacBook/iPhone)',
  '34:08:BC': 'Apple Inc.',
  '68:DB:CA': 'Xiaomi Communications',
  '78:02:F8': 'Xiaomi Communications',
  '50:8A:06': 'OPPO Mobile',
  'E8:9E:0C': 'Vivo Mobile',

  // IoT, Surveillance & Printers
  'DC:A6:32': 'Raspberry Pi Foundation',
  'B8:27:EB': 'Raspberry Pi Foundation',
  '24:6F:28': 'Espressif Inc. (ESP32/ESP8266)',
  'A4:CF:12': 'Espressif Inc.',
  '38:AF:29': 'Dahua Technology (Caméra IP)',
  'E0:50:8B': 'Hikvision Digital Technology',
  '00:1E:0B': 'HP Inc. (Imprimante)',
  '00:80:77': 'Brother Industries (Imprimante)',
  '00:04:F2': 'Polycom (Téléphone IP)',
  '00:08:5D': 'Aastra / Mitel (ToIP)'
};

export function lookupVendor(mac: string): string {
  if (!mac) return 'Inconnu';
  const clean = mac.replace(/[:-]/g, '').toUpperCase();
  if (clean.length < 6) return 'Inconnu';
  const prefix = `${clean.slice(0, 2)}:${clean.slice(2, 4)}:${clean.slice(4, 6)}`;
  return OUI_DATABASE[prefix] || 'Périphérique Réseau Standard';
}

export interface NetworkInterfaceInfo {
  name: string;
  ip: string;
  netmask: string;
  mac: string;
  cidr: string;
  isDefault: boolean;
  gateway?: string;
}

// Auto-detect the host's actual network interfaces and default route
export async function getLocalNetworkInterfaces(): Promise<{
  interfaces: NetworkInterfaceInfo[];
  defaultSubnet: string;
  defaultGateway: string;
  hostIp: string;
}> {
  const ifaces = os.networkInterfaces();
  const list: NetworkInterfaceInfo[] = [];
  let defaultGateway = '192.168.100.1';
  let hostIp = '127.0.0.1';
  let defaultSubnet = '192.168.100.0/24';

  try {
    const { stdout: routeOut } = await execAsync('ip route show');
    const defaultMatch = routeOut.match(/default via ([0-9.]+)\s+dev\s+([a-zA-Z0-9]+)/);
    if (defaultMatch) {
      defaultGateway = defaultMatch[1];
    }
  } catch {}

  for (const [name, addrs] of Object.entries(ifaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        const parts = addr.address.split('.');
        const subnetBase = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
        const isDef = addr.address.startsWith(defaultGateway.split('.').slice(0, 3).join('.'));
        if (isDef) {
          hostIp = addr.address;
          defaultSubnet = subnetBase;
        }

        list.push({
          name,
          ip: addr.address,
          netmask: addr.netmask,
          mac: addr.mac,
          cidr: subnetBase,
          isDefault: isDef,
          gateway: isDef ? defaultGateway : undefined
        });
      }
    }
  }

  return {
    interfaces: list,
    defaultSubnet,
    defaultGateway,
    hostIp
  };
}

export interface ScannedDevice {
  ip: string;
  mac: string;
  vendor: string;
  hostname: string;
  type: DeviceType;
  model: string;
  os: string;
  latencyMs: number;
  snmpResponding: boolean;
  isGateway: boolean;
  isLocalHost: boolean;
}

// Read Linux kernel ARP cache (/proc/net/arp and ip neigh)
export async function getKernelArpTable(): Promise<Map<string, string>> {
  const arpMap = new Map<string, string>();

  try {
    const { stdout } = await execAsync('ip neigh show');
    const lines = stdout.split('\n');
    for (const line of lines) {
      const match = line.match(/^([0-9.]+)\s+dev\s+\S+\s+lladdr\s+([0-9a-fA-F:]+)/);
      if (match) {
        arpMap.set(match[1], match[2].toUpperCase());
      }
    }
  } catch {}

  return arpMap;
}

// Real fast parallel subnet sweep
export async function performRealSubnetScan(
  subnetCidr: string,
  snmpCommunity = 'public',
  onProgress?: (scanned: number, total: number, found: ScannedDevice) => void
): Promise<ScannedDevice[]> {
  const baseMatch = subnetCidr.match(/^([0-9]+\.[0-9]+\.[0-9]+)\.0(?:\/24)?$/);
  const base = baseMatch ? baseMatch[1] : '192.168.100';

  const { defaultGateway, hostIp } = await getLocalNetworkInterfaces();
  const arpTable = await getKernelArpTable();
  const results: ScannedDevice[] = [];

  // Generate target IPs (e.g. 1 to 254)
  const ipsToScan: string[] = [];
  for (let i = 1; i <= 254; i++) {
    ipsToScan.push(`${base}.${i}`);
  }

  // Ping batch runner
  const BATCH_SIZE = 25;
  for (let i = 0; i < ipsToScan.length; i += BATCH_SIZE) {
    const chunk = ipsToScan.slice(i, i + BATCH_SIZE);
    await Promise.all(
      chunk.map(async (ip) => {
        try {
          const { stdout } = await execAsync(`ping -c 1 -W 1 ${ip}`);
          const isAlive = !stdout.includes('100% packet loss') && stdout.includes('bytes from');

          if (isAlive) {
            const rttMatch = stdout.match(/(?:time|temps)=([0-9.]+)\s*ms/i);
            const latency = rttMatch ? parseFloat(rttMatch[1]) : 1.5;

            // Fetch MAC from ARP
            const arpMapUpdated = await getKernelArpTable();
            let mac = arpMapUpdated.get(ip) || arpTable.get(ip) || '';
            if (!mac && ip === hostIp) {
              const ifaces = os.networkInterfaces();
              for (const addrs of Object.values(ifaces)) {
                const found = addrs?.find(a => a.address === hostIp);
                if (found) mac = found.mac.toUpperCase();
              }
            }

            const vendor = lookupVendor(mac);

            // Reverse DNS resolution
            let resolvedHostname = `host-${ip.split('.').pop()}`;
            try {
              const hostnames = await dns.promises.reverse(ip);
              if (hostnames.length > 0) resolvedHostname = hostnames[0];
            } catch {
              if (ip === hostIp) resolvedHostname = `${os.hostname()} (Ce PC)`;
              else if (ip === defaultGateway) resolvedHostname = `Passerelle-Routeur (${ip})`;
            }

            // Automatic heuristic classification
            let detectedType: DeviceType = 'pc';
            if (ip === defaultGateway || vendor.toLowerCase().includes('huawei') || vendor.toLowerCase().includes('cisco')) {
              detectedType = 'router';
            } else if (
              vendor.toLowerCase().includes('infinix') ||
              vendor.toLowerCase().includes('tecno') ||
              vendor.toLowerCase().includes('transsion') ||
              vendor.toLowerCase().includes('samsung') ||
              vendor.toLowerCase().includes('apple') ||
              vendor.toLowerCase().includes('xiaomi')
            ) {
              detectedType = 'phone';
            } else if (vendor.toLowerCase().includes('dahua') || vendor.toLowerCase().includes('hikvision')) {
              detectedType = 'camera';
            } else if (vendor.toLowerCase().includes('ubiquiti')) {
              detectedType = 'ap';
            } else if (vendor.toLowerCase().includes('brother') || vendor.toLowerCase().includes('epson')) {
              detectedType = 'printer';
            } else if (vendor.toLowerCase().includes('espressif') || vendor.toLowerCase().includes('raspberry')) {
              detectedType = 'iot';
            } else if (ip === hostIp) {
              detectedType = 'pc';
            }

            const scanned: ScannedDevice = {
              ip,
              mac: mac || '00:00:00:00:00:00',
              vendor,
              hostname: resolvedHostname,
              type: detectedType,
              model: `${vendor} ${detectedType.toUpperCase()}`,
              os: ip === hostIp ? `${os.type()} ${os.release()}` : 'Système Réseau Détecté',
              latencyMs: latency,
              snmpResponding: false,
              isGateway: ip === defaultGateway,
              isLocalHost: ip === hostIp
            };

            results.push(scanned);
            if (onProgress) onProgress(results.length, ipsToScan.length, scanned);
          }
        } catch {
          // IP is down
        }
      })
    );
  }

  return results;
}
