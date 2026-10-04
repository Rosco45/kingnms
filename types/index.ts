export type DeviceType =
  | 'router'
  | 'switch'
  | 'server'
  | 'pc'
  | 'printer'
  | 'ap'
  | 'camera'
  | 'phone'
  | 'iot'
  | 'unknown';

export type DeviceStatus = 'UP' | 'DOWN' | 'WARNING';

export type AlertSeverity = 'info' | 'notice' | 'warning' | 'high' | 'critical';

export type UserRole = 'superadmin' | 'netadmin' | 'supervisor' | 'viewer';

export interface DeviceInterface {
  id: string;
  name: string; // e.g. "Gi0/1", "eth0", "wlan0"
  adminStatus: 'UP' | 'DOWN';
  operStatus: 'UP' | 'DOWN';
  speed: string; // e.g. "1 Gbps", "10 Gbps", "100 Mbps"
  duplex: 'Full' | 'Half';
  trafficInMbps: number;
  trafficOutMbps: number;
  trafficUsagePct: number;
  errorsIn: number;
  errorsOut: number;
  packetLoss: number;
  collisions: number;
  connectedDevice?: string;
  connectedMac?: string;
  vlan: number;
}

export interface DeviceMetrics {
  latencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  packetLossPct: number;
  cpuPct: number;
  cpuTempC: number;
  ramUsedMb: number;
  ramTotalMb: number;
  ramPct: number;
  uptimeSeconds: number;
  availabilityPct: number;
  historyLatency?: number[];
  historyCpu?: number[];
  historyRam?: number[];
  historyTraffic?: { in: number; out: number; time: string }[];
}

export interface Device {
  id: string;
  ip: string;
  hostname: string;
  mac: string;
  vendor: string;
  type: DeviceType;
  status: DeviceStatus;
  siteId: string;
  vlanId: number;
  model: string;
  os: string;
  serialNumber: string;
  location: string;
  snmpEnabled: boolean;
  snmpVersion: 'v1' | 'v2c' | 'v3';
  snmpCommunity: string;
  isBlocked: boolean;
  blockReason?: string;
  blockedAt?: string;
  firstSeen: string;
  lastSeen: string;
  metrics: DeviceMetrics;
  interfaces: DeviceInterface[];
  notes?: string;
}

export interface Alert {
  id: string;
  deviceId?: string;
  deviceName: string;
  deviceIp: string;
  severity: AlertSeverity;
  type:
    | 'unreachable'
    | 'recovered'
    | 'high_cpu'
    | 'high_ram'
    | 'high_temp'
    | 'abnormal_traffic'
    | 'interface_down'
    | 'packet_loss'
    | 'high_latency'
    | 'new_device'
    | 'config_change'
    | 'security';
  title: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  timestamp: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
}

export interface NewDevice {
  id: string;
  ip: string;
  mac: string;
  vendor: string;
  hostname?: string;
  firstSeen: string;
  lastSeen: string;
  status: 'pending' | 'authorized' | 'blocked' | 'ignored';
  suggestedType: DeviceType;
  siteId: string;
}

export interface VLAN {
  id: number;
  name: string;
  description: string;
  subnet: string;
  deviceCount: number;
  trafficMbps: number;
  status: 'healthy' | 'warning' | 'alert';
}

export interface Site {
  id: string;
  name: string;
  location: string;
  deviceCount: number;
  probeStatus: 'online' | 'warning' | 'offline';
  latencyMs: number;
  description: string;
}

export interface Probe {
  id: string;
  name: string;
  siteId: string;
  siteName: string;
  ip: string;
  status: 'active' | 'degraded' | 'offline';
  lastHeartbeat: string;
  version: string;
  monitoredCount: number;
  pingRate: string;
  cpuPct: number;
  ramPct: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  details: string;
  severity: 'info' | 'warning' | 'danger';
}

export interface AlertRule {
  id: string;
  name: string;
  metric:
    | 'icmp_ping'
    | 'cpu_usage'
    | 'ram_usage'
    | 'interface_traffic'
    | 'new_device'
    | 'packet_loss'
    | 'temperature';
  condition: '>' | '<' | '==' | 'fails';
  threshold: number | string;
  durationMinutes: number;
  action:
    | 'create_critical_alert'
    | 'create_warning_alert'
    | 'notify_telegram'
    | 'notify_email'
    | 'shutdown_port'
    | 'block_device';
  enabled: boolean;
  description: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  lastActive: string;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  emailRecipient: string;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  webhookEnabled: boolean;
  webhookUrl: string;
  smsEnabled: boolean;
  smsPhone: string;
  notifyOnCritical: boolean;
  notifyOnWarning: boolean;
  notifyOnNewDevice: boolean;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
}
