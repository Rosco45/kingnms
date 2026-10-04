import { NextResponse } from 'next/server';
import { INITIAL_DEVICES } from '../../../lib/mockData';

export async function GET() {
  const nodes = [
    { id: 'cloud-wan', label: 'INTERNET / WAN FIBRE', type: 'cloud', status: 'UP', x: 450, y: 50 },
    ...INITIAL_DEVICES.map((d, i) => {
      // Calculate coordinates for visual topology tree
      let x = 450;
      let y = 200;
      if (d.type === 'router') {
        x = 350 + (i % 3) * 150;
        y = 150;
      } else if (d.type === 'switch') {
        x = 200 + (i % 4) * 180;
        y = 280;
      } else if (d.type === 'server') {
        x = 120 + (i % 5) * 160;
        y = 420;
      } else {
        x = 80 + (i % 6) * 140;
        y = 560;
      }
      return {
        id: d.id,
        label: d.hostname,
        ip: d.ip,
        type: d.type,
        status: d.status,
        vendor: d.vendor,
        siteId: d.siteId,
        vlanId: d.vlanId,
        x,
        y
      };
    })
  ];

  const links = [
    { from: 'cloud-wan', to: 'dev-rt-core-01', speed: '1 Gbps', label: 'Lien Fibre FTTB' },
    { from: 'dev-rt-core-01', to: 'dev-sw-core-01', speed: '10 Gbps', label: 'Trunk Te0/1/0' },
    { from: 'dev-sw-core-01', to: 'dev-sw-access-02', speed: '1 Gbps', label: 'Trunk Gi1/0/1' },
    { from: 'dev-sw-core-01', to: 'dev-srv-web-prod', speed: '10 Gbps', label: 'LACP Gi1/0/2' },
    { from: 'dev-sw-core-01', to: 'dev-srv-db-01', speed: '10 Gbps', label: 'Gi1/0/3' },
    { from: 'dev-sw-core-01', to: 'dev-nas-backup-01', speed: '10 Gbps', label: 'Gi1/0/24 (94%)' },
    { from: 'dev-sw-core-01', to: 'dev-srv-test-lab', speed: '1 Gbps', label: 'Gi1/0/45' },
    { from: 'dev-sw-access-02', to: 'dev-ap-wifi-hall', speed: '1 Gbps', label: 'PoE Port 2' },
    { from: 'dev-sw-access-02', to: 'dev-pc-admin', speed: '1 Gbps', label: 'Port 3' },
    { from: 'dev-sw-access-02', to: 'dev-prn-compta', speed: '100 Mbps', label: 'Port 4' },
    { from: 'dev-sw-core-01', to: 'dev-cam-entree', speed: '100 Mbps', label: 'VLAN 50' },
    { from: 'dev-sw-core-01', to: 'dev-phone-dir', speed: '1 Gbps', label: 'VLAN 60' },
    { from: 'dev-sw-core-01', to: 'dev-pc-compta-02', speed: '1 Gbps', label: 'Port Gi1/0/17' },
    { from: 'dev-sw-core-01', to: 'dev-iot-clim', speed: '100 Mbps', label: 'Port Gi1/0/32' },
    // Inter-site links
    { from: 'dev-rt-core-01', to: 'dev-rt-porto', speed: '200 Mbps', label: 'Tunnel IPsec Cotonou-Porto' },
    { from: 'dev-rt-porto', to: 'dev-sw-porto', speed: '1 Gbps', label: 'Trunk ether1' },
    { from: 'dev-sw-porto', to: 'dev-srv-porto', speed: '1 Gbps', label: 'Port 1' },
    { from: 'dev-rt-core-01', to: 'dev-rt-abomey', speed: '100 Mbps', label: 'Faisceau Hertzien SD-WAN' },
    { from: 'dev-rt-abomey', to: 'dev-sw-abomey', speed: '1 Gbps', label: 'Port 1' }
  ];

  return NextResponse.json({ nodes, links });
}
