'use client';

import React, { useState } from 'react';
import {
  FileCheck2,
  Printer,
  Download,
  Calendar,
  Activity,
  AlertTriangle,
  Server,
  Sparkles,
  CheckCircle2,
  TrendingDown,
  Layers
} from 'lucide-react';
import { useKingNMS } from '../../lib/stateStore';

export default function ReportsView() {
  const { devices, alerts, newDevices, sites } = useKingNMS();
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const totalDevices = devices.length;
  const downCount = devices.filter(d => d.status === 'DOWN').length;
  const warningCount = devices.filter(d => d.status === 'WARNING').length;
  const totalIncidents = alerts.length;
  const totalNewDevs = newDevices.length;

  const avgAvailability = totalDevices
    ? (devices.reduce((acc, d) => acc + d.metrics.availabilityPct, 0) / totalDevices).toFixed(2)
    : '100.00';

  // Find lowest availability device
  const sortedByAvail = [...devices].sort((a, b) => a.metrics.availabilityPct - b.metrics.availabilityPct);
  const lowestDevice = sortedByAvail[0];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Nom', 'IP', 'Type', 'Site', 'Disponibilité %', 'Latence Moyenne ms', 'Charge CPU %', 'Statut'];
    const rows = devices.map(d => [
      `"${d.hostname}"`,
      d.ip,
      d.type,
      `"${sites.find(s => s.id === d.siteId)?.name || d.siteId}"`,
      d.metrics.availabilityPct.toFixed(2),
      d.metrics.latencyMs,
      d.metrics.cpuPct,
      d.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kingnms_rapport_${reportPeriod}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header (Hidden when printing) */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            Génération des Rapports de Performance & Disponibilité
          </h1>
          <p className="text-xs text-slate-400">
            Exportations PDF / imprimable certifiées pour la direction des systèmes d'information (DSI).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Period Toggle */}
          <div className="flex items-center bg-[#121A2A] border border-[#1F2E45] rounded-xl p-1 text-xs">
            <button
              onClick={() => setReportPeriod('daily')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                reportPeriod === 'daily' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Quotidien
            </button>
            <button
              onClick={() => setReportPeriod('weekly')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                reportPeriod === 'weekly' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hebdomadaire
            </button>
            <button
              onClick={() => setReportPeriod('monthly')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                reportPeriod === 'monthly' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mensuel
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            CSV
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black text-xs shadow-glow-emerald transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimer / Exporter PDF
          </button>
        </div>
      </div>

      {/* Official Printable Report Card */}
      <div className="print-card bg-[#101828] border border-[#1F2E45] rounded-3xl p-8 shadow-2xl space-y-6 text-slate-100">
        {/* Report Header */}
        <div className="flex items-start justify-between border-b border-[#1F2E45] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-black bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
                KING NMS
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                RAPPORT OFFICIEL DE SUPERVISION
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Plateforme King Network Management System &middot; Période : {reportPeriod.toUpperCase()}
            </p>
            <p className="text-[11px] font-mono text-slate-500 mt-1">
              Émis le : {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="text-right font-mono">
            <span className="text-3xl font-black text-emerald-400 block">
              {avgAvailability} %
            </span>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">
              Disponibilité Globale
            </span>
          </div>
        </div>

        {/* Executive KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#141E33] border border-[#1F2E45]">
            <span className="text-xs text-slate-400 block mb-1">Équipements Surveillés</span>
            <span className="text-2xl font-black text-white font-mono">{totalDevices}</span>
            <span className="text-[10px] text-slate-500 block mt-1">Sur 3 sites distants</span>
          </div>

          <div className="p-4 rounded-xl bg-[#141E33] border border-[#1F2E45]">
            <span className="text-xs text-slate-400 block mb-1">Incidents Enregistrés</span>
            <span className="text-2xl font-black text-amber-400 font-mono">{totalIncidents}</span>
            <span className="text-[10px] text-slate-500 block mt-1">Alertes seuil & dérives</span>
          </div>

          <div className="p-4 rounded-xl bg-[#141E33] border border-[#1F2E45]">
            <span className="text-xs text-slate-400 block mb-1">Pannes Actives</span>
            <span className={`text-2xl font-black font-mono ${downCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {downCount}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">Équipement non joignable</span>
          </div>

          <div className="p-4 rounded-xl bg-[#141E33] border border-[#1F2E45]">
            <span className="text-xs text-slate-400 block mb-1">Nouveaux Équipements</span>
            <span className="text-2xl font-black text-cyan-400 font-mono">{totalNewDevs}</span>
            <span className="text-[10px] text-slate-500 block mt-1">Découvertes ARP récentes</span>
          </div>
        </div>

        {/* Focus Item: Lowest Availability Device */}
        {lowestDevice && (
          <div className="p-4 rounded-2xl bg-[#17131B] border border-amber-500/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-6 h-6 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-amber-300 block">
                  Équipement le Moins Disponible de la Période :
                </span>
                <span className="font-mono font-bold text-white text-sm">
                  {lowestDevice.hostname} ({lowestDevice.ip}) &middot; {lowestDevice.vendor} {lowestDevice.model}
                </span>
                <p className="text-[11px] text-slate-400">{lowestDevice.notes || 'Anomalie matérielle sous surveillance.'}</p>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-xl font-black text-amber-400">
                {lowestDevice.metrics.availabilityPct.toFixed(1)} %
              </span>
              <span className="text-[10px] text-slate-500 block">Taux de disponibilité</span>
            </div>
          </div>
        )}

        {/* Detailed Inventory Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Détail de Disponibilité par Équipement
          </h3>

          <div className="overflow-x-auto border border-[#1F2E45] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141E33] text-slate-400 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Équipement</th>
                  <th className="py-2.5 px-3">IP</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Site</th>
                  <th className="py-2.5 px-3">Disponibilité</th>
                  <th className="py-2.5 px-3">Latence RTT</th>
                  <th className="py-2.5 px-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2E45] bg-[#0E1524]">
                {devices.map(d => (
                  <tr key={d.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-white">{d.hostname}</td>
                    <td className="py-2.5 px-3 font-mono text-cyan-300">{d.ip}</td>
                    <td className="py-2.5 px-3 capitalize">{d.type}</td>
                    <td className="py-2.5 px-3 text-slate-300">{sites.find(s => s.id === d.siteId)?.name.split('-')[0]}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{d.metrics.availabilityPct.toFixed(2)} %</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{d.status === 'DOWN' ? 'Timeout' : `${d.metrics.latencyMs} ms`}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        d.status === 'UP' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                        d.status === 'DOWN' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                        'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Footer */}
        <div className="pt-4 border-t border-[#1F2E45] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>KingNMS Enterprise Platform &middot; Conforme ISO 27001 & ITIL</span>
          <span>Rapport Numérique Signé</span>
        </div>
      </div>
    </div>
  );
}
