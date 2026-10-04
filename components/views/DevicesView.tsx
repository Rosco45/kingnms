'use client';

import React, { useState } from 'react';
import {
  Server,
  Search,
  Radio,
  PlusCircle,
  Activity,
  Cpu,
  Clock,
  ShieldAlert,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  LayoutGrid,
  List
} from 'lucide-react';
import { Device, DeviceType, DeviceStatus } from '../../types';
import { useKingNMS } from '../../lib/stateStore';

interface DevicesViewProps {
  onSelectDevice: (device: Device) => void;
  onOpenAddDevice: () => void;
  onOpenBlockModal: (device: Device) => void;
}

export default function DevicesView({
  onSelectDevice,
  onOpenAddDevice,
  onOpenBlockModal
}: DevicesViewProps) {
  const {
    devices,
    selectedSite,
    vlans,
    searchQuery,
    setSearchQuery,
    executePing
  } = useKingNMS();

  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedVlanFilter, setSelectedVlanFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [pingingIp, setPingingIp] = useState<string | null>(null);
  const [pingToast, setPingToast] = useState<{ ip: string; msg: string; success: boolean } | null>(null);

  const typeTabs: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'Tous', count: devices.length },
    { id: 'router', label: 'Routeurs', count: devices.filter(d => d.type === 'router').length },
    { id: 'switch', label: 'Switches', count: devices.filter(d => d.type === 'switch').length },
    { id: 'server', label: 'Serveurs', count: devices.filter(d => d.type === 'server').length },
    { id: 'pc', label: 'Postes / PC', count: devices.filter(d => d.type === 'pc').length },
    { id: 'ap', label: 'Bornes Wi-Fi', count: devices.filter(d => d.type === 'ap').length },
    { id: 'camera', label: 'Caméras IP', count: devices.filter(d => d.type === 'camera').length },
    { id: 'phone', label: 'Téléphones ToIP', count: devices.filter(d => d.type === 'phone').length },
    { id: 'printer', label: 'Imprimantes', count: devices.filter(d => d.type === 'printer').length },
    { id: 'iot', label: 'IoT & Sondes', count: devices.filter(d => d.type === 'iot').length },
    { id: 'unknown', label: 'Inconnus', count: devices.filter(d => d.type === 'unknown').length }
  ];

  // Filtering
  const filtered = devices.filter(dev => {
    if (selectedSite !== 'all' && dev.siteId !== selectedSite) return false;
    if (selectedType !== 'all' && dev.type !== selectedType) return false;
    if (selectedStatus !== 'all' && dev.status !== selectedStatus) return false;
    if (selectedVlanFilter !== 'all' && dev.vlanId !== Number(selectedVlanFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        dev.hostname.toLowerCase().includes(q) ||
        dev.ip.toLowerCase().includes(q) ||
        dev.mac.toLowerCase().includes(q) ||
        dev.vendor.toLowerCase().includes(q) ||
        dev.model.toLowerCase().includes(q) ||
        dev.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleQuickPing = async (dev: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    setPingingIp(dev.ip);
    setPingToast(null);
    try {
      const res = await executePing(dev.ip);
      setPingToast({
        ip: dev.ip,
        msg: `ICMP Ping vers ${dev.ip} (${dev.hostname}) : ${res.latencyMs}ms - Pertes: ${res.packetLoss}%`,
        success: res.success
      });
    } catch {
      setPingToast({
        ip: dev.ip,
        msg: `Échec du ping ICMP vers ${dev.ip}`,
        success: false
      });
    } finally {
      setPingingIp(null);
      setTimeout(() => setPingToast(null), 5000);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Ping Notification */}
      {pingToast && (
        <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between shadow-xl transition-all animate-bounce ${
          pingToast.success
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
            : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {pingToast.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
            <span>{pingToast.msg}</span>
          </div>
          <button onClick={() => setPingToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-amber-400" />
            Inventaire des Équipements Réseau ({filtered.length} / {devices.length})
          </h1>
          <p className="text-xs text-slate-400">
            Suivi en direct de la disponibilité ICMP, des métriques SNMP et du statut des interfaces.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View mode toggle */}
          <div className="flex items-center bg-[#121A2A] border border-[#1F2E45] rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
              title="Vue Tableau compact"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
              title="Vue Cartes"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenAddDevice}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-glow-gold transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Ajouter un Équipement
          </button>
        </div>
      </div>

      {/* Filter Tabs by Equipment Category */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar border-b border-[#1F2E45]">
        {typeTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedType === tab.id
                ? 'bg-amber-500 text-black font-bold shadow-sm'
                : 'bg-[#121A2A] text-slate-300 hover:bg-[#1A2538] border border-[#1F2E45]'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedType === tab.id ? 'bg-black/20 text-black font-bold' : 'bg-[#1E293B] text-slate-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Sub-Filters: Status & VLAN */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#101828] border border-[#1F2E45] rounded-xl p-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Statut :</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#121A2A] border border-[#1F2E45] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
            >
              <option value="all">Tous les états</option>
              <option value="UP">🟢 Opérationnels (UP)</option>
              <option value="DOWN">🔴 Hors Ligne (DOWN)</option>
              <option value="WARNING">🟠 En Anomalie (WARNING)</option>
            </select>
          </div>

          {/* VLAN filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>VLAN :</span>
            <select
              value={selectedVlanFilter}
              onChange={(e) => setSelectedVlanFilter(e.target.value)}
              className="bg-[#121A2A] border border-[#1F2E45] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
            >
              <option value="all">Tous les VLANs</option>
              {vlans.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filtrer dans la liste..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* VIEW: TABLE */}
      {viewMode === 'table' ? (
        <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141E33] text-slate-400 border-b border-[#1F2E45] font-mono">
                <tr>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Nom / Hostname</th>
                  <th className="py-3 px-4">Adresse IP</th>
                  <th className="py-3 px-4">Adresse MAC</th>
                  <th className="py-3 px-4">Type & Modèle</th>
                  <th className="py-3 px-4">Latence ICMP</th>
                  <th className="py-3 px-4">Charge CPU</th>
                  <th className="py-3 px-4">VLAN</th>
                  <th className="py-3 px-4">Disponibilité</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2E45] bg-[#0E1524]">
                {filtered.map(dev => (
                  <tr
                    key={dev.id}
                    onClick={() => onSelectDevice(dev)}
                    className="hover:bg-[#141E33] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 w-fit ${
                        dev.status === 'UP' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                        dev.status === 'DOWN' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' :
                        'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          dev.status === 'UP' ? 'bg-emerald-400' :
                          dev.status === 'DOWN' ? 'bg-rose-400' : 'bg-amber-400'
                        }`} />
                        {dev.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-white group-hover:text-amber-400 transition-colors">
                      <div className="flex items-center gap-2">
                        <span>{dev.hostname}</span>
                        {dev.isBlocked && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-700">
                            Bloqué
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-cyan-300 font-semibold">
                      {dev.ip}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400">
                      {dev.mac}
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-slate-200 capitalize">{dev.type}</span>
                        <p className="text-[10px] text-slate-500 truncate max-w-[160px]">{dev.vendor} - {dev.model}</p>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {dev.status === 'DOWN' ? (
                        <span className="text-rose-400 font-bold">Timeout</span>
                      ) : (
                        <span className="text-cyan-400 font-bold">{dev.metrics.latencyMs} ms</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold ${
                          dev.metrics.cpuPct > 80 ? 'text-rose-400' :
                          dev.metrics.cpuPct > 60 ? 'text-amber-400' : 'text-slate-300'
                        }`}>
                          {dev.metrics.cpuPct}%
                        </span>
                        <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              dev.metrics.cpuPct > 80 ? 'bg-rose-500' :
                              dev.metrics.cpuPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${dev.metrics.cpuPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      VLAN {dev.vlanId}
                    </td>

                    <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                      {dev.metrics.availabilityPct.toFixed(2)}%
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleQuickPing(dev, e)}
                          disabled={pingingIp === dev.ip}
                          className="p-1.5 rounded-lg bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 transition-colors"
                          title="Sonde Ping ICMP"
                        >
                          <Radio className={`w-3.5 h-3.5 ${pingingIp === dev.ip ? 'animate-spin' : ''}`} />
                        </button>

                        {!dev.isBlocked && (
                          <button
                            onClick={() => onOpenBlockModal(dev)}
                            className="p-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/30 transition-colors"
                            title="Bloquer l'équipement"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onSelectDevice(dev)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-black text-slate-300 transition-colors"
                          title="Voir la fiche détaillée"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW: GRID CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(dev => (
            <div
              key={dev.id}
              onClick={() => onSelectDevice(dev)}
              className="group cursor-pointer bg-[#101828] hover:bg-[#141E33] border border-[#1F2E45] hover:border-amber-500/40 rounded-2xl p-4 transition-all hover:scale-[1.01] shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                    dev.status === 'UP' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                    dev.status === 'DOWN' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' :
                    'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      dev.status === 'UP' ? 'bg-emerald-400' :
                      dev.status === 'DOWN' ? 'bg-rose-400' : 'bg-amber-400'
                    }`} />
                    {dev.status}
                  </span>

                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                    {dev.type}
                  </span>
                </div>

                <h3 className="text-sm font-black text-white font-mono group-hover:text-amber-400 transition-colors">
                  {dev.hostname}
                </h3>
                <p className="text-xs font-mono text-cyan-400">{dev.ip}</p>
                <p className="text-[11px] text-slate-400 mt-1">{dev.vendor} - {dev.model}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1F2E45] grid grid-cols-3 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block text-[9px]">RTT</span>
                  <span className="text-cyan-400 font-bold">{dev.metrics.latencyMs} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">CPU</span>
                  <span className="text-amber-400 font-bold">{dev.metrics.cpuPct} %</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">DISPO</span>
                  <span className="text-emerald-400 font-bold">{dev.metrics.availabilityPct.toFixed(1)} %</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#1F2E45]/60 text-xs">
                <span className="text-[10px] text-slate-500 font-mono">VLAN {dev.vlanId}</span>
                <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                  Fiche &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
