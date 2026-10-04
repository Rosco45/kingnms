'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Server,
  Layers,
  Power,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  SlidersHorizontal,
  HardDrive
} from 'lucide-react';
import { useKingNMS } from '../../lib/stateStore';
import { Device, DeviceInterface } from '../../types';

export default function NetworkControlView() {
  const {
    devices,
    toggleInterfacePort,
    changeInterfaceVlan,
    unblockDevice,
    vlans
  } = useKingNMS();

  // Find all switches
  const switches = devices.filter(d => d.type === 'switch');
  const [selectedSwitchId, setSelectedSwitchId] = useState<string>(switches[0]?.id || '');
  const [activePort, setActivePort] = useState<DeviceInterface | null>(null);

  const selectedSwitch = switches.find(s => s.id === selectedSwitchId) || switches[0];
  const blockedDevices = devices.filter(d => d.isBlocked);

  const handlePortClick = (iface: DeviceInterface) => {
    setActivePort(iface);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-violet-400" />
            Contrôle Réseau & Matrice des Ports Commutateurs
          </h1>
          <p className="text-xs text-slate-400">
            Désactivation administrative de ports switch (SNMP / SSH Shutdown), isolement VLAN et levée de quarantaine.
          </p>
        </div>

        {/* Switch Selector */}
        <div className="flex items-center gap-2 bg-[#121A2A] border border-[#1F2E45] rounded-xl px-3 py-1.5 text-xs">
          <Server className="w-4 h-4 text-amber-400" />
          <span className="text-slate-400 font-semibold">Commutateur cible :</span>
          <select
            value={selectedSwitchId}
            onChange={(e) => {
              setSelectedSwitchId(e.target.value);
              setActivePort(null);
            }}
            className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
          >
            {switches.map(sw => (
              <option key={sw.id} value={sw.id} className="bg-[#121A2A]">
                {sw.hostname} ({sw.ip}) - {sw.model}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Switch Faceplate Panel */}
      {selectedSwitch && (
        <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl p-5 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#1F2E45]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-glow-emerald" />
                <h2 className="text-sm font-black text-white font-mono">
                  {selectedSwitch.hostname} &middot; {selectedSwitch.model}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {selectedSwitch.interfaces.length} Ports Supervisés
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Emplacement : {selectedSwitch.location} &middot; IP : {selectedSwitch.ip}
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-emerald-400" /> Port UP
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-rose-500" /> Shutdown (DOWN)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-amber-400" /> &gt;80% Trafic
              </span>
            </div>
          </div>

          {/* Visual Matrix of RJ45 / SFP Ports */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Panneau de Brassage Virtuel (Cliquez sur un port pour le contrôler) :
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 bg-[#0A0F1A] p-4 rounded-xl border border-[#1F2E45]">
              {selectedSwitch.interfaces.map(iface => {
                const isSelected = activePort?.id === iface.id;
                const isDown = iface.adminStatus === 'DOWN' || iface.operStatus === 'DOWN';
                const isSaturated = iface.trafficUsagePct > 80;

                return (
                  <button
                    key={iface.id}
                    onClick={() => handlePortClick(iface)}
                    className={`p-2.5 rounded-xl border transition-all flex flex-col items-center justify-between gap-1 text-center relative group ${
                      isSelected
                        ? 'border-amber-400 bg-[#192438] ring-2 ring-amber-400/40'
                        : isDown
                        ? 'border-rose-900/60 bg-[#161017] hover:border-rose-500'
                        : isSaturated
                        ? 'border-amber-500/60 bg-[#1E1A14] hover:border-amber-400'
                        : 'border-[#1F2E45] bg-[#121A2A] hover:border-slate-500'
                    }`}
                  >
                    {/* LED indicator */}
                    <div className="w-full flex items-center justify-between px-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isDown ? 'bg-rose-500' :
                        isSaturated ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                      }`} />
                      <span className="text-[8px] font-mono text-slate-500 font-bold">VLAN {iface.vlan}</span>
                    </div>

                    {/* Jack Graphic */}
                    <div className="w-8 h-6 rounded bg-[#080C14] border border-slate-700 flex items-center justify-center font-mono text-[9px] font-bold text-slate-300">
                      {iface.name.split('/').pop() || '1'}
                    </div>

                    <span className="text-[10px] font-mono font-bold text-slate-200 truncate w-full">
                      {iface.name.replace('GigabitEthernet', 'Gi').replace('TenGigabitEthernet', 'Te')}
                    </span>

                    <span className="text-[9px] font-mono text-cyan-400">
                      {iface.trafficUsagePct}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Port Diagnostic & Control Drawer */}
          {activePort && (
            <div className="bg-[#141E33] border border-amber-500/40 rounded-xl p-4 animate-fadeIn space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1F2E45]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white font-mono">{activePort.name}</h3>
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${
                        activePort.adminStatus === 'UP'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        Admin: {activePort.adminStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      Vitesse: {activePort.speed} &middot; Duplex: {activePort.duplex} &middot; Trafic: {activePort.trafficUsagePct}% ({activePort.trafficInMbps} Mbps In)
                    </p>
                  </div>
                </div>

                {/* Port Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      toggleInterfacePort(selectedSwitch.id, activePort.id);
                      setActivePort(prev => prev ? {
                        ...prev,
                        adminStatus: prev.adminStatus === 'UP' ? 'DOWN' : 'UP',
                        operStatus: prev.adminStatus === 'UP' ? 'DOWN' : 'UP'
                      } : null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs border transition-all ${
                      activePort.adminStatus === 'UP'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-glow-rose'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-glow-emerald'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {activePort.adminStatus === 'UP' ? 'Désactiver le port (SHUTDOWN)' : 'Activer le port (NO SHUTDOWN)'}
                  </button>
                </div>
              </div>

              {/* Connected Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-[#0E1524] border border-[#1F2E45]">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Équipement Raccordé</span>
                  <span className="font-mono font-bold text-white text-xs">{activePort.connectedDevice || 'Non résolu'}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0E1524] border border-[#1F2E45]">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Adresse MAC Apprise</span>
                  <span className="font-mono text-cyan-300 text-xs">{activePort.connectedMac || '00:1E:13:XX:XX:XX'}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0E1524] border border-[#1F2E45] flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Affectation VLAN</span>
                    <span className="font-mono font-bold text-amber-400 text-xs">VLAN {activePort.vlan}</span>
                  </div>
                  <select
                    value={activePort.vlan}
                    onChange={(e) => {
                      const newV = Number(e.target.value);
                      changeInterfaceVlan(selectedSwitch.id, activePort.id, newV);
                      setActivePort(prev => prev ? { ...prev, vlan: newV } : null);
                    }}
                    className="bg-[#121A2A] border border-[#1F2E45] rounded px-2 py-1 text-xs text-white"
                  >
                    {vlans.map(v => (
                      <option key={v.id} value={v.id}>VLAN {v.id}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quarantined & Blocked Devices Section */}
      <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1F2E45]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Équipements Placés en Quarantaine / Bloqués ({blockedDevices.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Filtrage MAC et Port Security actifs
          </span>
        </div>

        {blockedDevices.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            Aucun équipement actuellement bloqué sur le réseau.
          </div>
        ) : (
          <div className="divide-y divide-[#1F2E45] border border-[#1F2E45] rounded-xl overflow-hidden">
            {blockedDevices.map(dev => (
              <div key={dev.id} className="p-4 bg-[#14121A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">{dev.hostname}</span>
                    <span className="text-xs font-mono text-rose-400 font-bold">({dev.ip})</span>
                    <span className="text-xs font-mono text-slate-400">[{dev.mac}]</span>
                  </div>
                  <p className="text-xs text-rose-300 mt-1">
                    Motif : {dev.blockReason || 'Non spécifié'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Bloqué le : {dev.blockedAt || '2026-10-04 23:45'}
                  </p>
                </div>

                <button
                  onClick={() => unblockDevice(dev.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all self-end sm:self-center"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Débloquer & Rétablir Ports
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
