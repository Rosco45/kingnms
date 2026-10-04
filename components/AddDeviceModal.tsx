'use client';

import React, { useState } from 'react';
import { X, PlusCircle, Server, Shield, Check } from 'lucide-react';
import { useKingNMS } from '../lib/stateStore';
import { DeviceType } from '../types';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddDeviceModal({ isOpen, onClose }: AddDeviceModalProps) {
  const { addDevice, sites, vlans } = useKingNMS();

  const [ip, setIp] = useState('');
  const [hostname, setHostname] = useState('');
  const [mac, setMac] = useState('');
  const [vendor, setVendor] = useState('Cisco Systems');
  const [type, setType] = useState<DeviceType>('switch');
  const [siteId, setSiteId] = useState('cotonou');
  const [vlanId, setVlanId] = useState<number>(10);
  const [model, setModel] = useState('');
  const [snmpEnabled, setSnmpEnabled] = useState(true);
  const [snmpCommunity, setSnmpCommunity] = useState('public');
  const [location, setLocation] = useState('Baie Réseau Principal');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip || !hostname) return;

    addDevice({
      ip,
      hostname,
      mac: mac || `00:50:56:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
      vendor,
      type,
      siteId,
      vlanId,
      model: model || `${vendor} Managed Device`,
      snmpEnabled,
      snmpCommunity,
      location,
      notes
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0E1524] border border-[#1F2E45] rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 bg-[#141E33] border-b border-[#1F2E45]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Ajouter un Équipement Réseau</h2>
              <p className="text-[11px] text-slate-400">Intégration manuelle dans l’inventaire KingNMS</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Adresse IP <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="ex: 192.168.1.15"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hostname / Nom <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="ex: SW-ACC-ETAGE3"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Adresse MAC (optionnel)
              </label>
              <input
                type="text"
                placeholder="ex: 00:1E:13:XX:XX:XX"
                value={mac}
                onChange={(e) => setMac(e.target.value)}
                className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Type d’équipement
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DeviceType)}
                className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="router">Routeur</option>
                <option value="switch">Switch</option>
                <option value="server">Serveur</option>
                <option value="pc">Poste de travail / PC</option>
                <option value="ap">Point d’accès Wi-Fi</option>
                <option value="camera">Caméra IP</option>
                <option value="phone">Téléphone IP (ToIP)</option>
                <option value="printer">Imprimante</option>
                <option value="iot">Objet Connecté (IoT)</option>
                <option value="unknown">Équipement Inconnu</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fabricant
              </label>
              <input
                type="text"
                placeholder="ex: Cisco, Aruba, Dell, Ubiquiti"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Modèle matériel
              </label>
              <input
                type="text"
                placeholder="ex: Catalyst 2960-X"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Site d’implantation
              </label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                VLAN Associé
              </label>
              <select
                value={vlanId}
                onChange={(e) => setVlanId(Number(e.target.value))}
                className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {vlans.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-[#121A2A] border border-[#1F2E45] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="snmp_check"
                checked={snmpEnabled}
                onChange={(e) => setSnmpEnabled(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded bg-[#0A0F1A] border-slate-700"
              />
              <label htmlFor="snmp_check" className="text-xs font-semibold text-white cursor-pointer">
                Activer la surveillance SNMP MIB-II (CPU, RAM, Interfaces)
              </label>
            </div>
            {snmpEnabled && (
              <input
                type="text"
                placeholder="Communauté (public)"
                value={snmpCommunity}
                onChange={(e) => setSnmpCommunity(e.target.value)}
                className="bg-[#0A0F1A] border border-[#1F2E45] rounded px-2 py-1 text-xs text-slate-200 font-mono w-28"
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2E45]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-glow-gold transition-all"
            >
              <Check className="w-4 h-4" />
              Enregistrer l’équipement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
