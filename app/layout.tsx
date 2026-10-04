import type { Metadata } from 'next';
import './globals.css';
import { KingNMSProvider } from '../lib/stateStore';

export const metadata: Metadata = {
  title: 'KingNMS — Network Monitoring & Management Platform',
  description: 'Portail de Supervision d’Équipements Réseau, surveillance ICMP/SNMP temps réel, topologie interactive et contrôle réseau pour techniciens et administrateurs.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-[#0B0F17] text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
        <KingNMSProvider>
          {children}
        </KingNMSProvider>
      </body>
    </html>
  );
}
