'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  PlusCircle,
  Play,
  Trash2,
  Bell,
  Cpu,
  Activity,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Filter,
  Check
} from 'lucide-react';
import { useKingNMS } from '../../lib/stateStore';
import { Alert, AlertSeverity, AlertRule } from '../../types';

export default function AlertsView() {
  const {
    alerts,
    rules,
    acknowledgeAlert,
    resolveAlert,
    addAlertRule,
    toggleAlertRule,
    deleteAlertRule
  } = useKingNMS();

  const [activeTab, setActiveTab] = useState<'alerts' | 'rules'>('alerts');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  // New Rule form state
  const [ruleName, setRuleName] = useState('');
  const [ruleMetric, setRuleMetric] = useState<AlertRule['metric']>('cpu_usage');
  const [ruleCondition, setRuleCondition] = useState<AlertRule['condition']>('>');
  const [ruleThreshold, setRuleThreshold] = useState<string | number>('90');
  const [ruleDuration, setRuleDuration] = useState<number>(5);
  const [ruleAction, setRuleAction] = useState<AlertRule['action']>('create_critical_alert');
  const [ruleDesc, setRuleDesc] = useState('');

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter === 'active' && a.status === 'resolved') return false;
    if (statusFilter === 'resolved' && a.status !== 'resolved') return false;
    return true;
  });

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName) return;

    addAlertRule({
      name: ruleName,
      metric: ruleMetric,
      condition: ruleCondition,
      threshold: ruleThreshold,
      durationMinutes: ruleDuration,
      action: ruleAction,
      description: ruleDesc || `Déclenche une action ${ruleAction} si ${ruleMetric} ${ruleCondition} ${ruleThreshold}`
    });

    setIsRuleModalOpen(false);
    setRuleName('');
    setRuleDesc('');
  };

  const severityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'critical':
        return <span className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] font-bold px-2 py-0.5 rounded border uppercase">🔴 Critique</span>;
      case 'high':
        return <span className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded border uppercase">🟠 Haute</span>;
      case 'warning':
        return <span className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 text-[10px] font-bold px-2 py-0.5 rounded border uppercase">🟡 Attention</span>;
      case 'notice':
        return <span className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px] font-bold px-2 py-0.5 rounded border uppercase">🔵 Notification</span>;
      case 'info':
      default:
        return <span className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded border uppercase">🟢 Info</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Gestion des Alertes & Moteur de Règles
          </h1>
          <p className="text-xs text-slate-400">
            Supervision des anomalies en temps réel, acquittement d’incidents et programmation des règles SI... ALORS...
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'rules' && (
            <button
              onClick={() => setIsRuleModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-glow-gold transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Créer une Règle
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1F2E45] pb-2">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'alerts'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Alertes Actives & Historique ({alerts.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Moteur de Règles Automatiques ({rules.length})
        </button>
      </div>

      {/* TAB 1: ALERTS STREAM */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Sub Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#101828] border border-[#1F2E45] rounded-xl p-3">
            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span>Gravité :</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-[#121A2A] border border-[#1F2E45] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="all">Toutes les gravités</option>
                  <option value="critical">🔴 Critique</option>
                  <option value="high">🟠 Haute</option>
                  <option value="warning">🟡 Attention</option>
                  <option value="notice">🔵 Notification</option>
                  <option value="info">🟢 Info</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span>Statut :</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-[#121A2A] border border-[#1F2E45] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="all">Tous</option>
                  <option value="active">Actives seulement</option>
                  <option value="resolved">Clôturées seulement</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400">
              {filteredAlerts.length} alerte(s) affichée(s)
            </div>
          </div>

          {/* Alerts Cards List */}
          <div className="space-y-3">
            {filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all ${
                  alert.status === 'resolved'
                    ? 'bg-[#101828]/60 border-[#1F2E45]/80 opacity-75'
                    : alert.severity === 'critical'
                    ? 'bg-[#1A121E] border-rose-500/50 shadow-glow-rose'
                    : alert.severity === 'high'
                    ? 'bg-[#1E1912] border-amber-500/50 shadow-glow-gold'
                    : 'bg-[#101828] border-[#1F2E45]'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{severityBadge(alert.severity)}</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs font-bold text-white font-mono">{alert.deviceName}</h3>
                        <span className="text-[11px] font-mono text-cyan-400">({alert.deviceIp})</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Détecté : {alert.timestamp}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-200 mt-1">{alert.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{alert.message}</p>
                      {alert.acknowledgedBy && (
                        <p className="text-[10px] text-amber-400 font-mono mt-1">
                          Acquitté par {alert.acknowledgedBy}
                        </p>
                      )}
                      {alert.resolvedAt && (
                        <p className="text-[10px] text-emerald-400 font-mono mt-1">
                          Clôturé le {alert.resolvedAt}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {alert.status === 'active' && (
                      <>
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all"
                        >
                          Acquitter
                        </button>
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all"
                        >
                          Clôturer / Résolu
                        </button>
                      </>
                    )}
                    {alert.status === 'acknowledged' && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all"
                      >
                        Marquer Résolu
                      </button>
                    )}
                    {alert.status === 'resolved' && (
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Clôturé
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: RULES ENGINE */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1F2E45]">
              <div>
                <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Moteur de Règles Conditionnelles (SI ... ALORS ...)
                </h2>
                <p className="text-[11px] text-slate-400">
                  Déclenchement automatique d'alertes et de contre-mesures réseau basé sur les sondes.
                </p>
              </div>
              <button
                onClick={() => setIsRuleModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all"
              >
                + Ajouter Règle
              </button>
            </div>

            <div className="space-y-3">
              {rules.map(rule => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    rule.enabled ? 'bg-[#141E33] border-[#1F2E45]' : 'bg-[#0E1422] border-[#182335] opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{rule.name}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.2 rounded border ${
                        rule.enabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {rule.enabled ? 'ACTIF' : 'DÉSACTIVÉ'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                        SI {rule.metric} {rule.condition} {rule.threshold}
                      </span>
                      <span className="text-slate-400">PENDANT {rule.durationMinutes} min</span>
                      <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                        ALORS &rarr; {rule.action}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400">{rule.description}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => toggleAlertRule(rule.id)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                        rule.enabled
                          ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                      title={rule.enabled ? 'Désactiver la règle' : 'Activer la règle'}
                    >
                      {rule.enabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={() => deleteAlertRule(rule.id)}
                      className="p-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 transition-colors"
                      title="Supprimer la règle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE RULE MODAL */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#0E1524] border border-[#1F2E45] rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 bg-[#141E33] border-b border-[#1F2E45]">
              <h2 className="text-sm font-bold text-white">Nouvelle Règle de Déclenchement</h2>
              <button onClick={() => setIsRuleModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nom de la règle <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Alerte Surchauffe Commutateur"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Métrique</label>
                  <select
                    value={ruleMetric}
                    onChange={(e) => setRuleMetric(e.target.value as any)}
                    className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="cpu_usage">Charge CPU (%)</option>
                    <option value="ram_usage">Mémoire RAM (%)</option>
                    <option value="temperature">Température (°C)</option>
                    <option value="interface_traffic">Trafic Interface (%)</option>
                    <option value="icmp_ping">Ping ICMP (Échec)</option>
                    <option value="packet_loss">Pertes de paquets (%)</option>
                    <option value="new_device">Nouveau Périphérique Détecté</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Condition</label>
                  <select
                    value={ruleCondition}
                    onChange={(e) => setRuleCondition(e.target.value as any)}
                    className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value=">">Supérieur à (&gt;)</option>
                    <option value="<">Inférieur à (&lt;)</option>
                    <option value="==">Égal à (==)</option>
                    <option value="fails">Échoue (Fails)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Seuil Déclencheur</label>
                  <input
                    type="text"
                    value={ruleThreshold}
                    onChange={(e) => setRuleThreshold(e.target.value)}
                    placeholder="90"
                    className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pendant (Minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={ruleDuration}
                    onChange={(e) => setRuleDuration(Number(e.target.value))}
                    className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Action Exécutée</label>
                <select
                  value={ruleAction}
                  onChange={(e) => setRuleAction(e.target.value as any)}
                  className="w-full bg-[#121A2A] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="create_critical_alert">Créer une alerte CRITIQUE</option>
                  <option value="create_warning_alert">Créer un AVERTISSEMENT</option>
                  <option value="notify_telegram">Notifier via Telegram Bot</option>
                  <option value="notify_email">Envoyer Email d'Urgence</option>
                  <option value="shutdown_port">Désactiver le port switch (Port Shutdown)</option>
                  <option value="block_device">Isoler l'équipement (Blocage)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2E45]">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-glow-gold transition-all"
                >
                  Enregistrer la règle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
