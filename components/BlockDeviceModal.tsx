'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, Check } from 'lucide-react';
import { Device } from '../types';
import { useKingNMS } from '../lib/stateStore';

interface BlockDeviceModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BlockDeviceModal({
  device,
  isOpen,
  onClose
}: BlockDeviceModalProps) {
  const { blockDevice } = useKingNMS();
  const [reason, setReason] = useState('Périphérique suspect non homologué ou trafic anormal');
  const [blockMethod, setBlockMethod] = useState<'port_shutdown' | 'mac_deny' | 'vlan_isolate'>('port_shutdown');

  if (!isOpen || !device) return null;

  const handleConfirm = () => {
    const fullReason = `[${blockMethod.toUpperCase()}] ${reason}`;
    blockDevice(device.id, fullReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0E1524] border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 bg-rose-950/40 border-b border-rose-500/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Contrôle de Sécurité : Blocage Réseau</h2>
              <p className="text-[11px] text-rose-300">Action administrative immédiate sur le commutateur</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-[#121A2A] border border-[#1F2E45] rounded-xl text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Équipement cible :</span>
              <span className="font-bold text-white font-mono">{device.hostname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Adresse IP :</span>
              <span className="font-mono text-cyan-400">{device.ip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Adresse MAC :</span>
              <span className="font-mono text-slate-300">{device.mac}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mécanisme de blocage :
            </label>
            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#1F2E45] bg-[#121A2A] cursor-pointer hover:border-rose-500/40">
                <input
                  type="radio"
                  name="block_method"
                  checked={blockMethod === 'port_shutdown'}
                  onChange={() => setBlockMethod('port_shutdown')}
                  className="mt-0.5 text-rose-500"
                />
                <div>
                  <span className="font-bold text-white block">Désactivation du port switch (Port Shutdown)</span>
                  <span className="text-[11px] text-slate-400">Commande SNMP ifAdminStatus=down envoyée au commutateur raccordé.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#1F2E45] bg-[#121A2A] cursor-pointer hover:border-rose-500/40">
                <input
                  type="radio"
                  name="block_method"
                  checked={blockMethod === 'mac_deny'}
                  onChange={() => setBlockMethod('mac_deny')}
                  className="mt-0.5 text-rose-500"
                />
                <div>
                  <span className="font-bold text-white block">Liste noire MAC (Port Security / Deny List)</span>
                  <span className="text-[11px] text-slate-400">Interdiction de l'adresse MAC sur le contrôleur réseau / AP.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#1F2E45] bg-[#121A2A] cursor-pointer hover:border-rose-500/40">
                <input
                  type="radio"
                  name="block_method"
                  checked={blockMethod === 'vlan_isolate'}
                  onChange={() => setBlockMethod('vlan_isolate')}
                  className="mt-0.5 text-rose-500"
                />
                <div>
                  <span className="font-bold text-white block">VLAN d'isolement (Quarantaine)</span>
                  <span className="text-[11px] text-slate-400">Bascule le port dans un VLAN isolé sans accès aux serveurs ni Internet.</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Motif administratif (inscrit au journal d'audit) :
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              placeholder="Ex: Utilisation abusive de bande passante, intrusion non autorisée..."
            />
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Cette action administrative sera signée et conservée dans le registre d'audit certifié.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-glow-rose transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              Confirmer le Blocage Immédiat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
