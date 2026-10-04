'use client';

import React, { useState } from 'react';
import {
  FileText,
  Search,
  Download,
  Filter,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useKingNMS } from '../../lib/stateStore';
import { AuditLog } from '../../types';

export default function AuditView() {
  const { auditLogs } = useKingNMS();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter(log => {
    if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        log.target.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.user.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Horodatage', 'Opérateur', 'Action', 'Cible', 'Détails', 'Gravité'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.user}"`,
      `"${l.action}"`,
      `"${l.target}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      l.severity
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kingnms_audit_logs_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            Registre d'Audit & Journal des Événements Réseau
          </h1>
          <p className="text-xs text-slate-400">
            Journal immuable traçant toutes les actions administratives, pannes, modifications de ports et alertes de sécurité.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          Exporter CSV
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#101828] border border-[#1F2E45] rounded-xl p-3">
        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>Sévérité :</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#121A2A] border border-[#1F2E45] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
            >
              <option value="all">Toutes</option>
              <option value="danger">🔴 Danger / Critique</option>
              <option value="warning">🟠 Avertissement</option>
              <option value="info">🟢 Info / Normal</option>
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher par opérateur, cible, action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141E33] text-slate-400 border-b border-[#1F2E45] font-mono">
              <tr>
                <th className="py-3 px-4">Date / Heure</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Cible Réseau</th>
                <th className="py-3 px-4">Détails de l'événement</th>
                <th className="py-3 px-4">Opérateur / Déclencheur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2E45] bg-[#0E1524]">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-[#141E33] transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                      log.severity === 'danger' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                      log.severity === 'warning' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                    {log.target}
                  </td>
                  <td className="py-3 px-4 text-slate-300 text-xs">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                    {log.user}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
