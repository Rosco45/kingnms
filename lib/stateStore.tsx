'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Device,
  Alert,
  NewDevice,
  VLAN,
  Site,
  Probe,
  AuditLog,
  AlertRule,
  UserProfile,
  NotificationSettings,
  UserRole,
  DeviceType
} from '../types';
import {
  INITIAL_DEVICES,
  INITIAL_ALERTS,
  INITIAL_NEW_DEVICES,
  INITIAL_VLANS,
  INITIAL_SITES,
  INITIAL_PROBES,
  INITIAL_AUDIT_LOGS,
  INITIAL_RULES,
  CURRENT_USER,
  INITIAL_NOTIFICATIONS
} from './mockData';

interface KingNMSContextType {
  devices: Device[];
  alerts: Alert[];
  newDevices: NewDevice[];
  vlans: VLAN[];
  sites: Site[];
  probes: Probe[];
  auditLogs: AuditLog[];
  rules: AlertRule[];
  currentUser: UserProfile;
  notifications: NotificationSettings;
  selectedSite: string;
  selectedVlan: number | null;
  searchQuery: string;
  isScanning: boolean;
  scanProgress: number;
  scanLog: string[];
  isLivePolling: boolean;
  lastPollTime: string;
  // Actions
  setSelectedSite: (site: string) => void;
  setSelectedVlan: (vlan: number | null) => void;
  setSearchQuery: (query: string) => void;
  setIsLivePolling: (active: boolean) => void;
  addDevice: (device: Partial<Device>) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  deleteDevice: (id: string) => void;
  blockDevice: (id: string, reason: string) => void;
  unblockDevice: (id: string) => void;
  toggleInterfacePort: (deviceId: string, interfaceId: string) => void;
  changeInterfaceVlan: (deviceId: string, interfaceId: string, newVlan: number) => void;
  executePing: (ip: string) => Promise<{ success: boolean; latencyMs: number; details: string; packetLoss: number }>;
  startNetworkDiscovery: (subnet: string, snmpCommunity?: string) => Promise<void>;
  authorizeNewDevice: (id: string, customData?: Partial<Device>) => void;
  blockNewDevice: (id: string, reason?: string) => void;
  ignoreNewDevice: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  addAlertRule: (rule: Partial<AlertRule>) => void;
  toggleAlertRule: (id: string) => void;
  deleteAlertRule: (id: string) => void;
  addVlan: (vlan: Partial<VLAN>) => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  setUserRole: (role: UserRole) => void;
  triggerManualRefresh: () => void;
}

const KingNMSContext = createContext<KingNMSContextType | undefined>(undefined);

export function KingNMSProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [newDevices, setNewDevices] = useState<NewDevice[]>(INITIAL_NEW_DEVICES);
  const [vlans, setVlans] = useState<VLAN[]>(INITIAL_VLANS);
  const [sites, setSites] = useState<Site[]>(INITIAL_SITES);
  const [probes, setProbes] = useState<Probe[]>(INITIAL_PROBES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [rules, setRules] = useState<AlertRule[]>(INITIAL_RULES);
  const [currentUser, setCurrentUser] = useState<UserProfile>(CURRENT_USER);
  const [notifications, setNotifications] = useState<NotificationSettings>(INITIAL_NOTIFICATIONS);

  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedVlan, setSelectedVlan] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanLog, setScanLog] = useState<string[]>([]);
  const [isLivePolling, setIsLivePolling] = useState<boolean>(true);
  const [lastPollTime, setLastPollTime] = useState<string>(() => new Date().toLocaleTimeString());

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedDevices = localStorage.getItem('kingnms_devices');
      if (savedDevices) setDevices(JSON.parse(savedDevices));
      const savedAlerts = localStorage.getItem('kingnms_alerts');
      if (savedAlerts) setAlerts(JSON.parse(savedAlerts));
      const savedNewDevs = localStorage.getItem('kingnms_new_devices');
      if (savedNewDevs) setNewDevices(JSON.parse(savedNewDevs));
      const savedVlans = localStorage.getItem('kingnms_vlans');
      if (savedVlans) setVlans(JSON.parse(savedVlans));
      const savedRules = localStorage.getItem('kingnms_rules');
      if (savedRules) setRules(JSON.parse(savedRules));
      const savedLogs = localStorage.getItem('kingnms_audit_logs');
      if (savedLogs) setAuditLogs(JSON.parse(savedLogs));
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save to localStorage when critical items update
  useEffect(() => {
    try {
      localStorage.setItem('kingnms_devices', JSON.stringify(devices));
      localStorage.setItem('kingnms_alerts', JSON.stringify(alerts));
      localStorage.setItem('kingnms_new_devices', JSON.stringify(newDevices));
      localStorage.setItem('kingnms_vlans', JSON.stringify(vlans));
      localStorage.setItem('kingnms_rules', JSON.stringify(rules));
      localStorage.setItem('kingnms_audit_logs', JSON.stringify(auditLogs));
    } catch {
      // Storage quota or error safe
    }
  }, [devices, alerts, newDevices, vlans, rules, auditLogs]);

  // Helper to add audit entry
  const logAudit = useCallback((action: string, target: string, details: string, severity: 'info' | 'warning' | 'danger' = 'info') => {
    const newEntry: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: `${currentUser.name} (${currentUser.role})`,
      action,
      target,
      details,
      severity
    };
    setAuditLogs(prev => [newEntry, ...prev.slice(0, 99)]);
  }, [currentUser]);

  // Periodic Live Background Polling Simulation
  useEffect(() => {
    if (!isLivePolling) return;

    const interval = setInterval(() => {
      setLastPollTime(new Date().toLocaleTimeString());

      setDevices(prevDevices => {
        return prevDevices.map(dev => {
          if (dev.status === 'DOWN') return dev; // keep DOWN devices down

          // Slight realistic fluctuations in traffic, latency, CPU
          const jitter = (Math.random() - 0.48) * 0.4;
          const newLatency = Math.max(0.6, Number((dev.metrics.latencyMs + jitter).toFixed(1)));
          const cpuDelta = Math.floor((Math.random() - 0.48) * 4);
          const newCpu = Math.min(99, Math.max(5, dev.metrics.cpuPct + cpuDelta));

          // Update history arrays
          const newHistoryLatency = [...(dev.metrics.historyLatency || []).slice(1), newLatency];
          const newHistoryCpu = [...(dev.metrics.historyCpu || []).slice(1), newCpu];

          // Fluctuate interface traffic
          const updatedInterfaces = dev.interfaces.map(iface => {
            if (iface.adminStatus === 'DOWN' || iface.operStatus === 'DOWN') return iface;
            const deltaTraffic = (Math.random() - 0.48) * 5;
            const newIn = Math.max(0.1, Number((iface.trafficInMbps + deltaTraffic).toFixed(1)));
            const newOut = Math.max(0.1, Number((iface.trafficOutMbps + deltaTraffic * 0.8).toFixed(1)));
            return {
              ...iface,
              trafficInMbps: newIn,
              trafficOutMbps: newOut
            };
          });

          return {
            ...dev,
            metrics: {
              ...dev.metrics,
              latencyMs: newLatency,
              cpuPct: newCpu,
              uptimeSeconds: dev.metrics.uptimeSeconds + 6,
              historyLatency: newHistoryLatency,
              historyCpu: newHistoryCpu
            },
            interfaces: updatedInterfaces
          };
        });
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [isLivePolling]);

  // Add Device
  const addDevice = useCallback((deviceData: Partial<Device>) => {
    const newDev: Device = {
      id: `dev-${Date.now()}`,
      ip: deviceData.ip || '192.168.1.200',
      hostname: deviceData.hostname || `DEV-${Math.floor(Math.random() * 900 + 100)}`,
      mac: deviceData.mac || `00:50:56:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
      vendor: deviceData.vendor || 'Generic Enterprise',
      type: deviceData.type || 'server',
      status: 'UP',
      siteId: deviceData.siteId || 'cotonou',
      vlanId: deviceData.vlanId || 20,
      model: deviceData.model || 'Standard Network Appliance',
      os: deviceData.os || 'Linux Embedded',
      serialNumber: deviceData.serialNumber || `SN-${Date.now().toString(36).toUpperCase()}`,
      location: deviceData.location || 'Baie Réseau Principal',
      snmpEnabled: deviceData.snmpEnabled ?? true,
      snmpVersion: deviceData.snmpVersion || 'v2c',
      snmpCommunity: deviceData.snmpCommunity || 'public',
      isBlocked: false,
      firstSeen: new Date().toISOString().replace('T', ' ').substring(0, 19),
      lastSeen: new Date().toISOString().replace('T', ' ').substring(0, 19),
      metrics: {
        latencyMs: 1.8,
        minLatencyMs: 1.2,
        maxLatencyMs: 3.5,
        packetLossPct: 0,
        cpuPct: 24,
        cpuTempC: 41,
        ramUsedMb: 2048,
        ramTotalMb: 4096,
        ramPct: 50,
        uptimeSeconds: 86400,
        availabilityPct: 100,
        historyLatency: [1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8],
        historyCpu: [20, 22, 24, 25, 24, 23, 25, 24, 24, 24],
        historyRam: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
      },
      interfaces: [
        {
          id: `if-${Date.now()}-1`,
          name: 'GigabitEthernet0/1',
          adminStatus: 'UP',
          operStatus: 'UP',
          speed: '1 Gbps',
          duplex: 'Full',
          trafficInMbps: 15.4,
          trafficOutMbps: 18.2,
          trafficUsagePct: 1.8,
          errorsIn: 0,
          errorsOut: 0,
          packetLoss: 0,
          collisions: 0,
          vlan: deviceData.vlanId || 20
        }
      ],
      notes: deviceData.notes || 'Équipement ajouté manuellement.'
    };

    setDevices(prev => [newDev, ...prev]);
    logAudit('DEVICE_CREATED', `${newDev.hostname} (${newDev.ip})`, `Ajout manuel d’un équipement de type ${newDev.type}`);
  }, [logAudit]);

  // Update Device
  const updateDevice = useCallback((id: string, updates: Partial<Device>) => {
    setDevices(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
    logAudit('DEVICE_UPDATED', id, `Mise à jour des métadonnées équipement`);
  }, [logAudit]);

  // Delete Device
  const deleteDevice = useCallback((id: string) => {
    const target = devices.find(d => d.id === id);
    setDevices(prev => prev.filter(d => d.id !== id));
    logAudit('DEVICE_DELETED', target?.hostname || id, `Suppression définitive de l’inventaire`);
  }, [devices, logAudit]);

  // Block Device (shutdown port, mark blocked, audit)
  const blockDevice = useCallback((id: string, reason: string) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setDevices(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          isBlocked: true,
          status: 'DOWN',
          blockReason: reason,
          blockedAt: timestamp,
          interfaces: d.interfaces.map(iface => ({
            ...iface,
            adminStatus: 'DOWN',
            operStatus: 'DOWN'
          }))
        };
      }
      return d;
    }));

    const target = devices.find(d => d.id === id);
    logAudit(
      'DEVICE_BLOCKED',
      `${target?.hostname || id} (${target?.ip || ''})`,
      `Blocage réseau appliqué. Motif: ${reason}. Ports switch désactivés.`,
      'danger'
    );

    // Create an alert for visibility
    const newAlert: Alert = {
      id: `alt-${Date.now()}`,
      deviceId: id,
      deviceName: target?.hostname || id,
      deviceIp: target?.ip || '0.0.0.0',
      severity: 'high',
      type: 'security',
      title: `Équipement bloqué par l'administrateur`,
      message: `L'équipement ${target?.hostname} (${target?.ip}) a été bloqué pour le motif : ${reason}`,
      status: 'active',
      timestamp
    };
    setAlerts(prev => [newAlert, ...prev]);
  }, [devices, logAudit]);

  // Unblock Device
  const unblockDevice = useCallback((id: string) => {
    setDevices(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          isBlocked: false,
          status: 'UP',
          blockReason: undefined,
          blockedAt: undefined,
          interfaces: d.interfaces.map(iface => ({
            ...iface,
            adminStatus: 'UP',
            operStatus: 'UP'
          }))
        };
      }
      return d;
    }));

    const target = devices.find(d => d.id === id);
    logAudit('DEVICE_UNBLOCKED', `${target?.hostname || id}`, `Déblocage et rétablissement des ports réseau.`);
  }, [devices, logAudit]);

  // Toggle Interface Port Admin Status (UP / DOWN)
  const toggleInterfacePort = useCallback((deviceId: string, interfaceId: string) => {
    let portName = '';
    let targetDeviceName = '';
    let isNowDown = false;

    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        targetDeviceName = d.hostname;
        const updatedInterfaces = d.interfaces.map(iface => {
          if (iface.id === interfaceId) {
            portName = iface.name;
            const nextStatus: 'UP' | 'DOWN' = iface.adminStatus === 'UP' ? 'DOWN' : 'UP';
            isNowDown = nextStatus === 'DOWN';
            return {
              ...iface,
              adminStatus: nextStatus,
              operStatus: nextStatus,
              trafficInMbps: nextStatus === 'DOWN' ? 0 : iface.trafficInMbps,
              trafficOutMbps: nextStatus === 'DOWN' ? 0 : iface.trafficOutMbps
            };
          }
          return iface;
        });
        return { ...d, interfaces: updatedInterfaces };
      }
      return d;
    }));

    logAudit(
      isNowDown ? 'PORT_SHUTDOWN' : 'PORT_ENABLE',
      `${targetDeviceName || 'Switch'} -> ${portName || 'Port'}`,
      `Changement d'état administratif du port vers ${isNowDown ? 'DOWN' : 'UP'}`,
      isNowDown ? 'warning' : 'info'
    );
  }, [logAudit]);

  // Change Interface VLAN
  const changeInterfaceVlan = useCallback((deviceId: string, interfaceId: string, newVlan: number) => {
    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        return {
          ...d,
          interfaces: d.interfaces.map(iface => {
            if (iface.id === interfaceId) {
              return { ...iface, vlan: newVlan };
            }
            return iface;
          })
        };
      }
      return d;
    }));
    logAudit('PORT_VLAN_CHANGE', `Device ${deviceId} Port ${interfaceId}`, `VLAN réaffecté vers ID ${newVlan}`);
  }, [logAudit]);

  // Real or Simulated ICMP Ping Execution
  const executePing = useCallback(async (targetIp: string): Promise<{ success: boolean; latencyMs: number; details: string; packetLoss: number }> => {
    try {
      const res = await fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: targetIp })
      });
      const data = await res.json();

      logAudit(
        'MANUAL_PING',
        targetIp,
        `Sonde ICMP exécutée. RTT: ${data.latencyMs}ms, Pertes: ${data.packetLoss}%, Statut: ${data.success ? 'UP' : 'DOWN'}`
      );

      return data;
    } catch {
      // Fallback if network request fails
      const matchedDevice = devices.find(d => d.ip === targetIp);
      const isUp = matchedDevice ? matchedDevice.status !== 'DOWN' : true;
      const latency = isUp ? (matchedDevice?.metrics.latencyMs || 2.4) : 0;
      return {
        success: isUp,
        latencyMs: latency,
        details: isUp ? `Réponse de ${targetIp} : octets=64 temps=${latency}ms TTL=64` : `Délai d'attente de la demande dépassé pour ${targetIp}`,
        packetLoss: isUp ? 0 : 100
      };
    }
  }, [devices, logAudit]);

  // Network Discovery Scan
  const startNetworkDiscovery = useCallback(async (subnet: string, snmpCommunity = 'public') => {
    setIsScanning(true);
    setScanProgress(5);
    setScanLog([`[${new Date().toLocaleTimeString()}] Démarrage de la découverte réseau sur la plage ${subnet}...`]);

    try {
      // Step-by-step progress simulation with real API support
      const steps = [
        { pct: 20, msg: `Envoi des requêtes ICMP Echo Broadcast et ARP Sweep sur ${subnet}...` },
        { pct: 45, msg: `Collecte des réponses ARP et interrogation des tables MAC associées...` },
        { pct: 70, msg: `Interrogation SNMP MIB-II (sysDescr, sysName) avec la communauté "${snmpCommunity}"...` },
        { pct: 90, msg: `Analyse des OUI IEEE et classification automatique des périphériques...` },
        { pct: 100, msg: `Balayage terminé avec succès. Tous les équipements ont été répertoriés.` }
      ];

      for (const step of steps) {
        await new Promise(r => setTimeout(r, 600));
        setScanProgress(step.pct);
        setScanLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step.msg}`]);
      }

      // Add a newly discovered device to the triage queue
      const randomIpEnd = Math.floor(Math.random() * 200 + 20);
      const newlyFoundDevice: NewDevice = {
        id: `nd-scan-${Date.now()}`,
        ip: subnet.replace(/\.0\/\d+$/, `.${randomIpEnd}`).replace(/\/\d+$/, `.${randomIpEnd}`),
        mac: `00:E0:4C:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
        vendor: 'Realtek Semiconductor',
        hostname: `host-${randomIpEnd}.local`,
        firstSeen: new Date().toISOString().replace('T', ' ').substring(0, 19),
        lastSeen: 'À l’instant',
        status: 'pending',
        suggestedType: 'pc',
        siteId: selectedSite !== 'all' ? selectedSite : 'cotonou'
      };

      setNewDevices(prev => [newlyFoundDevice, ...prev]);

      logAudit(
        'DISCOVERY_SCAN_RUN',
        subnet,
        `Scan automatique terminé. Découverte de 1 nouvel équipement (${newlyFoundDevice.ip}) placé en file de triage.`
      );
    } finally {
      setIsScanning(false);
    }
  }, [selectedSite, logAudit]);

  // Authorize New Device from triage queue into active inventory
  const authorizeNewDevice = useCallback((id: string, customData?: Partial<Device>) => {
    const target = newDevices.find(nd => nd.id === id);
    if (!target) return;

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
      os: customData?.os || 'Auto-Detected OS',
      serialNumber: `SN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      location: customData?.location || 'Poste Découvert Réseau',
      snmpEnabled: true,
      snmpVersion: 'v2c',
      snmpCommunity: 'public',
      isBlocked: false,
      firstSeen: target.firstSeen,
      lastSeen: new Date().toISOString().replace('T', ' ').substring(0, 19),
      metrics: {
        latencyMs: 2.1,
        minLatencyMs: 1.5,
        maxLatencyMs: 3.8,
        packetLossPct: 0,
        cpuPct: 15,
        cpuTempC: 38,
        ramUsedMb: 1024,
        ramTotalMb: 2048,
        ramPct: 50,
        uptimeSeconds: 3600,
        availabilityPct: 100,
        historyLatency: [2.1, 2.1, 2.1, 2.1, 2.1, 2.1, 2.1, 2.1, 2.1, 2.1],
        historyCpu: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
        historyRam: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
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

    setDevices(prev => [addedDev, ...prev]);
    setNewDevices(prev => prev.filter(nd => nd.id !== id));
    logAudit('NEW_DEVICE_AUTHORIZED', `${addedDev.hostname} (${addedDev.ip})`, `Équipement approuvé et intégré dans l'inventaire officiel.`);
  }, [newDevices, logAudit]);

  // Block New Device straight from triage queue
  const blockNewDevice = useCallback((id: string, reason = 'Périphérique suspect non homologué') => {
    const target = newDevices.find(nd => nd.id === id);
    if (!target) return;

    setNewDevices(prev => prev.filter(nd => nd.id !== id));
    logAudit('NEW_DEVICE_BLOCKED', `${target.ip} [${target.mac}]`, `Blocage préventif: ${reason}. Inscription dans la liste noire MAC.`, 'danger');
  }, [newDevices, logAudit]);

  // Ignore New Device
  const ignoreNewDevice = useCallback((id: string) => {
    setNewDevices(prev => prev.filter(nd => nd.id !== id));
  }, []);

  // Alert Actions
  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, status: 'acknowledged', acknowledgedBy: currentUser.name } : a)));
    logAudit('ALERT_ACKNOWLEDGED', id, `Alerte prise en compte par ${currentUser.name}`);
  }, [currentUser, logAudit]);

  const resolveAlert = useCallback((id: string) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, status: 'resolved', resolvedAt: timestamp } : a)));
    logAudit('ALERT_RESOLVED', id, `Alerte clôturée avec succès`);
  }, [logAudit]);

  // Rules Actions
  const addAlertRule = useCallback((ruleData: Partial<AlertRule>) => {
    const newRule: AlertRule = {
      id: `rule-${Date.now()}`,
      name: ruleData.name || 'Nouvelle règle de supervision',
      metric: ruleData.metric || 'cpu_usage',
      condition: ruleData.condition || '>',
      threshold: ruleData.threshold ?? 85,
      durationMinutes: ruleData.durationMinutes ?? 5,
      action: ruleData.action || 'create_warning_alert',
      enabled: true,
      description: ruleData.description || 'Règle personnalisée configurée via le moteur KingNMS.'
    };
    setRules(prev => [newRule, ...prev]);
    logAudit('ALERT_RULE_CREATED', newRule.name, `Création d'une nouvelle règle automatique de seuil`);
  }, [logAudit]);

  const toggleAlertRule = useCallback((id: string) => {
    setRules(prev => prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }, []);

  const deleteAlertRule = useCallback((id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    logAudit('ALERT_RULE_DELETED', id, `Suppression de la règle`);
  }, [logAudit]);

  // Add VLAN
  const addVlan = useCallback((vlanData: Partial<VLAN>) => {
    const newV: VLAN = {
      id: vlanData.id || Math.floor(Math.random() * 800 + 70),
      name: vlanData.name || `VLAN ${vlanData.id}`,
      description: vlanData.description || 'Sous-réseau utilisateur',
      subnet: vlanData.subnet || '192.168.10.0/24',
      deviceCount: 0,
      trafficMbps: 0,
      status: 'healthy'
    };
    setVlans(prev => [...prev, newV]);
    logAudit('VLAN_CREATED', `${newV.name} (ID: ${newV.id})`, `Création du sous-réseau ${newV.subnet}`);
  }, [logAudit]);

  // Update Notifications
  const updateNotifications = useCallback((settings: Partial<NotificationSettings>) => {
    setNotifications(prev => ({ ...prev, ...settings }));
    logAudit('NOTIFICATION_SETTINGS_UPDATED', 'Configuration', 'Mise à jour des canaux de notification');
  }, [logAudit]);

  // User Role Switcher
  const setUserRole = useCallback((role: UserRole) => {
    setCurrentUser(prev => ({ ...prev, role }));
  }, []);

  const triggerManualRefresh = useCallback(() => {
    setLastPollTime(new Date().toLocaleTimeString());
  }, []);

  return (
    <KingNMSContext.Provider
      value={{
        devices,
        alerts,
        newDevices,
        vlans,
        sites,
        probes,
        auditLogs,
        rules,
        currentUser,
        notifications,
        selectedSite,
        selectedVlan,
        searchQuery,
        isScanning,
        scanProgress,
        scanLog,
        isLivePolling,
        lastPollTime,
        setSelectedSite,
        setSelectedVlan,
        setSearchQuery,
        setIsLivePolling,
        addDevice,
        updateDevice,
        deleteDevice,
        blockDevice,
        unblockDevice,
        toggleInterfacePort,
        changeInterfaceVlan,
        executePing,
        startNetworkDiscovery,
        authorizeNewDevice,
        blockNewDevice,
        ignoreNewDevice,
        acknowledgeAlert,
        resolveAlert,
        addAlertRule,
        toggleAlertRule,
        deleteAlertRule,
        addVlan,
        updateNotifications,
        setUserRole,
        triggerManualRefresh
      }}
    >
      {children}
    </KingNMSContext.Provider>
  );
}

export function useKingNMS() {
  const context = useContext(KingNMSContext);
  if (!context) {
    throw new Error('useKingNMS must be used within a KingNMSProvider');
  }
  return context;
}
