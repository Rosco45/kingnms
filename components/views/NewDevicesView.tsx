'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  ShieldAlert,
  EyeOff,
  CheckCircle2,
  Clock,
  HardDrive,
  Laptop,
  Check,
  X,
  Plus
} from 'lucide-react';
import { useKingNMS } from '../../lib/stateStore';
import { NewDevice, DeviceType } from '../../types';

export default function NewDevicesView() {
  const {
    newDevices,
    authorizeNewDevice,
    blockNewDevice,
    ignoreNewDevice,
    vlans
  } = useKingNMS();

  const [authorizingDevice, setAuthorizingDevice] = useState<NewDevice | null>(null);
  const [assignedHostname, setAssignedHostname] = useState('');
  const [assignedType, setAssignedType] = useState<DeviceType>('pc');
  const [assignedVlan, setAssignedVlan] = useState<number>(20);

  const openAuthorizeModal = (dev: NewDevice) => {
    setAuthorizingDevice(dev);
    setAssignedHostname(dev.hostname || `DEV-${dev.ip.split('.').pop()}`);
    setAssignedType(dev.suggestedType || 'pc');
  };

  const handleConfirmAuthorize = () => {
    if (!authorizingDevice) return;
    authorizeNewDevice(authorizingDevice.id, {
      hostname: assignedHostname,
      type: assignedType,
      vlanId: assignedVlan
    });
    setAuthorizingDevice(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            File de Détection des Nouveaux Équipements (Triage Sécurité)
          </h1>
          <p className="text-xs text-slate-400">
            Périphériques non répertoriés découverts par sondes ARP/ICMP sur le réseau local. Autorisez ou bloquez l'accès.
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold">
          {newDevices.length} périphérique(s) en attente
        </span>
      </div>

      {/* Empty State */}
      {newDevices.length === 0 ? (
        <div className="p-12 text-center bg-[#101828] border border-[#1F2E45] rounded-2xl shadow-xl space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
          <h2 className="text-sm font-bold text-white">File de triage vide</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Aucun nouvel équipement non autorisé n’a été détecté récemment. Dès qu’une nouvelle adresse MAC émet un paquet, elle apparaîtra ici.
          </p>
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {newDevices.map(dev => (
            <div
              key={dev.id}
              className="bg-[#101828] border border-[#1F2E45] hover:border-cyan-500/40 rounded-2xl p-5 shadow-2xl flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                    🆕 Nouveau Détecté
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{dev.lastSeen}</span>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Adresse IP :</span>
                    <span className="text-sm font-black font-mono text-cyan-400">{dev.ip}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Adresse MAC :</span>
                    <span className="text-xs font-mono text-white">{dev.mac}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Fabricant :</span>
                    <span className="text-xs font-bold text-slate-200">{dev.vendor}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Nom détecté :</span>
                    <span className="text-xs font-mono text-amber-300 truncate max-w-[170px]">{dev.hostname || 'Non résolu'}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#0B0F17] border border-[#1F2E45] text-[11px] space-y-1 text-slate-400 font-mono mb-4">
                  <div className="flex justify-between">
                    <span>1ère apparition :</span>
                    <span className="text-slate-200">{dev.firstSeen}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type suggéré :</span>
                    <span className="text-cyan-300 capitalize">{dev.suggestedType}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#1F2E45]">
                <button
                  onClick={() => openAuthorizeModal(dev)}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                  title="Autoriser et intégrer dans l'inventaire"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Autoriser
                </button>

                <button
                  onClick={() => blockNewDevice(dev.id, 'Appareil suspect non autorisé')}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition-all"
                  title="Bloquer et isoler immédiatement"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Bloquer
                </button>

                <button
                  onClick={() => ignoreNewDevice(dev.id)}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-medium text-xs transition-all"
                  title="Ignorer temporairement"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  Ignorer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Authorize & Classify Modal */}
      {authorizingDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#0E1524] border border-[#1F2E45] rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 bg-[#141E33] border-b border-[#1F2E45]">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Autorisation & Classification</h2>
              </div>
              <button onClick={() => setAuthorizingDevice(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-[#121A2A] rounded-xl border border-[#1F2E45] text-xs font-mono space-y-1">
                <div>IP: <span className="text-cyan-400 font-bold">{authorizingDevice.ip}</span></div>
                <div>MAC: <span className="text-slate-300">{authorizingDevice.mac}</span></div>
                <div>Fabricant: <span className="text-slate-300">{authorizingDevice.vendor}</span></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nom d’hôte officiel (Hostname) :
                </label>
                <input
                  type="text"
                  value={assignedHostname}
                  onChange={(e) => setAssignedHostname(e.target.value)}
                  className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catégorie d'équipement :
                </label>
                <select
                  value={assignedType}
                  onChange={(e) => setAssignedType(e.target.value as DeviceType)}
                  className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="pc">Poste de travail / PC</option>
                  <option value="server">Serveur</option>
                  <option value="switch">Switch</option>
                  <option value="router">Routeur</option>
                  <option value="ap">Borne Wi-Fi</option>
                  <option value="camera">Caméra IP</option>
                  <option value="phone">Téléphone IP</option>
                  <option value="printer">Imprimante</option>
                  <option value="iot">Objet Connecté (IoT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Affectation VLAN :
                </label>
                <select
                  value={assignedVlan}
                  onChange={(e) => setAssignedVlan(Number(e.target.value))}
                  className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {vlans.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2E45]">
                <button
                  onClick={() => setAuthorizingDevice(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmAuthorize}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <Check className="w-4 h-4" />
                  Confirmer et Intégrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
