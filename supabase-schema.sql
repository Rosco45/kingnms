-- ==============================================================================
-- King Network Management System (KingNMS) - Supabase Database Schema
-- Run this script in the Supabase SQL Editor to initialize all tables and policies.
-- ==============================================================================

-- 1. Sites Table
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  probe_status TEXT DEFAULT 'online',
  latency_ms NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VLANs Table
CREATE TABLE IF NOT EXISTS vlans (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subnet TEXT NOT NULL,
  traffic_mbps NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'healthy',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Devices Table
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  ip TEXT NOT NULL,
  hostname TEXT NOT NULL,
  mac TEXT NOT NULL,
  vendor TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UP',
  site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
  vlan_id INTEGER REFERENCES vlans(id) ON DELETE SET NULL,
  model TEXT,
  os TEXT,
  serial_number TEXT,
  location TEXT,
  snmp_enabled BOOLEAN DEFAULT true,
  snmp_version TEXT DEFAULT 'v2c',
  snmp_community TEXT DEFAULT 'public',
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  blocked_at TIMESTAMPTZ,
  metrics JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Device Interfaces Table
CREATE TABLE IF NOT EXISTS device_interfaces (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  admin_status TEXT DEFAULT 'UP',
  oper_status TEXT DEFAULT 'UP',
  speed TEXT DEFAULT '1 Gbps',
  duplex TEXT DEFAULT 'Full',
  traffic_in_mbps NUMERIC DEFAULT 0,
  traffic_out_mbps NUMERIC DEFAULT 0,
  traffic_usage_pct NUMERIC DEFAULT 0,
  errors_in BIGINT DEFAULT 0,
  errors_out BIGINT DEFAULT 0,
  packet_loss NUMERIC DEFAULT 0,
  collisions BIGINT DEFAULT 0,
  connected_device TEXT,
  connected_mac TEXT,
  vlan INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_ip TEXT NOT NULL,
  severity TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_by TEXT,
  resolved_at TIMESTAMPTZ
);

-- 6. New Discovered Devices (Triage Queue)
CREATE TABLE IF NOT EXISTS new_devices (
  id TEXT PRIMARY KEY,
  ip TEXT NOT NULL,
  mac TEXT NOT NULL,
  vendor TEXT NOT NULL,
  hostname TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  suggested_type TEXT DEFAULT 'unknown',
  site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Probes Table
CREATE TABLE IF NOT EXISTS probes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
  ip TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  version TEXT DEFAULT '2.4.0',
  monitored_count INTEGER DEFAULT 0,
  ping_rate TEXT DEFAULT '1s',
  cpu_pct NUMERIC DEFAULT 0,
  ram_pct NUMERIC DEFAULT 0
);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  details TEXT,
  severity TEXT DEFAULT 'info'
);

-- 9. Alert Rules Table
CREATE TABLE IF NOT EXISTS alert_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  metric TEXT NOT NULL,
  condition TEXT NOT NULL,
  threshold TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 5,
  action TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create public permissive policies for demo/admin access
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE vlans ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_interfaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE new_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE probes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON sites FOR ALL USING (true);
CREATE POLICY "Allow public read access" ON vlans FOR ALL USING (true);
CREATE POLICY "Allow public read access" ON devices FOR ALL USING (true);
CREATE POLICY "Allow public read access" ON device_interfaces FOR ALL USING (true);
CREATE POLICY "Allow public read access" ON alerts FOR ALL USING (true);
CREATE POLICY "Allow public read access" ON new_devices FOR ALL USING (true);
CREATE POLICY "Allow public read access" ON probes FOR ALL USING (true);
CREATE POLICY "Allow public read access" ON audit_logs FOR ALL USING (true);
CREATE POLICY "Allow public read access" ON alert_rules FOR ALL USING (true);
