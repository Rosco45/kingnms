import { exec } from 'child_process';
import { promisify } from 'util';
import { getDatabase, saveDatabase, addAuditEntry } from './serverDb';
import { getKernelArpTable, lookupVendor, getLocalNetworkInterfaces } from './realScanner';
import { Alert, Device, DeviceType, NewDevice } from '../types';

const execAsync = promisify(exec);

let isMonitoringActive = true;
let isCycleRunning = false;

export async function pingHost(ip: string): Promise<{ isUp: boolean; latencyMs: number; packetLoss: number }> {
  try {
    const { stdout } = await execAsync(`ping -c 1 -W 1 ${ip}`);
    const isUp = !stdout.includes('100% packet loss') && stdout.includes('bytes from');
    if (!isUp) return { isUp: false, latencyMs: 0, packetLoss: 100 };

    const rttMatch = stdout.match(/(?:time|temps)=([0-9.]+)\s*ms/i);
    const latency = rttMatch ? parseFloat(rttMatch[1]) : 1.5;
    return { isUp: true, latencyMs: latency, packetLoss: 0 };
  } catch {
    return { isUp: false, latencyMs: 0, packetLoss: 100 };
  }
}

// Single monitoring pass over all registered devices
export async function runMonitoringCycle(): Promise<{ checked: number; down: number; alertsCreated: number }> {
  if (isCycleRunning) return { checked: 0, down: 0, alertsCreated: 0 };
  isCycleRunning = true;

  try {
    const db = getDatabase();
    let downCount = 0;
    let alertsCreated = 0;
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Check each device with parallel ICMP Pings
    await Promise.all(
      db.devices.map(async (dev) => {
        const { isUp, latencyMs, packetLoss } = await pingHost(dev.ip);

        if (!isUp) {
          downCount++;
          if (dev.status === 'UP' && !dev.isBlocked) {
            dev.status = 'DOWN';
            const newAlert: Alert = {
              id: `alt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              deviceId: dev.id,
              deviceName: dev.hostname,
              deviceIp: dev.ip,
              severity: 'critical',
              type: 'unreachable',
              title: `Équipement injoignable (ICMP Ping Down)`,
              message: `L'hôte ${dev.hostname} (${dev.ip}) ne répond plus aux requêtes ICMP. Packet loss 100%.`,
              status: 'active',
              timestamp: nowTime
            };
            db.alerts.unshift(newAlert);
            alertsCreated++;
            addAuditEntry('HOST_DOWN_DETECTED', `${dev.hostname} (${dev.ip})`, 'Sonde ICMP en échec - Hôte déclaré DOWN', 'Système KingNMS Probe', 'danger');
          }
        } else {
          if (dev.status === 'DOWN' && !dev.isBlocked) {
            dev.status = 'UP';
            const recoveryAlert: Alert = {
              id: `alt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              deviceId: dev.id,
              deviceName: dev.hostname,
              deviceIp: dev.ip,
              severity: 'info',
              type: 'recovered',
              title: `Équipement revenu en ligne (ICMP Rétabli)`,
              message: `L'hôte ${dev.hostname} (${dev.ip}) est de nouveau opérationnel. Latence: ${latencyMs}ms.`,
              status: 'resolved',
              timestamp: nowTime,
              resolvedAt: nowTime
            };
            db.alerts.unshift(recoveryAlert);
            alertsCreated++;
            addAuditEntry('HOST_RECOVERED', `${dev.hostname} (${dev.ip})`, `Rétablissement du lien réseau (${latencyMs}ms)`, 'Système KingNMS Probe', 'info');
          }
        }

        // Update metrics
        dev.lastSeen = nowTime;
        dev.metrics.latencyMs = isUp ? latencyMs : 0;
        dev.metrics.packetLossPct = packetLoss;
        dev.metrics.historyLatency = [
          ...(dev.metrics.historyLatency || []).slice(1),
          isUp ? latencyMs : 0
        ];
        if (isUp) {
          dev.metrics.uptimeSeconds += 10;
        }
      })
    );

    // 2. Discover new ARP hosts on LAN
    try {
      const arpTable = await getKernelArpTable();
      const existingIps = new Set(db.devices.map(d => d.ip));
      const newDevIps = new Set(db.newDevices.map(nd => nd.ip));

      arpTable.forEach((arpMac, arpIp) => {
        if (!existingIps.has(arpIp) && !newDevIps.has(arpIp) && arpMac !== '00:00:00:00:00:00') {
          const vendor = lookupVendor(arpMac);
          const newRogue: NewDevice = {
            id: `nd-${Date.now()}-${Math.floor(Math.random() * 100)}`,
            ip: arpIp,
            mac: arpMac,
            vendor,
            hostname: `nouvel-hote-${arpIp.split('.').pop()}`,
            firstSeen: nowTime,
            lastSeen: 'À l’instant',
            status: 'pending',
            suggestedType: vendor.toLowerCase().includes('infinix') || vendor.toLowerCase().includes('apple') ? 'phone' : 'pc',
            siteId: 'cotonou'
          };
          db.newDevices.unshift(newRogue);

          const alertNew: Alert = {
            id: `alt-${Date.now()}-${Math.floor(Math.random() * 100)}`,
            deviceName: `Nouveau Périphérique (${vendor})`,
            deviceIp: arpIp,
            severity: 'notice',
            type: 'new_device',
            title: `Nouveau équipement détecté sur le LAN`,
            message: `Découverte de l'adresse IP ${arpIp} [MAC: ${arpMac} - ${vendor}] sur le réseau local. En attente de validation.`,
            status: 'active',
            timestamp: nowTime
          };
          db.alerts.unshift(alertNew);
          alertsCreated++;
        }
      });
    } catch {}

    saveDatabase(db);
    return {
      checked: db.devices.length,
      down: downCount,
      alertsCreated
    };
  } finally {
    isCycleRunning = false;
  }
}

// Background scheduler
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    if (isMonitoringActive) {
      runMonitoringCycle().catch(() => {});
    }
  }, 12000);
}
