'use client';

import React, { useState } from 'react';
import {
  Crown,
  Search,
  Bell,
  Shield,
  Activity,
  PlusCircle,
  Radar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { useKingNMS } from '../lib/stateStore';
import { UserRole } from '../types';

interface NavbarProps {
  onOpenAddDevice: () => void;
  onOpenScan: () => void;
}

export default function Navbar({ onOpenAddDevice, onOpenScan }: NavbarProps) {
  const {
    sites,
    selectedSite,
    setSelectedSite,
    alerts,
    searchQuery,
    setSearchQuery,
    currentUser,
    setUserRole,
    isLivePolling,
    setIsLivePolling,
    lastPollTime
  } = useKingNMS();

  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    superadmin: { label: 'Super Admin', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    netadmin: { label: 'Admin Réseau', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
    supervisor: { label: 'Superviseur', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    viewer: { label: 'Observateur (RO)', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F17]/95 backdrop-blur-md border-b border-[#1F2E45] px-4 lg:px-6 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-glow-gold border border-amber-300/40 text-black font-black">
            <Crown className="w-6 h-6 text-black fill-current stroke-[2.2]" />
            <span className="absolute -bottom-1 -right-1 text-[9px] font-extrabold px-1 bg-black text-amber-400 border border-amber-500/40 rounded">
              NMS
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
                KING NMS
              </span>
              <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PRO PLATFORM
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-tight font-medium hidden md:block">
              Network Monitoring & Management Platform
            </p>
          </div>
        </div>

        {/* Multi-Site Selector */}
        <div className="hidden lg:flex items-center gap-2 bg-[#121A2A] border border-[#1F2E45] rounded-lg px-2.5 py-1">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-slate-400 font-medium">Site :</span>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer pr-2"
          >
            <option value="all" className="bg-[#121A2A] text-slate-200">Tous les Sites (Global)</option>
            {sites.map(s => (
              <option key={s.id} value={s.id} className="bg-[#121A2A] text-slate-200">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher équipement (IP, Nom, MAC, Fabricant, VLAN)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Controls & Quick Actions */}
        <div className="flex items-center gap-2.5">
          {/* Real-time Poller Status */}
          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            title={isLivePolling ? 'Surveillance continue active (cliquer pour pause)' : 'Surveillance en pause (cliquer pour reprendre)'}
            className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
              isLivePolling
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLivePolling ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className="hidden xl:inline">{isLivePolling ? 'ICMP/SNMP Live' : 'Sondes en pause'}</span>
            <span className="text-[10px] text-slate-400 hidden 2xl:inline">({lastPollTime})</span>
          </button>

          {/* Quick Action: Network Scan */}
          <button
            onClick={onOpenScan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all hover:border-cyan-400 shadow-sm"
          >
            <Radar className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="hidden sm:inline">Scanner Réseau</span>
          </button>

          {/* Quick Action: Add Device */}
          <button
            onClick={onOpenAddDevice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs transition-all shadow-glow-gold hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ajouter Équipement</span>
          </button>

          {/* Alerts Bell Notification Drawer */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-2 rounded-lg bg-[#121A2A] border border-[#1F2E45] text-slate-300 hover:text-white hover:border-slate-500 transition-all"
              aria-label="Alertes"
            >
              <Bell className="w-4 h-4" />
              {activeAlerts.length > 0 && (
                <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-black text-white ${
                  criticalCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-amber-600'
                }`}>
                  {activeAlerts.length}
                </span>
              )}
            </button>

            {showAlertsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111827] border border-[#1F2E45] rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-[#162032] border-b border-[#1F2E45]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Alertes Réseau Actives ({activeAlerts.length})
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAlertsDropdown(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[#1F2E45]/60">
                  {activeAlerts.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                      Aucune alerte active. Tout le réseau est opérationnel !
                    </div>
                  ) : (
                    activeAlerts.map(alert => (
                      <div key={alert.id} className="p-3 hover:bg-[#162032]/60 transition-colors">
                        <div className="flex items-start gap-2.5">
                          <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                            alert.severity === 'critical' ? 'bg-rose-500 animate-ping' :
                            alert.severity === 'high' ? 'bg-amber-500' :
                            alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-cyan-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-xs font-bold text-slate-100 truncate">
                                {alert.deviceName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {alert.deviceIp}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug mb-1">
                              {alert.title}
                            </p>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {alert.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg bg-[#121A2A] border border-[#1F2E45] hover:border-slate-500 transition-all text-left"
            >
              <span className="text-base select-none">{currentUser.avatar}</span>
              <div className="hidden xl:block">
                <p className="text-xs font-bold text-slate-200 leading-none">{currentUser.name}</p>
                <span className={`text-[9px] font-semibold uppercase px-1 py-0.2 rounded border ${roleLabels[currentUser.role].color}`}>
                  {roleLabels[currentUser.role].label}
                </span>
              </div>
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-[#111827] border border-[#1F2E45] rounded-xl shadow-2xl z-50 p-2">
                <div className="px-2 py-1.5 border-b border-[#1F2E45] mb-1">
                  <p className="text-xs font-bold text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{currentUser.email}</p>
                </div>
                <p className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">
                  Changer de rôle (RBAC) :
                </p>
                {(['superadmin', 'netadmin', 'supervisor', 'viewer'] as UserRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      setUserRole(role);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                      currentUser.role === role ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-[#1A2333]'
                    }`}
                  >
                    <span>{roleLabels[role].label}</span>
                    {currentUser.role === role && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
