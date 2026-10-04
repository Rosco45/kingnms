'use client';

import React from 'react';
import {
  LayoutDashboard,
  Server,
  Network,
  Radar,
  Activity,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  Layers,
  FileText,
  FileCheck2,
  Settings,
  Cpu,
  Radio
} from 'lucide-react';
import { useKingNMS } from '../lib/stateStore';

export type ActiveTab =
  | 'dashboard'
  | 'devices'
  | 'topology'
  | 'discovery'
  | 'monitoring'
  | 'alerts'
  | 'new_devices'
  | 'control'
  | 'vlans'
  | 'audit'
  | 'reports'
  | 'config';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed
}: SidebarProps) {
  const { devices, alerts, newDevices, probes } = useKingNMS();

  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;
  const pendingNewCount = newDevices.filter(nd => nd.status === 'pending').length;
  const downDevicesCount = devices.filter(d => d.status === 'DOWN').length;
  const activeProbesCount = probes.filter(p => p.status === 'active').length;

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'devices' as ActiveTab,
      label: 'Équipements',
      icon: Server,
      badge: downDevicesCount > 0 ? { text: `${downDevicesCount} DOWN`, color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' } : { text: `${devices.length}`, color: 'bg-slate-800 text-slate-300 border-slate-700' }
    },
    {
      id: 'topology' as ActiveTab,
      label: 'Topologie Réseau',
      icon: Network,
      badge: null
    },
    {
      id: 'discovery' as ActiveTab,
      label: 'Découverte Réseau',
      icon: Radar,
      badge: null
    },
    {
      id: 'monitoring' as ActiveTab,
      label: 'Monitoring Dédié',
      icon: Activity,
      badge: { text: 'ICMP/SNMP', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' }
    },
    {
      id: 'alerts' as ActiveTab,
      label: 'Alertes & Moteur',
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? { text: `${activeAlertsCount}`, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' } : null
    },
    {
      id: 'new_devices' as ActiveTab,
      label: 'Nouveaux Équipements',
      icon: Sparkles,
      badge: pendingNewCount > 0 ? { text: `${pendingNewCount} NOUVEAU`, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse' } : null
    },
    {
      id: 'control' as ActiveTab,
      label: 'Contrôle Réseau',
      icon: ShieldAlert,
      badge: { text: 'Ports/ACL', color: 'bg-violet-500/10 text-violet-400 border-violet-500/30' }
    },
    {
      id: 'vlans' as ActiveTab,
      label: 'Gestion VLAN',
      icon: Layers,
      badge: null
    },
    {
      id: 'audit' as ActiveTab,
      label: 'Journal & Audit',
      icon: FileText,
      badge: null
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Rapports & Exports',
      icon: FileCheck2,
      badge: { text: 'PDF/CSV', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
    },
    {
      id: 'config' as ActiveTab,
      label: 'Configuration',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside
      className={`relative flex flex-col bg-[#0E1422] border-r border-[#1F2E45] transition-all duration-300 z-30 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Navigation Links */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto no-scrollbar">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {!isCollapsed && 'Supervision & Exploitation'}
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-amber-300 border-l-2 border-amber-500 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151D2E]'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-amber-400' : 'text-slate-400'
                }`}
              />

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${item.badge.color}`}
                    >
                      {item.badge.text}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Probe Engine Card */}
      <div className="p-3 border-t border-[#1F2E45] bg-[#0A0F1A]">
        {!isCollapsed ? (
          <div className="rounded-xl bg-[#121A2A] border border-[#1F2E45] p-2.5 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-slate-200">Sondes Réseau</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {activeProbesCount}/{probes.length} En Ligne
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${(activeProbesCount / probes.length) * 100}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-400 mt-1 font-mono">
              Orchestrateur KingProbe Actif
            </p>
          </div>
        ) : (
          <div className="flex justify-center" title="Sondes Réseau Opérationnelles">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
        )}

        {/* Toggle Collapse */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-2 w-full py-1 text-center text-[10px] text-slate-400 hover:text-slate-300 font-mono"
        >
          {isCollapsed ? '➡️' : '⬅️ Réduire menu'}
        </button>
      </div>
    </aside>
  );
}
