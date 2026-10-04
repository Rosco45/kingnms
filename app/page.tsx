'use client';

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar, { ActiveTab } from '../components/Sidebar';
import DashboardView from '../components/views/DashboardView';
import DevicesView from '../components/views/DevicesView';
import TopologyView from '../components/views/TopologyView';
import DiscoveryView from '../components/views/DiscoveryView';
import MonitoringView from '../components/views/MonitoringView';
import AlertsView from '../components/views/AlertsView';
import NewDevicesView from '../components/views/NewDevicesView';
import NetworkControlView from '../components/views/NetworkControlView';
import VlansView from '../components/views/VlansView';
import AuditView from '../components/views/AuditView';
import ReportsView from '../components/views/ReportsView';
import ConfigView from '../components/views/ConfigView';
import DeviceDetailModal from '../components/DeviceDetailModal';
import AddDeviceModal from '../components/AddDeviceModal';
import BlockDeviceModal from '../components/BlockDeviceModal';
import { Device } from '../types';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modal states
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [blockModalDevice, setBlockModalDevice] = useState<Device | null>(null);

  const handleOpenBlockModal = (device: Device) => {
    setBlockModalDevice(device);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col text-slate-100">
      {/* Top Navigation Bar */}
      <Navbar
        onOpenAddDevice={() => setIsAddDeviceOpen(true)}
        onOpenScan={() => setActiveTab('discovery')}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dynamic Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* View Content Body */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-gradient-to-b from-[#0B0F17] via-[#0E1422] to-[#0B0F17]">
          {activeTab === 'dashboard' && (
            <DashboardView
              onSelectDevice={(dev) => setSelectedDevice(dev)}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenScan={() => setActiveTab('discovery')}
              onOpenAddDevice={() => setIsAddDeviceOpen(true)}
            />
          )}

          {activeTab === 'devices' && (
            <DevicesView
              onSelectDevice={(dev) => setSelectedDevice(dev)}
              onOpenAddDevice={() => setIsAddDeviceOpen(true)}
              onOpenBlockModal={handleOpenBlockModal}
            />
          )}

          {activeTab === 'topology' && (
            <TopologyView
              onSelectDevice={(dev) => setSelectedDevice(dev)}
            />
          )}

          {activeTab === 'discovery' && (
            <DiscoveryView
              onOpenAddDevice={() => setIsAddDeviceOpen(true)}
            />
          )}

          {activeTab === 'monitoring' && (
            <MonitoringView
              onSelectDevice={(dev) => setSelectedDevice(dev)}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsView />
          )}

          {activeTab === 'new_devices' && (
            <NewDevicesView />
          )}

          {activeTab === 'control' && (
            <NetworkControlView />
          )}

          {activeTab === 'vlans' && (
            <VlansView
              onSelectDevice={(dev) => setSelectedDevice(dev)}
            />
          )}

          {activeTab === 'audit' && (
            <AuditView />
          )}

          {activeTab === 'reports' && (
            <ReportsView />
          )}

          {activeTab === 'config' && (
            <ConfigView />
          )}
        </main>
      </div>

      {/* Global Modals */}
      {selectedDevice && (
        <DeviceDetailModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onOpenBlockModal={handleOpenBlockModal}
        />
      )}

      <AddDeviceModal
        isOpen={isAddDeviceOpen}
        onClose={() => setIsAddDeviceOpen(false)}
      />

      <BlockDeviceModal
        device={blockModalDevice}
        isOpen={Boolean(blockModalDevice)}
        onClose={() => setBlockModalDevice(null)}
      />
    </div>
  );
}
