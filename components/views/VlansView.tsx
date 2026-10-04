'use client';

import React, { useState } from 'react';
import {
  Layers,
  PlusCircle,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  X,
  Check
} from 'lucide-react';
import { useKingNMS } from '../../lib/stateStore';
import { Device } from '../../types';

export default function VlansView({ onSelectDevice }: { onSelectDevice: (device: Device) => void }) {
  const { vlans, devices, addVlan } = useKingNMS();
  const [selectedVlanId, setSelectedVlanId] = useState<number>(vlans[0]?.id || 10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New VLAN Form
  const [vlanId, setVlanId] = useState('');
  const [vlanName, setVlanName] = useState('');
  const [vlanSubnet, setVlanSubnet] = useState('');
  const [vlanDesc, setVlanDesc] = useState('');

  const activeVlan = vlans.find(v => v.id === selectedVlanId) || vlans[0];
  const vlanDevices = devices.filter(d => d.vlanId === activeVlan?.id);

  const handleCreateVlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vlanId || !vlanName) return;

    addVlan({
      id: Number(vlanId),
      name: vlanName,
      subnet: vlanSubnet || '192.168.10.0/24',
      description: vlanDesc || 'Segment réseau utilisateur'
    });

    setIsModalOpen(false);
    setVlanId('');
    setVlanName('');
    setVlanSubnet('');
    setVlanDesc('');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            Gestion des VLANs & Segmentation Réseau 802.1Q
          </h1>
          <p className="text-xs text-slate-400">
            Supervision de la segmentation logique, répartition des équipements et isolation des flux.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-glow-gold transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Nouveau VLAN
        </button>
      </div>

      {/* VLANs Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vlans.map(v => {
          const isSelected = activeVlan?.id === v.id;
          const count = devices.filter(d => d.vlanId === v.id).length;

          return (
            <div
              key={v.id}
              onClick={() => setSelectedVlanId(v.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#152033] border-amber-400 ring-2 ring-amber-400/30 shadow-xl'
                  : 'bg-[#101828] hover:bg-[#141E33] border-[#1F2E45]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-black text-amber-400">
                  ID {v.id}
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  v.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
              </div>

              <h3 className="text-sm font-bold text-white mb-0.5">{v.name}</h3>
              <p className="text-xs font-mono text-cyan-400 mb-2">{v.subnet}</p>
              <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">{v.description}</p>

              <div className="flex items-center justify-between pt-2 border-t border-[#1F2E45] text-[11px] font-mono">
                <span className="text-slate-400">{count} équipement(s)</span>
                <span className="text-emerald-400 font-bold">{v.trafficMbps} Mbps</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active VLAN Detailed Devices View */}
      {activeVlan && (
        <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl overflow-hidden shadow-2xl space-y-4 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F2E45]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Équipements connectés au {activeVlan.name} (VLAN {activeVlan.id})
                </h2>
                <span className="text-xs font-mono text-cyan-400">[{activeVlan.subnet}]</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{activeVlan.description}</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              {vlanDevices.length} Membre(s) Actif(s)
            </span>
          </div>

          {vlanDevices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Aucun équipement actuellement raccordé à ce VLAN.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {vlanDevices.map(dev => (
                <div
                  key={dev.id}
                  onClick={() => onSelectDevice(dev)}
                  className="p-3 rounded-xl bg-[#141E33] hover:bg-[#18253D] border border-[#1F2E45] cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${
                      dev.status === 'UP' ? 'bg-emerald-400' :
                      dev.status === 'DOWN' ? 'bg-rose-500 animate-ping' : 'bg-amber-400'
                    }`} />
                    <div>
                      <div className="font-mono font-bold text-white text-xs">{dev.hostname}</div>
                      <div className="text-[10px] font-mono text-cyan-400">{dev.ip}</div>
                      <div className="text-[9px] text-slate-400">{dev.vendor} - {dev.model}</div>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 hover:text-white" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE VLAN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#0E1524] border border-[#1F2E45] rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 bg-[#141E33] border-b border-[#1F2E45]">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-white">Créer un Nouveau VLAN 802.1Q</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVlan} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    VLAN ID (1-4094) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="4094"
                    required
                    placeholder="70"
                    value={vlanId}
                    onChange={(e) => setVlanId(e.target.value)}
                    className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Plage Subnet CIDR
                  </label>
                  <input
                    type="text"
                    placeholder="192.168.70.0/24"
                    value={vlanSubnet}
                    onChange={(e) => setVlanSubnet(e.target.value)}
                    className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nom du VLAN <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: VLAN 70 - Téléphonie Siège"
                  value={vlanName}
                  onChange={(e) => setVlanName(e.target.value)}
                  className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Rôle
                </label>
                <textarea
                  rows={2}
                  placeholder="Rôle fonctionnel, politique de sécurité associée..."
                  value={vlanDesc}
                  onChange={(e) => setVlanDesc(e.target.value)}
                  className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2E45]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-glow-gold transition-all"
                >
                  <Check className="w-4 h-4" />
                  Créer le VLAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
