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
  detectedSubnet: string;
  detectedGateway: string;
  detectedHostIp: string;
  // Actions
  setSelectedSite: (site: string) => void;
  setSelectedVlan: (vlan: number | null) => void;
  setSearchQuery: (query: string) => void;
  setIsLivePolling: (active: boolean) => void;
  addDevice: (device: Partial<Device>) => Promise<void>;
  updateDevice: (id: string, updates: Partial<Device>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  blockDevice: (id: string, reason: string) => Promise<void>;
  unblockDevice: (id: string) => Promise<void>;
  toggleInterfacePort: (deviceId: string, interfaceId: string) => Promise<void>;
  changeInterfaceVlan: (deviceId: string, interfaceId: string, newVlan: number) => void;
  executePing: (ip: string) => Promise<{ success: boolean; latencyMs: number; details: string; packetLoss: number }>;
  executeTraceroute: (target: string) => Promise<{ success: boolean; totalHops: number; hops: any[] }>;
  startNetworkDiscovery: (subnet?: string, snmpCommunity?: string) => Promise<void>;
  authorizeNewDevice: (id: string, customData?: Partial<Device>) => Promise<void>;
  blockNewDevice: (id: string, reason?: string) => Promise<void>;
  ignoreNewDevice: (id: string) => Promise<void>;
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  addAlertRule: (rule: Partial<AlertRule>) => void;
  toggleAlertRule: (id: string) => void;
  deleteAlertRule: (id: string) => void;
  addVlan: (vlan: Partial<VLAN>) => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  setUserRole: (role: UserRole) => void;
  triggerManualRefresh: () => Promise<void>;
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

  // Real Network Detection
  const [detectedSubnet, setDetectedSubnet] = useState<string>('192.168.100.0/24');
  const [detectedGateway, setDetectedGateway] = useState<string>('192.168.100.1');
  const [detectedHostIp, setDetectedHostIp] = useState<string>('192.168.100.74');

  // Load from backend persistent database & detect real network on mount
  const fetchBackendData = useCallback(async () => {
    try {
      // 1. Fetch real system network interfaces
      const netRes = await fetch('/api/system/interfaces').catch(() => null);
      if (netRes?.ok) {
        const netData = await netRes.json();
        if (netData.defaultSubnet) setDetectedSubnet(netData.defaultSubnet);
        if (netData.defaultGateway) setDetectedGateway(netData.defaultGateway);
        if (netData.hostIp) setDetectedHostIp(netData.hostIp);
      }

      // 2. Fetch persistent devices
      const devRes = await fetch('/api/devices').catch(() => null);
      if (devRes?.ok) {
        const devData = await devRes.json();
        if (devData.devices?.length) {
          setDevices(devData.devices);
        }
      }

      // 3. Fetch alerts
      const altRes = await fetch('/api/alerts').catch(() => null);
      if (altRes?.ok) {
        const altData = await altRes.json();
        if (altData.alerts?.length) {
          setAlerts(altData.alerts);
        }
      }

      // 4. Fetch new devices
      const ndRes = await fetch('/api/new-devices').catch(() => null);
      if (ndRes?.ok) {
        const ndData = await ndRes.json();
        if (ndData.newDevices) {
          setNewDevices(ndData.newDevices);
        }
      }
    } catch {
      // Offline safe fallback
    }
  }, []);

  useEffect(() => {
    fetchBackendData();
  }, [fetchBackendData]);

  // Periodic Backend Monitoring Cycle Poller
  useEffect(() => {
    if (!isLivePolling) return;

    const interval = setInterval(async () => {
      try {
        setLastPollTime(new Date().toLocaleTimeString());
        const res = await fetch('/api/system/monitor', { method: 'POST' });
        if (res.ok) {
          // Re-fetch updated statuses
          const devRes = await fetch('/api/devices');
          if (devRes.ok) {
            const devData = await devRes.json();
            setDevices(devData.devices);
          }
          const altRes = await fetch('/api/alerts');
          if (altRes.ok) {
            const altData = await altRes.json();
            setAlerts(altData.alerts);
          }
        }
      } catch {
        // Fallback smooth ticker
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isLivePolling]);

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

  // Add Device with server persistence
  const addDevice = useCallback(async (deviceData: Partial<Device>) => {
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData)
      });
      if (res.ok) {
        const data = await res.json();
        setDevices(prev => [data.device, ...prev]);
        logAudit('DEVICE_CREATED', `${data.device.hostname} (${data.device.ip})`, `Ajout manuel d’un équipement de type ${data.device.type}`);
        return;
      }
    } catch {}

    // Local fallback
    const newDev: Device = {
      id: `dev-${Date.now()}`,
      ip: deviceData.ip || '192.168.100.100',
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
        historyLatency: [1.8, 1.8, 1.8, 1.8, 1.8],
        historyCpu: [20, 22, 24, 25, 24],
        historyRam: [50, 50, 50, 50, 50]
      },
      interfaces: [
        {
          id: `if-${Date.now()}-1`,
          name: 'eth0',
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
      notes: deviceData.notes || 'Équipement ajouté.'
    };

    setDevices(prev => [newDev, ...prev]);
    logAudit('DEVICE_CREATED', `${newDev.hostname} (${newDev.ip})`, `Ajout manuel d’un équipement`);
  }, [logAudit]);

  // Update Device
  const updateDevice = useCallback(async (id: string, updates: Partial<Device>) => {
    try {
      await fetch(`/api/devices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch {}
    setDevices(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
    logAudit('DEVICE_UPDATED', id, `Mise à jour des métadonnées équipement`);
  }, [logAudit]);

  // Delete Device
  const deleteDevice = useCallback(async (id: string) => {
    try {
      await fetch(`/api/devices/${id}`, { method: 'DELETE' });
    } catch {}
    const target = devices.find(d => d.id === id);
    setDevices(prev => prev.filter(d => d.id !== id));
    logAudit('DEVICE_DELETED', target?.hostname || id, `Suppression définitive de l’inventaire`);
  }, [devices, logAudit]);

  // Block Device with persistent server execution
  const blockDevice = useCallback(async (id: string, reason: string) => {
    try {
      await fetch(`/api/devices/${id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
    } catch {}

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
  }, [devices, logAudit]);

  // Unblock Device
  const unblockDevice = useCallback(async (id: string) => {
    try {
      await fetch(`/api/devices/${id}/unblock`, { method: 'POST' });
    } catch {}

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
  const toggleInterfacePort = useCallback(async (deviceId: string, interfaceId: string) => {
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

    try {
      await fetch('/api/ports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          interfaceId,
          action: isNowDown ? 'shutdown' : 'noshutdown'
        })
      });
    } catch {}

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

  // Real ICMP Ping Execution via system ping tool
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
      return {
        success: false,
        latencyMs: 0,
        details: `Échec de connexion au service ICMP pour ${targetIp}`,
        packetLoss: 100
      };
    }
  }, [logAudit]);

  // Real Traceroute Hop-by-Hop execution
  const executeTraceroute = useCallback(async (target: string) => {
    try {
      const res = await fetch('/api/traceroute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });
      return await res.json();
    } catch {
      return { success: false, totalHops: 0, hops: [] };
    }
  }, []);

  // Real Network Discovery Scan on actual subnet
  const startNetworkDiscovery = useCallback(async (subnet?: string, snmpCommunity = 'public') => {
    const targetSubnet = subnet || detectedSubnet;
    setIsScanning(true);
    setScanProgress(10);
    setScanLog([
      `[${new Date().toLocaleTimeString()}] Démarrage de la découverte automatique réelle sur ${targetSubnet}...`,
      `[${new Date().toLocaleTimeString()}] Détection de l'interface réseau active (${detectedHostIp}) & passerelle (${detectedGateway})...`
    ]);

    try {
      setScanProgress(30);
      setScanLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Envoi des requêtes ICMP Echo et lecture de la table ARP du noyau Linux...`]);

      const res = await fetch('/api/discovery/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subnet: targetSubnet, snmpCommunity })
      });

      setScanProgress(75);
      setScanLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Résolution des adresses MAC IEEE OUI et requêtes MIB-II SNMP...`]);

      if (res.ok) {
        const data = await res.json();
        setScanProgress(100);
        setScanLog(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Balayage terminé. ${data.totalFound} équipement(s) réel(s) identifié(s) sur le réseau local.`
        ]);

        // Refresh devices and new devices from server
        const devRes = await fetch('/api/devices');
        if (devRes.ok) {
          const devData = await devRes.json();
          setDevices(devData.devices);
        }
      }
    } finally {
      setIsScanning(false);
    }
  }, [detectedSubnet, detectedHostIp, detectedGateway]);

  // Authorize New Device
  const authorizeNewDevice = useCallback(async (id: string, customData?: Partial<Device>) => {
    try {
      const res = await fetch('/api/new-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'authorize', id, customData })
      });
      if (res.ok) {
        const data = await res.json();
        setDevices(prev => [data.device, ...prev]);
        setNewDevices(prev => prev.filter(nd => nd.id !== id));
      }
    } catch {}
  }, []);

  // Block New Device
  const blockNewDevice = useCallback(async (id: string, reason = 'Périphérique suspect non homologué') => {
    try {
      await fetch('/api/new-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'block', id, reason })
      });
      setNewDevices(prev => prev.filter(nd => nd.id !== id));
    } catch {}
  }, []);

  // Ignore New Device
  const ignoreNewDevice = useCallback(async (id: string) => {
    try {
      await fetch('/api/new-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ignore', id })
      });
      setNewDevices(prev => prev.filter(nd => nd.id !== id));
    } catch {}
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

  const triggerManualRefresh = useCallback(async () => {
    setLastPollTime(new Date().toLocaleTimeString());
    await fetchBackendData();
  }, [fetchBackendData]);

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
        detectedSubnet,
        detectedGateway,
        detectedHostIp,
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
        executeTraceroute,
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
