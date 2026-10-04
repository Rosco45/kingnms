# 👑 King Network Management System (KingNMS)
> **Network Monitoring & Management Platform**

Plateforme professionnelle de supervision, de télémétrie temps réel et d'administration d'infrastructures réseau construite avec **Next.js**, **TypeScript**, **Tailwind CSS** et **Supabase**.

---

## 🎯 Les 5 Questions Fondamentales de KingNMS

KingNMS est conçu pour permettre aux administrateurs réseau et techniciens NOC de répondre en permanence et immédiatement à 5 questions :

1. **Quels équipements sont présents ?**
   - Moteur de découverte automatique (Scan IP CIDR, ICMP Echo, balayage ARP, requêtes SNMP MIB-II, détection OUI IEEE et classification automatique).
2. **Sont-ils disponibles ?**
   - Sondes périodiques ICMP avec mesure de latence RTT (min / moy / max), gigue, taux de perte de paquets et calcul de disponibilité globale en %.
3. **Que font-ils ?**
   - Collecte de métriques SNMP matérielles : Utilisation CPU, température des châssis, mémoire RAM utilisée/disponible, et statut détaillé des interfaces réseau (débits Ingress/Egress en Mbps, saturation %, erreurs CRC, collisions).
4. **Y a-t-il un problème ?**
   - Moteur de détection d'anomalies en temps réel avec seuils configurables (ex: port saturé à 94%, surchauffe CPU à 74°C, hôte injoignable, équipement non répertorié).
5. **Que puis-je faire immédiatement ?**
   - Actions directes de remédiation : Ping ICMP à la demande, désactivation administrative de port switch (*Shutdown / No Shutdown* via SNMP), isolement VLAN (quarantaine), et mise en liste noire MAC avec traçabilité intégrale dans le registre d'audit.

---

## 🏗️ Architecture Technique

```
                     ┌────────────────────────┐
                     │   FRONTEND / CONSOLE   │
                     │  Next.js 14 + React 18 │
                     │  Tailwind CSS Dark NOC │
                     └───────────┬────────────┘
                                 │
                         REST / WebSocket
                                 │
                     ┌───────────▼────────────┐
                     │    BACKEND API SERVER  │
                     │   Next.js API Routes   │
                     └───────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
    ┌─────▼──────┐        ┌──────▼──────┐        ┌──────▼──────┐
    │ ICMP Probe │        │ SNMP MIB-II │        │  Discovery  │
    │  Collector │        │  Collector  │        │   Engine    │
    └─────┬──────┘        └──────┬──────┘        └──────┬──────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                       ┌─────────▼──────────┐
                       │  PERSISTENCE STORE │
                       │ Supabase / Postgres│
                       │   + Local Cache    │
                       └────────────────────┘
```

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
cd /home/roserick/kingnms
npm install
```

### 2. Démarrage du serveur de développement
```bash
npm run dev
```
L'application est disponible sur : **http://localhost:3000**

### 3. Build et production
```bash
npm run build
npm start
```

---

## 🗄️ Intégration Supabase

KingNMS intègre un client Supabase avec bascule autonome résiliente. Pour connecter votre base de données PostgreSQL Supabase :

1. Créez un fichier `.env.local` à la racine :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-publique-anon
```
2. Exécutez le script SQL fourni dans **`supabase-schema.sql`** directement dans le *SQL Editor* de votre console Supabase. Toutes les tables (`devices`, `device_interfaces`, `alerts`, `new_devices`, `vlans`, `sites`, `probes`, `audit_logs`, `alert_rules`) et politiques RLS seront créées automatiquement.

---

## 🌐 Modules de la Plateforme

- **📊 Dashboard NOC** : Indicateurs de santé, compteurs (Online, Offline, Alertes, Nouveaux), bande passante temps réel (graphique SVG animé) et top des interfaces saturées.
- **🖥️ Équipements** : Inventaire filtrable par type (Routeurs, Switches, Serveurs, PC, AP Wi-Fi, Caméras, ToIP, IoT), par site et par VLAN, avec déclenchement de ping ICMP instantané.
- **🌐 Topologie Réseau Interactive** : Cartographie logique zoomable et déplaçable avec liens de débit (10GbE, 1GbE) et état visuel (vert, rouge, orange).
- **📡 Découverte Réseau** : Moteur de balayage IP paramétrable (ex: `192.168.1.0/24`) avec analyse SNMP et classification automatique.
- **📈 Monitoring Dédié** : Métriques comparatives, latences ICMP min/max, charge processeur, température, RAM et classement des *Top Talkers*.
- **🚨 Alertes & Moteur de Règles** : Acquittement d'incidents et programmation visuelle de règles de seuils conditionnels (*SI métrique > seuil PENDANT X min ALORS action*).
- **🆕 Nouveaux Équipements** : File d'attente de sécurité des adresses MAC non autorisées (Autoriser, Bloquer ou Ignorer).
- **🔐 Contrôle Réseau** : Panneau de brassage virtuel des commutateurs avec commande Shutdown/Enable sur les ports RJ45/SFP et gestion des quarantaines.
- **🏷️ Gestion VLAN** : Cartographie des sous-réseaux 802.1Q et affectation des ports.
- **📋 Journal & Audit** : Registre certifié de toutes les interventions administratives et pannes avec export CSV.
- **📑 Rapports & DSI** : Génération de rapports exécutifs avec KPI de disponibilité, identification du maillon faible et mise en page optimisée pour l'impression / PDF.
- **⚙️ Configuration** : Supervision des sondes distribuées (Cotonou, Porto-Novo, Abomey), crédentiels SNMP, passerelles de notification (Telegram, Webhook, Email) et profils RBAC.

---

## 📡 API REST Intégrée

| Méthode | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ping` | Exécute un ping ICMP réel via l'outil système Linux |
| `POST` | `/api/discovery/scan` | Lance un balayage réseau de plage IP |
| `GET` | `/api/devices` | Liste des équipements avec filtres de site et statut |
| `POST` | `/api/devices` | Enregistrement d'un nouvel équipement |
| `GET` | `/api/topology` | Graphe des nœuds et des liaisons réseau |
| `POST` | `/api/ports` | Contrôle administratif d'un port switch (UP/DOWN) |
| `GET` | `/api/alerts` | Liste des alertes et anomalies actives |

---

*Développé pour King Network Management Platform (KingNMS) - Conçu pour les exigences des réseaux d'entreprise modernes.*
