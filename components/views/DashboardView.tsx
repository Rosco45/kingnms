'use client';

import React from 'react';
import {
  Server,
  Activity,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  Clock,
  Radio,
  Radar,
  ShieldAlert,
  HardDrive,
  Layers,
  ArrowRight,
  Play
} from 'lucide-react';
import { useKingNMS } from '../../lib/stateStore';
import { Device } from '../../types';

interface DashboardViewProps {
  onSelectDevice: (device: Device) => void;
  onNavigate: (tab: any) => void;
  onOpenScan: () => void;
  onOpenAddDevice: () => void;
}

export default function DashboardView({
  onSelectDevice,
  onNavigate,
  onOpenScan,
  onOpenAddDevice
}: DashboardViewProps) {
  const {
    devices,
    alerts,
    newDevices,
    vlans,
    sites,
    selectedSite,
    lastPollTime,
    isLivePolling
  } = useKingNMS();

  // Filter by selected site if not all
  const filteredDevices = selectedSite === 'all'
    ? devices
    : devices.filter(d => d.siteId === selectedSite);

  const onlineDevices = filteredDevices.filter(d => d.status === 'UP');
  const offlineDevices = filteredDevices.filter(d => d.status === 'DOWN');
  const warningDevices = filteredDevices.filter(d => d.status === 'WARNING');
  const activeAlerts = alerts.filter(a => a.status === 'active');
  const pendingNew = newDevices.filter(nd => nd.status === 'pending');

  // Calculate totals
  const totalInTraffic = filteredDevices.reduce((acc, dev) => {
    return acc + dev.interfaces.reduce((iacc, iface) => iacc + iface.trafficInMbps, 0);
  }, 0);

  const totalOutTraffic = filteredDevices.reduce((acc, dev) => {
    return acc + dev.interfaces.reduce((iacc, iface) => iacc + iface.trafficOutMbps, 0);
  }, 0);

  const avgCpu = filteredDevices.length
    ? Math.round(filteredDevices.reduce((acc, d) => acc + d.metrics.cpuPct, 0) / filteredDevices.length)
    : 0;

  const avgAvailability = filteredDevices.length
    ? (filteredDevices.reduce((acc, d) => acc + d.metrics.availabilityPct, 0) / filteredDevices.length).toFixed(2)
    : '100.00';

  const avgLatency = filteredDevices.filter(d => d.status !== 'DOWN').length
    ? (
        filteredDevices
          .filter(d => d.status !== 'DOWN')
          .reduce((acc, d) => acc + d.metrics.latencyMs, 0) /
        filteredDevices.filter(d => d.status !== 'DOWN').length
      ).toFixed(1)
    : '0.0';

  // Find top utilized interfaces across devices
  const allInterfaces = filteredDevices.flatMap(d =>
    d.interfaces.map(iface => ({
      ...iface,
      deviceName: d.hostname,
      deviceId: d.id,
      parentDevice: d
    }))
  );
  const topInterfaces = [...allInterfaces]
    .sort((a, b) => b.trafficUsagePct - a.trafficUsagePct)
    .slice(0, 5);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 5 Questions Prompt Header Banner */}
      <div className="bg-gradient-to-r from-[#141F33] via-[#101827] to-[#141F33] border border-[#1F2E45] rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
                KingNMS — Centre d’Opérations Réseau (NOC)
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Sondes Temps Réel {isLivePolling ? 'Actives' : 'Pause'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Surveillance continue ICMP / SNMP &middot; Réponse aux 5 questions vitales : Présence, Disponibilité, Activité, Anomalies & Remédiation.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={onOpenScan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all"
            >
              <Radar className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              Scanner Réseau
            </button>
            <button
              onClick={() => onNavigate('topology')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              Topologie Carte
            </button>
            <button
              onClick={onOpenAddDevice}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold shadow-glow-gold transition-all"
            >
              + Nouvel Équipement
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Summary Card (as requested in prompt section 4) */}
      <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1F2E45]/80">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
              SYNTHÈSE DU PARC RÉSEAU & DISPONIBILITÉ
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Dernière sonde : <strong className="text-slate-200">{lastPollTime}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Online */}
          <div
            onClick={() => onNavigate('devices')}
            className="group cursor-pointer bg-[#141E33] hover:bg-[#18253D] border border-emerald-500/30 rounded-xl p-4 transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Opérationnels</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-glow-emerald" />
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
              {onlineDevices.length}
            </div>
            <div className="text-[11px] text-emerald-300/80 font-medium flex items-center justify-between mt-1">
              <span>🟢 Online (ICMP OK)</span>
              <span className="text-[10px] font-mono">{( (onlineDevices.length / (filteredDevices.length || 1)) * 100 ).toFixed(0)}%</span>
            </div>
          </div>

          {/* Offline */}
          <div
            onClick={() => onNavigate('devices')}
            className={`group cursor-pointer bg-[#141E33] hover:bg-[#18253D] border rounded-xl p-4 transition-all hover:scale-[1.01] ${
              offlineDevices.length > 0 ? 'border-rose-500/50 shadow-glow-rose' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Hors Ligne</span>
              <span className={`w-2.5 h-2.5 rounded-full ${offlineDevices.length > 0 ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`} />
            </div>
            <div className="text-3xl font-black text-rose-400 font-mono mt-1">
              {offlineDevices.length}
            </div>
            <div className="text-[11px] text-rose-300/80 font-medium flex items-center justify-between mt-1">
              <span>🔴 Offline (Non joignable)</span>
              {offlineDevices.length > 0 && <span className="text-[10px] font-bold text-rose-400">URGENT</span>}
            </div>
          </div>

          {/* Active Alerts */}
          <div
            onClick={() => onNavigate('alerts')}
            className="group cursor-pointer bg-[#141E33] hover:bg-[#18253D] border border-amber-500/30 rounded-xl p-4 transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Alertes Actives</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-400 font-mono mt-1">
              {activeAlerts.length}
            </div>
            <div className="text-[11px] text-amber-300/80 font-medium flex items-center justify-between mt-1">
              <span>⚠️ Seuils / Dérives</span>
              <span className="text-[10px] font-mono text-amber-400">Moteur actif</span>
            </div>
          </div>

          {/* New Devices */}
          <div
            onClick={() => onNavigate('new_devices')}
            className="group cursor-pointer bg-[#141E33] hover:bg-[#18253D] border border-cyan-500/30 rounded-xl p-4 transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Nouveaux Détectés</span>
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div className="text-3xl font-black text-cyan-400 font-mono mt-1">
              {pendingNew.length}
            </div>
            <div className="text-[11px] text-cyan-300/80 font-medium flex items-center justify-between mt-1">
              <span>🆕 Triage & Sécurité</span>
              {pendingNew.length > 0 && <span className="text-[10px] font-bold text-cyan-400">À Valider</span>}
            </div>
          </div>
        </div>

        {/* Global KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#1F2E45]/80 text-xs">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[11px] text-slate-400">Disponibilité Globale</p>
              <p className="text-sm font-bold text-emerald-400 font-mono">{avgAvailability} %</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-cyan-400" />
            <div>
              <p className="text-[11px] text-slate-400">Latence Moyenne RTT</p>
              <p className="text-sm font-bold text-cyan-400 font-mono">{avgLatency} ms</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ArrowDownRight className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[11px] text-slate-400">Trafic Réseau Actuel</p>
              <p className="text-sm font-bold text-slate-200 font-mono">
                ↓ {totalInTraffic.toFixed(0)} / ↑ {totalOutTraffic.toFixed(0)} Mbps
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Cpu className="w-4 h-4 text-violet-400" />
            <div>
              <p className="text-[11px] text-slate-400">Charge CPU Moyenne</p>
              <p className="text-sm font-bold text-violet-300 font-mono">{avgCpu} %</p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Network Traffic Timeseries & Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Throughput Chart */}
        <div className="lg:col-span-2 bg-[#101828] border border-[#1F2E45] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Débit Réseau Global en Temps Réel (Bande Passante)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" /> Ingress (↓ {totalInTraffic.toFixed(0)} Mbps)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Egress (↑ {totalOutTraffic.toFixed(0)} Mbps)
              </span>
            </div>
          </div>

          {/* SVG Animated Smooth Wave Graph */}
          <div className="h-56 w-full bg-[#0A0F1A] rounded-xl border border-[#1F2E45] p-3 flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between text-[10px] font-mono text-slate-500 border-b border-[#1F2E45]/40 pb-1">
              <span>Max: 1200 Mbps</span>
              <span>Liaisons Trunks 10GbE & 1GbE</span>
            </div>

            {/* Smooth SVG Curves */}
            <svg className="w-full h-40 overflow-visible" viewBox="0 0 600 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="#1F2E45" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="600" y2="80" stroke="#1F2E45" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="600" y2="120" stroke="#1F2E45" strokeDasharray="3 3" />

              {/* Ingress Curve */}
              <path
                d="M0,130 Q50,70 100,90 T200,60 T300,45 T400,85 T500,50 T600,40 L600,160 L0,160 Z"
                fill="url(#cyanGrad)"
              />
              <path
                d="M0,130 Q50,70 100,90 T200,60 T300,45 T400,85 T500,50 T600,40"
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2.5"
              />

              {/* Egress Curve */}
              <path
                d="M0,145 Q60,110 120,115 T240,95 T360,80 T480,105 T600,75 L600,160 L0,160 Z"
                fill="url(#amberGrad)"
              />
              <path
                d="M0,145 Q60,110 120,115 T240,95 T360,80 T480,105 T600,75"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
              />
            </svg>

            <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-[#1F2E45]/40">
              <span>-30 min</span>
              <span>-20 min</span>
              <span>-10 min</span>
              <span>-5 min</span>
              <span className="text-cyan-400 font-bold">Maintenant (Live)</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Alert Stream */}
        <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1F2E45]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Flux d'Alertes Réseau
              </h3>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              Gérer <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-72">
            {activeAlerts.slice(0, 4).map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border transition-all text-xs ${
                  alert.severity === 'critical' ? 'bg-rose-950/20 border-rose-500/40' :
                  alert.severity === 'high' ? 'bg-amber-950/20 border-amber-500/40' :
                  alert.severity === 'warning' ? 'bg-yellow-950/20 border-yellow-500/40' :
                  'bg-[#141E33] border-[#1F2E45]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-white font-mono">{alert.deviceName}</span>
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                    alert.severity === 'critical' ? 'bg-rose-500/30 text-rose-300 border-rose-500/50 animate-pulse' :
                    alert.severity === 'high' ? 'bg-amber-500/30 text-amber-300 border-amber-500/50' :
                    'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">{alert.title}</p>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-mono">
                  <span>{alert.deviceIp}</span>
                  <span>{alert.timestamp.split(' ')[1]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Utilized Interfaces & High-Alert Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Utilized Ports */}
        <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1F2E45]">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Top 5 Ports Switch & Interfaces les plus chargées
              </h3>
            </div>
            <button
              onClick={() => onNavigate('control')}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
            >
              Matrice des Ports &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {topInterfaces.map((iface, idx) => (
              <div
                key={iface.id || idx}
                onClick={() => onSelectDevice(iface.parentDevice)}
                className="group cursor-pointer p-2.5 rounded-xl bg-[#141E33] hover:bg-[#18253D] border border-[#1F2E45] transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs font-mono">{iface.deviceName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({iface.name})</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Vitesse: {iface.speed} &middot; VLAN {iface.vlan} &middot; Raccordé: {iface.connectedDevice || 'Équipement'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-black ${
                      iface.trafficUsagePct > 90 ? 'text-rose-400' :
                      iface.trafficUsagePct > 70 ? 'text-amber-400' : 'text-emerald-400'
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
                  <span className="text-[10px] font-mono text-cyan-400">
                    ↓ {iface.trafficInMbps} / ↑ {iface.trafficOutMbps} Mbps
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Devices Grid */}
        <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1F2E45]">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Équipements Nécessitant une Attention Immédiate
              </h3>
            </div>
            <button
              onClick={() => onNavigate('devices')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Tous les équipements ({devices.length}) &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredDevices
              .filter(d => d.status === 'DOWN' || d.status === 'WARNING' || d.isBlocked)
              .slice(0, 4)
              .map(dev => (
                <div
                  key={dev.id}
                  onClick={() => onSelectDevice(dev)}
                  className="group cursor-pointer p-3 rounded-xl bg-[#141E33] hover:bg-[#18253D] border border-[#1F2E45] transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${
                      dev.status === 'DOWN' ? 'bg-rose-500 animate-ping' :
                      dev.status === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs font-mono">{dev.hostname}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({dev.ip})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">{dev.notes || dev.model}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400 font-bold">
                      {dev.metrics.latencyMs} ms
                    </span>
                    <button className="p-1 rounded bg-slate-800 group-hover:bg-amber-500 group-hover:text-black text-slate-400 transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

            {filteredDevices.filter(d => d.status === 'DOWN' || d.status === 'WARNING').length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aucune anomalie critique en cours sur ce périmètre.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
