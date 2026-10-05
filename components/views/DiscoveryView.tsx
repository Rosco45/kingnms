'use client';

import React, { useState } from 'react';
import {
  Radar,
  Play,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  ArrowRight,
  Shield,
  PlusCircle,
  Terminal,
  Activity
} from 'lucide-react';
import { useKingNMS } from '../../lib/stateStore';
import { DeviceType } from '../../types';

interface DiscoveredHost {
  id: string;
  ip: string;
  mac: string;
  hostname: string;
  vendor: string;
  type: DeviceType;
  model: string;
  os: string;
  vlan: number;
  latencyMs: number;
  snmpResponding: boolean;
}

export default function DiscoveryView({ onOpenAddDevice }: { onOpenAddDevice: () => void }) {
  const {
    startNetworkDiscovery,
    isScanning,
    scanProgress,
    scanLog,
    addDevice,
    selectedSite,
    detectedSubnet,
    detectedGateway,
    detectedHostIp
  } = useKingNMS();

  const [subnet, setSubnet] = useState(detectedSubnet || '192.168.100.0/24');
  const [community, setCommunity] = useState('public');
  const [useIcmp, setUseIcmp] = useState(true);
  const [useArp, setUseArp] = useState(true);
  const [useSnmp, setUseSnmp] = useState(true);

  // Sync detected subnet when ready
  React.useEffect(() => {
    if (detectedSubnet) {
      setSubnet(detectedSubnet);
    }
  }, [detectedSubnet]);

  const [discoveredResults, setDiscoveredResults] = useState<DiscoveredHost[]>([
    {
      id: 'disc-gw',
      ip: '192.168.100.1',
      mac: '60:A6:C5:5E:E5:76',
      hostname: 'Routeur-Passerelle (192.168.100.1)',
      vendor: 'Huawei Technologies',
      type: 'router',
      model: 'EchoLife HG8245 GPON ONT',
      os: 'Huawei VRP Embedded',
      vlan: 10,
      latencyMs: 1.4,
      snmpResponding: true
    },
    {
      id: 'disc-host',
      ip: '192.168.100.74',
      mac: '84:3A:4B:9D:07:A8',
      hostname: 'roserick-Latitude-E6230 (Ce PC)',
      vendor: 'Dell Technologies / Intel',
      type: 'pc',
      model: 'Dell Latitude E6230',
      os: 'Linux x86_64',
      vlan: 10,
      latencyMs: 0.1,
      snmpResponding: false
    },
    {
      id: 'disc-infinix',
      ip: '192.168.100.24',
      mac: '80:79:5D:77:E3:0B',
      hostname: 'Infinix-Mobile-Device',
      vendor: 'Infinix Mobility Limited',
      type: 'phone',
      model: 'Infinix Smart Device',
      os: 'Android 13 / XOS',
      vlan: 20,
      latencyMs: 8.5,
      snmpResponding: false
    }
  ]);

  const [importedIds, setImportedIds] = useState<string[]>(['disc-gw', 'disc-host']);

  const handleLaunchScan = async () => {
    try {
      const data = await startNetworkDiscovery(subnet, community);
      if (data && data.devices && data.devices.length > 0) {
        const mapped: DiscoveredHost[] = data.devices.map((d: any, idx: number) => ({
          id: `disc-live-${idx}-${Date.now()}`,
          ip: d.ip,
          mac: d.mac,
          hostname: d.hostname,
          vendor: d.vendor,
          type: d.type,
          model: d.model,
          os: d.os,
          vlan: d.isGateway ? 10 : 20,
          latencyMs: d.latencyMs,
          snmpResponding: d.snmpResponding
        }));
        setDiscoveredResults(mapped);
      }
    } catch (err) {
      console.error('Scan error:', err);
    }
  };

  const handleImport = (host: DiscoveredHost) => {
    addDevice({
      ip: host.ip,
      hostname: host.hostname,
      mac: host.mac,
      vendor: host.vendor,
      type: host.type,
      model: host.model,
      os: host.os,
      siteId: selectedSite !== 'all' ? selectedSite : 'cotonou',
      vlanId: host.vlan,
      snmpEnabled: host.snmpResponding,
      snmpCommunity: community
    });
    setImportedIds(prev => [...prev, host.id]);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Radar className="w-5 h-5 text-cyan-400" />
            Moteur de Découverte Automatique Réseau
          </h1>
          <p className="text-xs text-slate-400">
            Balayage IP, requêtes ICMP broadcast, inspection ARP, interrogation SNMP et classification automatique OUI.
          </p>
        </div>

        <button
          onClick={onOpenAddDevice}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Ajout Manuel Direct
        </button>
      </div>

      {/* Scan Config Card */}
      <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            Paramètres du Balayage Réseau
          </h2>
          {detectedSubnet && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LAN Réel : {detectedSubnet} (GW: {detectedGateway})
              </span>
              <button
                type="button"
                onClick={() => setSubnet(detectedSubnet)}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 font-bold transition-all"
              >
                Appliquer mon sous-réseau
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Subnet Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Plage IP / CIDR :
            </label>
            <input
              type="text"
              value={subnet}
              onChange={(e) => setSubnet(e.target.value)}
              className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              placeholder="ex: 192.168.100.0/24"
            />
            {/* Quick chips */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px] font-mono">
              <span className="text-slate-500">Préréglages :</span>
              {[detectedSubnet || '192.168.100.0/24', '192.168.1.0/24', '10.0.0.0/24'].map(r => (
                <button
                  key={r}
                  onClick={() => setSubnet(r)}
                  className="px-2 py-0.5 rounded bg-[#162032] hover:bg-[#1E2C44] text-slate-300 border border-[#1F2E45]"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* SNMP Community */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Communauté SNMP (v1/v2c) :
            </label>
            <input
              type="text"
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              placeholder="public"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Permet l'interrogation automatique des noms systèmes et des interfaces.
            </p>
          </div>

          {/* Techniques Checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Méthodes de Découverte :
            </label>
            <div className="space-y-1.5 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useIcmp}
                  onChange={(e) => setUseIcmp(e.target.checked)}
                  className="rounded text-cyan-500"
                />
                <span>Sonde ICMP Echo (Ping rapide)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useArp}
                  onChange={(e) => setUseArp(e.target.checked)}
                  className="rounded text-cyan-500"
                />
                <span>Résolution ARP & OUI Fabricant</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSnmp}
                  onChange={(e) => setUseSnmp(e.target.checked)}
                  className="rounded text-cyan-500"
                />
                <span>Sweep SNMP MIB-II (sysDescr)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Scan Trigger Button */}
        <div className="mt-5 pt-4 border-t border-[#1F2E45] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {isScanning ? (
              <span className="text-cyan-400 font-bold flex items-center gap-2">
                <Radar className="w-4 h-4 animate-spin" /> Scan en cours... {scanProgress}%
              </span>
            ) : (
              <span>Prêt pour la découverte sur {subnet}</span>
            )}
          </div>

          <button
            onClick={handleLaunchScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs shadow-glow-cyan transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            Lancer la Découverte Automatique
          </button>
        </div>

        {/* Progress Bar */}
        {isScanning && (
          <div className="mt-4 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Live Terminal Log */}
      {scanLog.length > 0 && (
        <div className="bg-[#0A0F1A] border border-[#1F2E45] rounded-xl p-4 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-400 mb-2 border-b border-[#1F2E45]/80 pb-1">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-[11px] uppercase">Console du Moteur de Scan</span>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto text-cyan-300/90 text-[11px]">
            {scanLog.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* Discovered Hosts Table */}
      <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-[#141E33] border-b border-[#1F2E45] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Équipements Identifiés ({discoveredResults.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Classification automatique basée sur les MIBs et OUI
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121A2A] text-slate-400 border-b border-[#1F2E45] font-mono">
              <tr>
                <th className="py-2.5 px-4">Adresse IP</th>
                <th className="py-2.5 px-4">Adresse MAC & Fabricant</th>
                <th className="py-2.5 px-4">Hostname / Nom Détecté</th>
                <th className="py-2.5 px-4">Type Classifié</th>
                <th className="py-2.5 px-4">Modèle & OS Détecté</th>
                <th className="py-2.5 px-4">Latence</th>
                <th className="py-2.5 px-4">SNMP</th>
                <th className="py-2.5 px-4 text-right">Statut / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2E45] bg-[#0E1524]">
              {discoveredResults.map(host => {
                const isImported = importedIds.includes(host.id);
                return (
                  <tr key={host.id} className="hover:bg-[#141E33] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {host.ip}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-200">{host.mac}</div>
                      <div className="text-[10px] text-slate-400">{host.vendor}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      {host.hostname}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                        {host.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{host.model}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{host.os}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {host.latencyMs} ms
                    </td>
                    <td className="py-3 px-4">
                      {host.snmpResponding ? (
                        <span className="text-emerald-400 font-bold text-[11px]">✓ Répond (v2c)</span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">- Non actif</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isImported ? (
                        <span className="text-emerald-400 text-xs font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Dans l’inventaire
                        </span>
                      ) : (
                        <button
                          onClick={() => handleImport(host)}
                          className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-sm transition-all"
                        >
                          Importer
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
