'use client';

import React, { useState } from 'react';
import { Search, Mail } from 'lucide-react';
import Badge from '../components/ui/Badge';
import ContextVehiclesTab from '../components/context/ContextVehiclesTab';
import ContextDriversTab from '../components/context/ContextDriversTab';
import ContextClientsTab from '../components/context/ContextClientsTab';
import ContextTripsTab from '../components/context/ContextTripsTab';
import ContextMaintenanceTab from '../components/context/ContextMaintenanceTab';
import ContextConflictsTab from '../components/context/ContextConflictsTab';
import ContextSourcesTab from '../components/context/ContextSourcesTab';

type ContextTab =
  | 'Vehicles'
  | 'Drivers'
  | 'Clients'
  | 'Trips'
  | 'Maintenance'
  | 'Tickets'
  | 'Emails'
  | 'Conflicts'
  | 'Sources';

export default function ContextExplorerPage() {
  const [activeTab, setActiveTab] = useState<ContextTab>('Vehicles');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: ContextTab[] = [
    'Vehicles',
    'Drivers',
    'Clients',
    'Trips',
    'Maintenance',
    'Tickets',
    'Emails',
    'Conflicts',
    'Sources',
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Context Explorer</span>
            <Badge variant="cyan" dot pulse>
              Provenance Graph
            </Badge>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Explore normalized entities, authoritative data sources, and automated conflict resolution.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            className="pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64 sm:w-80"
          />
        </div>
      </div>

      {/* 9 Category Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Render Modular Tab Components */}
      {activeTab === 'Vehicles' && <ContextVehiclesTab searchQuery={searchQuery} />}
      {activeTab === 'Drivers' && <ContextDriversTab searchQuery={searchQuery} />}
      {activeTab === 'Clients' && <ContextClientsTab searchQuery={searchQuery} />}
      {activeTab === 'Trips' && <ContextTripsTab searchQuery={searchQuery} />}
      {activeTab === 'Maintenance' && <ContextMaintenanceTab searchQuery={searchQuery} />}
      {activeTab === 'Conflicts' && <ContextConflictsTab searchQuery={searchQuery} />}
      {activeTab === 'Sources' && <ContextSourcesTab searchQuery={searchQuery} />}

      {/* Fallback for Tickets or Emails */}
      {(activeTab === 'Tickets' || activeTab === 'Emails') && (
        <div className="rounded-3xl glass-panel border border-slate-800 p-12 text-center space-y-2">
          <Mail className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Ingested Stream Records</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All boundary communications and SOS dispatches have been parsed, normalized, and mapped to active entity graph nodes.
          </p>
        </div>
      )}
    </div>
  );
}
