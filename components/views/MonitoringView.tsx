'use client';

import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Clock,
  HardDrive,
  Radio,
  ArrowDownRight,
  ArrowUpRight,
  Thermometer,
  Layers,
  BarChart2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useKingNMS } from '../../lib/stateStore';
import { Device } from '../../types';

export default function MonitoringView({ onSelectDevice }: { onSelectDevice: (device: Device) => void }) {
  const { devices, selectedSite } = useKingNMS();
  const [activeTab, setActiveTab] = useState<'icmp' | 'snmp_cpu' | 'interfaces' | 'toptalkers'>('icmp');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');

  const filteredDevices = selectedSite === 'all'
    ? devices
    : devices.filter(d => d.siteId === selectedSite);

  // Top talkers: sort by highest interface bandwidth
  const devicesByBandwidth = [...filteredDevices].map(dev => {
    const totalIn = dev.interfaces.reduce((sum, i) => sum + i.trafficInMbps, 0);
    const totalOut = dev.interfaces.reduce((sum, i) => sum + i.trafficOutMbps, 0);
    return {
      device: dev,
      totalTraffic: totalIn + totalOut,
      totalIn,
      totalOut
    };
  }).sort((a, b) => b.totalTraffic - a.totalTraffic);

  // Top CPU consumers
  const devicesByCpu = [...filteredDevices].sort((a, b) => b.metrics.cpuPct - a.metrics.cpuPct);

  // Interfaces with saturation
  const allInterfaces = filteredDevices.flatMap(d =>
    d.interfaces.map(iface => ({
      ...iface,
      parentDevice: d
    }))
  ).sort((a, b) => b.trafficUsagePct - a.trafficUsagePct);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Centre de Métriques Avancées ICMP & SNMP
          </h1>
          <p className="text-xs text-slate-400">
            Analyse haute précision des temps de réponse, charges processeur, mémoires et débits d'interfaces.
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-[#121A2A] border border-[#1F2E45] rounded-xl p-1 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
          {(['1h', '6h', '24h', '7d', '30d'] as const).map(tr => (
            <button
              key={tr}
              onClick={() => setTimeRange(tr)}
              className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                timeRange === tr
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tr}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1F2E45] pb-2">
        <button
          onClick={() => setActiveTab('icmp')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'icmp'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Sondes ICMP (Latence & Pertes)
        </button>
        <button
          onClick={() => setActiveTab('snmp_cpu')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'snmp_cpu'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          SNMP Matériel (CPU, RAM, Température)
        </button>
        <button
          onClick={() => setActiveTab('interfaces')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'interfaces'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Statut & Débits des Interfaces
        </button>
        <button
          onClick={() => setActiveTab('toptalkers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'toptalkers'
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Top Équipements Consommateurs
        </button>
      </div>

      {/* TAB CONTENT 1: ICMP */}
      {activeTab === 'icmp' && (
        <div className="space-y-6">
          <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl p-5 shadow-xl">
            <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-4">
              Matrice de Disponibilité & Latence ICMP ({timeRange})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141E33] text-slate-400 border-b border-[#1F2E45] font-mono">
                  <tr>
                    <th className="py-2.5 px-4">Équipement</th>
                    <th className="py-2.5 px-4">Adresse IP</th>
                    <th className="py-2.5 px-4">Disponibilité %</th>
                    <th className="py-2.5 px-4">Latence Moyenne</th>
                    <th className="py-2.5 px-4">Min / Max</th>
                    <th className="py-2.5 px-4">Packet Loss</th>
                    <th className="py-2.5 px-4">Tendance 24h</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2E45] bg-[#0E1524]">
                  {filteredDevices.map(dev => (
                    <tr
                      key={dev.id}
                      onClick={() => onSelectDevice(dev)}
                      className="hover:bg-[#141E33] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {dev.hostname}
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-300">
                        {dev.ip}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className={`font-bold ${
                          dev.metrics.availabilityPct > 99.5 ? 'text-emerald-400' :
                          dev.metrics.availabilityPct > 95 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {dev.metrics.availabilityPct.toFixed(2)} %
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-200">
                        {dev.status === 'DOWN' ? 'Timeout' : `${dev.metrics.latencyMs} ms`}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {dev.status === 'DOWN' ? '-' : `${dev.metrics.minLatencyMs} / ${dev.metrics.maxLatencyMs} ms`}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className={dev.metrics.packetLossPct > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                          {dev.metrics.packetLossPct} %
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 h-5">
                          {(dev.metrics.historyLatency || [1, 2, 1, 2, 1]).slice(-6).map((lat, i) => (
                            <div
                              key={i}
                              className={`w-2 rounded-t ${dev.status === 'DOWN' ? 'bg-rose-500' : 'bg-cyan-500'}`}
                              style={{ height: `${Math.min(20, Math.max(4, lat * 3))}px` }}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: SNMP CPU & RAM */}
      {activeTab === 'snmp_cpu' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devicesByCpu.map(dev => (
              <div
                key={dev.id}
                onClick={() => onSelectDevice(dev)}
                className="group cursor-pointer bg-[#101828] hover:bg-[#141E33] border border-[#1F2E45] rounded-2xl p-4 transition-all shadow-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-mono font-bold text-white text-xs">{dev.hostname}</h3>
                  <span className="text-[10px] font-mono text-slate-400">{dev.ip}</span>
                </div>

                {/* CPU Progress */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-amber-400" /> CPU
                    </span>
                    <span className={`font-bold ${dev.metrics.cpuPct > 80 ? 'text-rose-400' : 'text-amber-400'}`}>
                      {dev.metrics.cpuPct} %
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        dev.metrics.cpuPct > 80 ? 'bg-rose-500' :
                        dev.metrics.cpuPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${dev.metrics.cpuPct}%` }}
                    />
                  </div>
                </div>

                {/* RAM Progress */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-emerald-400" /> RAM
                    </span>
                    <span className="text-emerald-400 font-bold">{dev.metrics.ramPct} %</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${dev.metrics.ramPct}%` }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 text-right">
                    {dev.metrics.ramUsedMb} / {dev.metrics.ramTotalMb} Mo
                  </div>
                </div>

                {/* Temperature */}
                <div className="flex items-center justify-between pt-2 border-t border-[#1F2E45] text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-rose-400" /> Température
                  </span>
                  <span className={`font-mono font-bold ${
                    dev.metrics.cpuTempC > 70 ? 'text-rose-400 font-black animate-pulse' : 'text-slate-300'
                  }`}>
                    {dev.metrics.cpuTempC} °C
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: INTERFACES */}
      {activeTab === 'interfaces' && (
        <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-[#141E33] border-b border-[#1F2E45] flex items-center justify-between">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Toutes les Interfaces Réseau & Ports Switch Supervisés ({allInterfaces.length})
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Classé par taux d'utilisation décroissant
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121A2A] text-slate-400 border-b border-[#1F2E45] font-mono">
                <tr>
                  <th className="py-2.5 px-4">Équipement Hôte</th>
                  <th className="py-2.5 px-4">Port / Interface</th>
                  <th className="py-2.5 px-4">Statut</th>
                  <th className="py-2.5 px-4">Capacité</th>
                  <th className="py-2.5 px-4">Débit Ingress (↓)</th>
                  <th className="py-2.5 px-4">Débit Egress (↑)</th>
                  <th className="py-2.5 px-4">Utilisation %</th>
                  <th className="py-2.5 px-4">Erreurs / Collisions</th>
                  <th className="py-2.5 px-4">VLAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2E45] bg-[#0E1524]">
                {allInterfaces.map((iface, i) => (
                  <tr
                    key={iface.id || i}
                    onClick={() => onSelectDevice(iface.parentDevice)}
                    className="hover:bg-[#141E33] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {iface.parentDevice.hostname}
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-300">
                      {iface.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        iface.adminStatus === 'UP' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                        'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {iface.adminStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {iface.speed}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200">
                      {iface.trafficInMbps} Mbps
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200">
                      {iface.trafficOutMbps} Mbps
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold ${
                          iface.trafficUsagePct > 90 ? 'text-rose-400' :
                          iface.trafficUsagePct > 70 ? 'text-amber-400' : 'text-slate-300'
                        }`}>
                          {iface.trafficUsagePct}%
                        </span>
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              iface.trafficUsagePct > 90 ? 'bg-rose-500' :
                              iface.trafficUsagePct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, iface.trafficUsagePct)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {iface.errorsIn + iface.errorsOut > 0 ? (
                        <span className="text-amber-400 font-bold">{iface.errorsIn + iface.errorsOut}</span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      VLAN {iface.vlan}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: TOP TALKERS */}
      {activeTab === 'toptalkers' && (
        <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl p-5 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-violet-400 uppercase tracking-wider">
            Top Équipements Consommateurs de Bande Passante (Agrégé In + Out)
          </h2>

          <div className="space-y-3">
            {devicesByBandwidth.map((item, idx) => (
              <div
                key={item.device.id}
                onClick={() => onSelectDevice(item.device)}
                className="p-3 bg-[#141E33] hover:bg-[#18253D] border border-[#1F2E45] rounded-xl flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center justify-center font-mono text-xs font-bold">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-mono font-bold text-white text-xs">{item.device.hostname}</span>
                    <span className="text-[11px] text-slate-400 font-mono ml-2">({item.device.ip})</span>
                    <p className="text-[10px] text-slate-500">{item.device.vendor} - {item.device.model}</p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-violet-300">
                    {item.totalTraffic.toFixed(1)} Mbps
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ↓ {item.totalIn.toFixed(1)} Mbps / ↑ {item.totalOut.toFixed(1)} Mbps
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
