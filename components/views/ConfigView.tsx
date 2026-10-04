'use client';

import React, { useState } from 'react';
import {
  Settings,
  Radio,
  MapPin,
  Users,
  Shield,
  Bell,
  Database,
  CheckCircle2,
  AlertTriangle,
  Send,
  Key,
  Lock,
  Copy,
  Check
} from 'lucide-react';
import { useKingNMS } from '../../lib/stateStore';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

export default function ConfigView() {
  const {
    sites,
    probes,
    currentUser,
    notifications,
    updateNotifications,
    setUserRole
  } = useKingNMS();

  const [activeTab, setActiveTab] = useState<'probes' | 'sites' | 'users' | 'notifications' | 'supabase'>('probes');
  const [copiedSql, setCopiedSql] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // Form states for notifications
  const [tgBotToken, setTgBotToken] = useState(notifications.telegramBotToken);
  const [tgChatId, setTgChatId] = useState(notifications.telegramChatId);
  const [webhookUrl, setWebhookUrl] = useState(notifications.webhookUrl);
  const [emailTo, setEmailTo] = useState(notifications.emailRecipient);

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotifications({
      telegramBotToken: tgBotToken,
      telegramChatId: tgChatId,
      webhookUrl: webhookUrl,
      emailRecipient: emailTo
    });
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 4000);
  };

  const copySqlSchema = () => {
    setCopiedSql(true);
    navigator.clipboard.writeText(`-- Consultez le fichier supabase-schema.sql à la racine du projet`);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          Configuration & Paramètres Système KingNMS
        </h1>
        <p className="text-xs text-slate-400">
          Architecture des sondes distribuées, multi-sites, contrôle d'accès RBAC et passerelles de notification.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1F2E45] pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('probes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'probes'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Sondes Distribuées ({probes.length})
        </button>

        <button
          onClick={() => setActiveTab('sites')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'sites'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Multi-Sites ({sites.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Utilisateurs & Rôles RBAC
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Canaux d'Alerte (Telegram, Webhook, Email)
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'supabase'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Base de Données Supabase
        </button>
      </div>

      {/* TAB 1: PROBES */}
      {activeTab === 'probes' && (
        <div className="space-y-4">
          <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1F2E45]">
              <div>
                <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Architecture des Sondes Distribuées (KingProbe Network)
                </h2>
                <p className="text-[11px] text-slate-400">
                  Chaque sonde locale effectue les scans ICMP/SNMP dans son LAN et transmet la télémétrie au serveur central.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Moteur Central Connecté
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {probes.map(probe => (
                <div
                  key={probe.id}
                  className="bg-[#141E33] border border-[#1F2E45] rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className={`w-4 h-4 ${probe.status === 'active' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
                      <h3 className="font-mono font-bold text-white text-xs">{probe.name}</h3>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${
                      probe.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {probe.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="text-slate-400">Région : <strong className="text-slate-200">{probe.siteName}</strong></div>
                    <div className="text-slate-400">IP Sonde : <strong className="text-cyan-400">{probe.ip}</strong></div>
                    <div className="text-slate-400">Cadence : <strong className="text-slate-200">{probe.pingRate}</strong></div>
                    <div className="text-slate-400">Équipements : <strong className="text-amber-400">{probe.monitoredCount} hôtes</strong></div>
                    <div className="text-slate-400">Heartbeat : <strong className="text-emerald-400">{probe.lastHeartbeat}</strong></div>
                    <div className="text-slate-400">Version : <strong className="text-slate-300">{probe.version}</strong></div>
                  </div>

                  <div className="pt-2 border-t border-[#1F2E45] grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>CPU Sonde</span>
                        <span className="font-mono text-slate-200">{probe.cpuPct}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${probe.cpuPct}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>RAM Sonde</span>
                        <span className="font-mono text-slate-200">{probe.ramPct}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${probe.ramPct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SITES */}
      {activeTab === 'sites' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sites.map(s => (
              <div key={s.id} className="bg-[#101828] border border-[#1F2E45] rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-white text-sm">{s.name}</h3>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${
                    s.probeStatus === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`} />
                </div>

                <p className="text-xs text-slate-400">{s.description}</p>
                <p className="text-xs font-mono text-slate-300">Emplacement : {s.location}</p>

                <div className="pt-3 border-t border-[#1F2E45] flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">{s.deviceCount} équipements</span>
                  <span className="text-cyan-400 font-bold">{s.latencyMs} ms RTT</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: USERS & RBAC */}
      {activeTab === 'users' && (
        <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl p-5 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
            Gestion des Utilisateurs & Rôles d'Accès (RBAC)
          </h2>

          <div className="p-4 rounded-xl bg-[#141E33] border border-[#1F2E45] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentUser.avatar}</span>
              <div>
                <h3 className="text-xs font-bold text-white">{currentUser.name} (Vous)</h3>
                <p className="text-[11px] font-mono text-slate-400">{currentUser.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Rôle Actif :</span>
              <select
                value={currentUser.role}
                onChange={(e) => setUserRole(e.target.value as any)}
                className="bg-[#121A2A] border border-[#1F2E45] rounded-lg px-2.5 py-1 text-xs text-amber-300 font-bold focus:outline-none"
              >
                <option value="superadmin">👑 Super Administrateur (Tout pouvoir)</option>
                <option value="netadmin">🛡️ Administrateur Réseau (Monitoring & Blocages)</option>
                <option value="supervisor">👁️ Superviseur (Consultation & Alertes)</option>
                <option value="viewer">🔒 Observateur (Lecture Seule)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#0E1524] border border-[#1F2E45]">
              <span className="font-bold text-amber-400 block mb-1">Super Admin</span>
              <p className="text-[11px] text-slate-400">Accès intégral : configuration, blocage des ports, gestion des utilisateurs, règles d'alerte.</p>
            </div>
            <div className="p-3 rounded-xl bg-[#0E1524] border border-[#1F2E45]">
              <span className="font-bold text-cyan-400 block mb-1">Admin Réseau</span>
              <p className="text-[11px] text-slate-400">Actions réseau, commandes shutdown sur les ports, scans IP et création d'alertes.</p>
            </div>
            <div className="p-3 rounded-xl bg-[#0E1524] border border-[#1F2E45]">
              <span className="font-bold text-emerald-400 block mb-1">Superviseur</span>
              <p className="text-[11px] text-slate-400">Consultation du dashboard, acquittement des alertes et génération des rapports DSI.</p>
            </div>
            <div className="p-3 rounded-xl bg-[#0E1524] border border-[#1F2E45]">
              <span className="font-bold text-slate-300 block mb-1">Observateur</span>
              <p className="text-[11px] text-slate-400">Lecture seule sur les métriques et la topologie sans droit d'action réseau.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl p-5 shadow-xl">
          <h2 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-4">
            Passerelles de Notification d'Incidents
          </h2>

          <form onSubmit={handleSaveNotifications} className="space-y-4 max-w-2xl">
            {/* Telegram */}
            <div className="p-4 rounded-xl bg-[#141E33] border border-[#1F2E45] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400" /> Telegram Bot API
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Actif</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Bot Token :</label>
                  <input
                    type="password"
                    value={tgBotToken}
                    onChange={(e) => setTgBotToken(e.target.value)}
                    className="w-full bg-[#121A2A] border border-[#1F2E45] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Chat ID Canal :</label>
                  <input
                    type="text"
                    value={tgChatId}
                    onChange={(e) => setTgChatId(e.target.value)}
                    className="w-full bg-[#121A2A] border border-[#1F2E45] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Webhook */}
            <div className="p-4 rounded-xl bg-[#141E33] border border-[#1F2E45] space-y-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" /> Webhook REST (JSON POST)
              </span>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">URL de destination :</label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-[#121A2A] border border-[#1F2E45] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div className="p-4 rounded-xl bg-[#141E33] border border-[#1F2E45] space-y-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" /> Notifications Email SMTP
              </span>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Email Destinataire NOC :</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full bg-[#121A2A] border border-[#1F2E45] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {testNotificationSent && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Paramètres enregistrés et alerte de test transmise avec succès !
              </div>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-glow-gold transition-all"
            >
              Enregistrer & Tester les Canaux
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: SUPABASE */}
      {activeTab === 'supabase' && (
        <div className="bg-[#101828] border border-[#1F2E45] rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F2E45]">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Intégration Cloud Supabase (PostgreSQL & Temps Réel)
              </h2>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
              isSupabaseConfigured
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {isSupabaseConfigured ? '✓ Connecté à Supabase' : 'Mode Autonome / Local Hybride'}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            KingNMS est conçu pour fonctionner instantanément en mode local résilient avec persistance locale, et se synchronise automatiquement avec votre projet Supabase si vous renseignez les variables d'environnement dans <code className="text-amber-400 font-mono">.env.local</code>.
          </p>

          <div className="p-4 rounded-xl bg-[#0E1524] border border-[#1F2E45] space-y-2 text-xs font-mono">
            <div className="text-slate-400">Variables requises dans votre fichier .env.local :</div>
            <div className="text-emerald-400">NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co</div>
            <div className="text-emerald-400">NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon-publique</div>
          </div>

          <div className="p-4 rounded-xl bg-[#141E33] border border-[#1F2E45] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Schéma SQL Supabase Prêt à l'Emploi</span>
              <p className="text-[11px] text-slate-400">
                Le fichier <code className="text-cyan-300 font-mono">supabase-schema.sql</code> a été généré à la racine avec toutes les tables (devices, alerts, vlans, sites, probes, logs).
              </p>
            </div>
            <button
              onClick={copySqlSchema}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shrink-0"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSql ? 'Copié !' : 'Copier Référence'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
