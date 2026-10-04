'use client';

import React, { useState } from 'react';
import {
  X,
  Server,
  Activity,
  Cpu,
  HardDrive,
  Thermometer,
  Clock,
  Shield,
  ShieldAlert,
  Radio,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Layers,
  ArrowDownUp,
  SlidersHorizontal,
  FileText
} from 'lucide-react';
import { Device, DeviceInterface } from '../types';
import { useKingNMS } from '../lib/stateStore';

interface DeviceDetailModalProps {
  device: Device | null;
  onClose: () => void;
  onOpenBlockModal: (device: Device) => void;
}

export default function DeviceDetailModal({
  device,
  onClose,
  onOpenBlockModal
}: DeviceDetailModalProps) {
  const {
    executePing,
    toggleInterfacePort,
    changeInterfaceVlan,
    vlans,
    sites,
    auditLogs
  } = useKingNMS();

  const [activeTab, setActiveTab] = useState<'overview' | 'interfaces' | 'metrics' | 'history'>('overview');
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);
  const [selectedPortVlan, setSelectedPortVlan] = useState<{ portId: string; vlan: number } | null>(null);

  if (!device) return null;

  const site = sites.find(s => s.id === device.siteId);
  const vlan = vlans.find(v => v.id === device.vlanId);
  const deviceLogs = auditLogs.filter(
    l => l.target.includes(device.hostname) || l.target.includes(device.ip)
  );

  const handlePing = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const res = await executePing(device.ip);
      setPingResult(res.details);
    } catch {
      setPingResult(`Erreur lors du ping vers ${device.ip}`);
    } finally {
      setIsPinging(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}j ${hours}h ${mins}m`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-[#0E1524] border border-[#1F2E45] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#141E33] border-b border-[#1F2E45]">
          <div className="flex items-center gap-3.5">
            <div className={`p-2.5 rounded-xl border ${
              device.status === 'UP' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
              device.status === 'DOWN' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
              'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              <Server className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-black text-white font-mono">{device.hostname}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${
                  device.status === 'UP' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  device.status === 'DOWN' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' :
                  'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    device.status === 'UP' ? 'bg-emerald-400' :
                    device.status === 'DOWN' ? 'bg-rose-400' : 'bg-amber-400'
                  }`} />
                  {device.status}
                </span>

                {device.isBlocked && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-600">
                    BLOQUÉ (SÉCURITÉ)
                  </span>
                )}

                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                  {device.type}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 font-mono mt-0.5">
                <span>IP: <strong className="text-slate-200">{device.ip}</strong></span>
                <span>MAC: <strong className="text-slate-200">{device.mac}</strong></span>
                <span>Site: <strong className="text-slate-200">{site?.name.split('-')[0] || device.siteId}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePing}
              disabled={isPinging}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              {isPinging ? 'Ping en cours...' : 'Tester Ping ICMP'}
            </button>

            {!device.isBlocked ? (
              <button
                onClick={() => onOpenBlockModal(device)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Bloquer
              </button>
            ) : null}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ping banner result if active */}
        {pingResult && (
          <div className="px-6 py-2 bg-[#09101C] border-b border-[#1F2E45] font-mono text-xs text-cyan-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{pingResult}</span>
            </div>
            <button onClick={() => setPingResult(null)} className="text-slate-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 border-b border-[#1F2E45] bg-[#101828]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Vue d’ensemble & Général
          </button>
          <button
            onClick={() => setActiveTab('interfaces')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'interfaces'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            Interfaces Réseau ({device.interfaces.length})
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'metrics'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Métriques & Sondes ICMP/SNMP
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Historique & Audit ({deviceLogs.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#121A2A] border border-[#1F2E45] rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Disponibilité</span>
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {device.metrics.availabilityPct.toFixed(2)} %
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Sonde ICMP 30 jours</div>
                </div>

                <div className="bg-[#121A2A] border border-[#1F2E45] rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Latence RTT</span>
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-xl font-black text-cyan-400 font-mono">
                    {device.metrics.latencyMs} ms
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Min: {device.metrics.minLatencyMs}ms / Max: {device.metrics.maxLatencyMs}ms</div>
                </div>

                <div className="bg-[#121A2A] border border-[#1F2E45] rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Charge CPU</span>
                    <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    {device.metrics.cpuPct} %
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Temp: {device.metrics.cpuTempC}°C</div>
                </div>

                <div className="bg-[#121A2A] border border-[#1F2E45] rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Uptime</span>
                    <Clock className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <div className="text-lg font-black text-violet-300 font-mono">
                    {formatUptime(device.metrics.uptimeSeconds)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Sans interruption</div>
                </div>
              </div>

              {/* Hardware & System Specs Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#121A2A] border border-[#1F2E45] rounded-xl p-4">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                    Informations Matérielles & Système
                  </h3>
                  <dl className="grid grid-cols-2 gap-y-2 text-xs">
                    <dt className="text-slate-400">Fabricant :</dt>
                    <dd className="font-semibold text-white">{device.vendor}</dd>

                    <dt className="text-slate-400">Modèle :</dt>
                    <dd className="font-semibold text-white">{device.model}</dd>

                    <dt className="text-slate-400">Système / Firmware :</dt>
                    <dd className="font-semibold text-white font-mono text-[11px]">{device.os}</dd>

                    <dt className="text-slate-400">N° de Série :</dt>
                    <dd className="font-mono text-slate-300">{device.serialNumber}</dd>

                    <dt className="text-slate-400">Emplacement :</dt>
                    <dd className="text-slate-300">{device.location}</dd>

                    <dt className="text-slate-400">VLAN Principal :</dt>
                    <dd className="text-slate-300">{vlan?.name || `VLAN ${device.vlanId}`}</dd>
                  </dl>
                </div>

                <div className="bg-[#121A2A] border border-[#1F2E45] rounded-xl p-4">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
                    Supervision SNMP & Réseau
                  </h3>
                  <dl className="grid grid-cols-2 gap-y-2 text-xs">
                    <dt className="text-slate-400">Statut SNMP :</dt>
                    <dd className="text-white">
                      {device.snmpEnabled ? (
                        <span className="text-emerald-400 font-bold">Actif (SNMP {device.snmpVersion})</span>
                      ) : (
                        <span className="text-slate-500">Désactivé</span>
                      )}
                    </dd>

                    <dt className="text-slate-400">Communauté :</dt>
                    <dd className="font-mono text-slate-300">•••••••• (Chiffrée)</dd>

                    <dt className="text-slate-400">Première Découverte :</dt>
                    <dd className="text-slate-300 font-mono text-[11px]">{device.firstSeen}</dd>

                    <dt className="text-slate-400">Dernier Sondage :</dt>
                    <dd className="text-slate-300 font-mono text-[11px]">{device.lastSeen}</dd>

                    <dt className="text-slate-400">Pertes de paquets :</dt>
                    <dd className="font-mono text-emerald-400">{device.metrics.packetLossPct}%</dd>

                    <dt className="text-slate-400">Notes techniques :</dt>
                    <dd className="text-slate-300 text-[11px] col-span-2 mt-1 bg-[#0A0F1A] p-2 rounded border border-[#1F2E45]">
                      {device.notes || 'Aucune note.'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERFACES */}
          {activeTab === 'interfaces' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Ports & Interfaces Réseau ({device.interfaces.length})
                </h3>
                <span className="text-[11px] text-slate-400">
                  Cliquez sur un port pour modifier son état administratif (UP/DOWN)
                </span>
              </div>

              <div className="overflow-x-auto border border-[#1F2E45] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121A2A] text-slate-400 border-b border-[#1F2E45] font-mono">
                    <tr>
                      <th className="py-2.5 px-3">Port</th>
                      <th className="py-2.5 px-3">Statut Admin</th>
                      <th className="py-2.5 px-3">Vitesse / Duplex</th>
                      <th className="py-2.5 px-3">Trafic In / Out</th>
                      <th className="py-2.5 px-3">Utilisation %</th>
                      <th className="py-2.5 px-3">Erreurs</th>
                      <th className="py-2.5 px-3">VLAN</th>
                      <th className="py-2.5 px-3">Équipement Connecté</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2E45] bg-[#0E1524]">
                    {device.interfaces.map(iface => (
                      <tr key={iface.id} className="hover:bg-[#141E33] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-white">
                          {iface.name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            iface.adminStatus === 'UP'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}>
                            {iface.adminStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 font-mono">
                          {iface.speed} ({iface.duplex})
                        </td>
                        <td className="py-2.5 px-3 font-mono text-cyan-300">
                          ↓ {iface.trafficInMbps} Mbps / ↑ {iface.trafficOutMbps} Mbps
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  iface.trafficUsagePct > 90 ? 'bg-rose-500' :
                                  iface.trafficUsagePct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, iface.trafficUsagePct)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] text-slate-200">
                              {iface.trafficUsagePct}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {iface.errorsIn + iface.errorsOut > 0 ? (
                            <span className="text-amber-400 font-bold">{iface.errorsIn + iface.errorsOut}</span>
                          ) : (
                            '0'
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={iface.vlan}
                            onChange={(e) => changeInterfaceVlan(device.id, iface.id, Number(e.target.value))}
                            className="bg-[#121A2A] border border-[#1F2E45] rounded px-1.5 py-0.5 text-[11px] text-slate-200 focus:outline-none"
                          >
                            {vlans.map(v => (
                              <option key={v.id} value={v.id}>VLAN {v.id}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 text-[11px] font-mono">
                          {iface.connectedDevice || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => toggleInterfacePort(device.id, iface.id)}
                            className={`px-2 py-1 rounded text-[11px] font-bold border transition-all ${
                              iface.adminStatus === 'UP'
                                ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/40'
                                : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {iface.adminStatus === 'UP' ? 'Shutdown (DOWN)' : 'No Shutdown (UP)'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: METRICS */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              {/* Ping Latency Sparkline */}
              <div className="bg-[#121A2A] border border-[#1F2E45] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Historique de Latence ICMP (ms)
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    Moyenne: {device.metrics.latencyMs} ms
                  </span>
                </div>

                <div className="h-28 flex items-end gap-1.5 pt-4 px-2 bg-[#0A0F1A] rounded-lg border border-[#1F2E45]">
                  {(device.metrics.historyLatency || [1, 2, 1, 3, 2, 1, 2, 1, 2, 1]).map((lat, i) => {
                    const heightPct = Math.min(100, Math.max(15, (lat / 10) * 100));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 group-hover:from-cyan-400 group-hover:to-cyan-200 transition-all"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[9px] font-mono text-slate-500">{lat}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CPU & RAM Trends */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#121A2A] border border-[#1F2E45] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-400 uppercase">Utilisation CPU</span>
                    <span className="text-xs font-mono font-bold text-amber-300">{device.metrics.cpuPct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 mb-3">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${device.metrics.cpuPct}%` }}
                    />
                  </div>
                  <div className="h-16 flex items-end gap-1 px-1 bg-[#0A0F1A] rounded border border-[#1F2E45]">
                    {(device.metrics.historyCpu || [20, 25, 30, 28, 25, 22, 24, 26, 25, 24]).map((c, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-amber-500/70 hover:bg-amber-400 rounded-t transition-all"
                        style={{ height: `${c}%` }}
                        title={`${c}%`}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-[#121A2A] border border-[#1F2E45] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase">Mémoire RAM</span>
                    <span className="text-xs font-mono font-bold text-emerald-300">
                      {device.metrics.ramUsedMb} Mo / {device.metrics.ramTotalMb} Mo ({device.metrics.ramPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 mb-3">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${device.metrics.ramPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Mémoire vive allouée stable. Aucune pagination excessive sur disque détectée.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORY & AUDIT */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Journal des Événements & Actions Administratives ({deviceLogs.length})
              </h3>

              {deviceLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-[#121A2A] rounded-xl border border-[#1F2E45]">
                  Aucun incident ni action manuelle enregistrée pour cet équipement.
                </div>
              ) : (
                <div className="divide-y divide-[#1F2E45] border border-[#1F2E45] rounded-xl bg-[#121A2A]">
                  {deviceLogs.map(log => (
                    <div key={log.id} className="p-3 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] text-slate-400">{log.timestamp}</span>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                          log.severity === 'danger' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                          log.severity === 'warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                          'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                        }`}>
                          {log.action}
                        </span>
                      </div>
                      <p className="text-slate-200">{log.details}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Par : {log.user}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
