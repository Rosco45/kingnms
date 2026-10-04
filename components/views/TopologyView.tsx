'use client';

import React, { useState, useRef } from 'react';
import {
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Search,
  Server,
  Cloud,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { useKingNMS } from '../../lib/stateStore';
import { Device } from '../../types';

interface TopologyViewProps {
  onSelectDevice: (device: Device) => void;
}

interface NodePosition {
  id: string;
  label: string;
  ip: string;
  type: string;
  status: string;
  x: number;
  y: number;
  isCloud?: boolean;
}

export default function TopologyView({ onSelectDevice }: TopologyViewProps) {
  const { devices, selectedSite, vlans, searchQuery } = useKingNMS();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedVlan, setSelectedVlan] = useState<string>('all');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Position nodes in structured hierarchy tree
  const siteFiltered = selectedSite === 'all'
    ? devices
    : devices.filter(d => d.siteId === selectedSite);

  const vlanFiltered = selectedVlan === 'all'
    ? siteFiltered
    : siteFiltered.filter(d => d.vlanId === Number(selectedVlan));

  // Compute node layouts
  const routers = vlanFiltered.filter(d => d.type === 'router');
  const switches = vlanFiltered.filter(d => d.type === 'switch');
  const servers = vlanFiltered.filter(d => d.type === 'server');
  const clients = vlanFiltered.filter(d => !['router', 'switch', 'server'].includes(d.type));

  const nodes: NodePosition[] = [
    {
      id: 'cloud-internet',
      label: 'INTERNET (Fibre Transit BGP)',
      ip: 'WAN Transit',
      type: 'cloud',
      status: 'UP',
      x: 480,
      y: 50,
      isCloud: true
    }
  ];

  // Routers Level (Y = 170)
  routers.forEach((r, i) => {
    const spacing = 750 / (routers.length + 1);
    nodes.push({
      id: r.id,
      label: r.hostname,
      ip: r.ip,
      type: r.type,
      status: r.status,
      x: 120 + spacing * (i + 1),
      y: 170
    });
  });

  // Switches Level (Y = 320)
  switches.forEach((s, i) => {
    const spacing = 820 / (switches.length + 1);
    nodes.push({
      id: s.id,
      label: s.hostname,
      ip: s.ip,
      type: s.type,
      status: s.status,
      x: 80 + spacing * (i + 1),
      y: 320
    });
  });

  // Servers Level (Y = 470)
  servers.forEach((srv, i) => {
    const spacing = 840 / (servers.length + 1);
    nodes.push({
      id: srv.id,
      label: srv.hostname,
      ip: srv.ip,
      type: srv.type,
      status: srv.status,
      x: 60 + spacing * (i + 1),
      y: 470
    });
  });

  // Clients & Endpoints Level (Y = 620)
  clients.forEach((c, i) => {
    const spacing = 880 / (clients.length + 1);
    nodes.push({
      id: c.id,
      label: c.hostname,
      ip: c.ip,
      type: c.type,
      status: c.status,
      x: 40 + spacing * (i + 1),
      y: 620
    });
  });

  // Generate logical links between tiers
  const links: { from: NodePosition; to: NodePosition; speed: string }[] = [];
  const cloudNode = nodes.find(n => n.id === 'cloud-internet');

  routers.forEach(r => {
    const rNode = nodes.find(n => n.id === r.id);
    if (cloudNode && rNode) links.push({ from: cloudNode, to: rNode, speed: '1 Gbps' });
  });

  switches.forEach(s => {
    const sNode = nodes.find(n => n.id === s.id);
    // Link to first router or nearest
    const targetRouter = nodes.find(n => n.type === 'router');
    if (sNode && targetRouter) links.push({ from: targetRouter, to: sNode, speed: '10 Gbps' });
  });

  servers.forEach(srv => {
    const srvNode = nodes.find(n => n.id === srv.id);
    const coreSwitch = nodes.find(n => n.type === 'switch');
    if (srvNode && coreSwitch) links.push({ from: coreSwitch, to: srvNode, speed: '10 Gbps' });
  });

  clients.forEach(c => {
    const cNode = nodes.find(n => n.id === c.id);
    const accessSwitch = nodes.find(n => n.type === 'switch' && n.label.includes('ACCESS')) || nodes.find(n => n.type === 'switch');
    if (cNode && accessSwitch) links.push({ from: accessSwitch, to: cNode, speed: '1 Gbps' });
  });

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleNodeClick = (node: NodePosition) => {
    if (node.isCloud) return;
    const targetDevice = devices.find(d => d.id === node.id);
    if (targetDevice) onSelectDevice(targetDevice);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto flex flex-col h-[calc(100vh-80px)]">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#101828] border border-[#1F2E45] rounded-2xl p-4 shadow-xl">
        <div>
          <h1 className="text-base font-black text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-amber-400" />
            Topologie Réseau Interactive & Cartographie des Liens
          </h1>
          <p className="text-xs text-slate-400">
            Arborescence hiérarchique temps réel &middot; Cliquez sur un équipement pour ouvrir son diagnostic complet.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* VLAN Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-[#121A2A] border border-[#1F2E45] rounded-lg px-2.5 py-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Filtre VLAN :</span>
            <select
              value={selectedVlan}
              onChange={(e) => setSelectedVlan(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#121A2A]">Tous les VLANs</option>
              {vlans.map(v => (
                <option key={v.id} value={v.id} className="bg-[#121A2A]">
                  VLAN {v.id} ({v.name.split('-')[1] || v.name})
                </option>
              ))}
            </select>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-[#121A2A] border border-[#1F2E45] rounded-lg p-1">
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.15))}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
              title="Zoom +"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-slate-400">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.15))}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
              title="Zoom -"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetView}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 ml-1 border-l border-slate-700"
              title="Réinitialiser vue"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        className="flex-1 bg-[#090D16] border border-[#1F2E45] rounded-2xl overflow-hidden relative shadow-2xl cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Canvas Background Grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#3B82F6 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Legend Overlay */}
        <div className="absolute top-4 left-4 z-10 bg-[#0E1524]/90 backdrop-blur-md border border-[#1F2E45] rounded-xl p-3 text-xs space-y-1.5 pointer-events-auto shadow-lg">
          <p className="text-[10px] uppercase font-bold text-slate-400">Légende Statuts</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-glow-emerald" />
            <span>🟢 Opérationnel (UP)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>🔴 Inaccessible (DOWN)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>🟠 Alerte / Charge (WARNING)</span>
          </div>
        </div>

        {/* Dynamic Zoomed / Panned SVG Area */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            width: '1000px',
            height: '750px',
            margin: '0 auto',
            position: 'relative'
          }}
        >
          <svg className="w-full h-full absolute inset-0 pointer-events-none">
            {/* Draw Links */}
            {links.map((link, idx) => {
              const isAlert = link.from.status === 'DOWN' || link.to.status === 'DOWN';
              return (
                <g key={idx}>
                  <line
                    x1={link.from.x + 60}
                    y1={link.from.y + 25}
                    x2={link.to.x + 60}
                    y2={link.to.y + 25}
                    stroke={isAlert ? '#F43F5E' : '#1F3455'}
                    strokeWidth={link.speed.includes('10 Gbps') ? '3' : '2'}
                    strokeDasharray={isAlert ? '4 4' : undefined}
                  />
                  {/* Link Speed Badge */}
                  <rect
                    x={(link.from.x + link.to.x) / 2 + 40}
                    y={(link.from.y + link.to.y) / 2 + 15}
                    width="44"
                    height="16"
                    rx="4"
                    fill="#0B0F17"
                    stroke="#1F2E45"
                  />
                  <text
                    x={(link.from.x + link.to.x) / 2 + 62}
                    y={(link.from.y + link.to.y) / 2 + 27}
                    fill="#94A3B8"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {link.speed}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Render Nodes */}
          {nodes.map(node => {
            const isMatch = searchQuery && (
              node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              node.ip.toLowerCase().includes(searchQuery.toLowerCase())
            );

            return (
              <div
                key={node.id}
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{
                  position: 'absolute',
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: '130px'
                }}
                className={`group cursor-pointer rounded-xl p-2.5 border transition-all pointer-events-auto ${
                  node.isCloud
                    ? 'bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border-cyan-500/40 text-cyan-200'
                    : node.status === 'UP'
                    ? 'bg-[#121A2A] hover:bg-[#182338] border-emerald-500/40 hover:border-emerald-400'
                    : node.status === 'DOWN'
                    ? 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-500/60 shadow-glow-rose'
                    : 'bg-[#121A2A] hover:bg-[#182338] border-amber-500/40 hover:border-amber-400'
                } ${isMatch ? 'ring-2 ring-amber-400 scale-105' : ''}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 truncate">
                    {node.isCloud ? (
                      <Cloud className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <Server className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="text-[10px] uppercase font-bold text-slate-300 font-mono truncate">
                      {node.type}
                    </span>
                  </div>

                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    node.status === 'UP' ? 'bg-emerald-400' :
                    node.status === 'DOWN' ? 'bg-rose-500 animate-ping' : 'bg-amber-400'
                  }`} />
                </div>

                <div className="font-mono text-xs font-black text-white truncate">
                  {node.label}
                </div>
                <div className="font-mono text-[10px] text-cyan-400 truncate">
                  {node.ip}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
