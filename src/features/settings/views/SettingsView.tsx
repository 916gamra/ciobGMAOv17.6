import React, { useState, useRef } from 'react';
import { GlassCard } from '@/shared/components/GlassCard';
import { Database, Download, Upload, Trash2, Shield, Bell, Monitor, LogOut, RefreshCw, Loader2 } from 'lucide-react';
import { db, User } from '@/core/db';
import * as Dialog from '@radix-ui/react-dialog';
import { runDatabaseSeed } from '@/core/db/useDatabaseSeeder';
import { useDataVault } from '../hooks/useDataVault';

export function SettingsView({ onLogout, user }: { onLogout?: () => void, user?: User | null }) {
  const [activeSection, setActiveSection] = useState<'appearance' | 'data'>('appearance');
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  
  const { exportBackup, importBackup, isExporting, isImporting } = useDataVault();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearDatabase = async () => {
    setIsClearing(true);
    try {
      await db.transaction('rw', [db.pdrFamilies, db.pdrTemplates, db.pdrBlueprints, db.inventory, db.movements], async () => {
        await db.pdrFamilies.clear();
        await db.pdrTemplates.clear();
        await db.pdrBlueprints.clear();
        await db.inventory.clear();
        await db.movements.clear();
      });
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to clear database", error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    await runDatabaseSeed(true)();
    setSeedSuccess(true);
    setTimeout(() => setSeedSuccess(false), 3000);
    setIsSeeding(false);
  };

  const handleExportData = async () => {
    try {
      await exportBackup();
    } catch (error) {
      console.error("Failed to export data", error);
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importBackup(file);
      window.location.reload(); // Refresh to ensure state captures new data
    } catch (error) {
      console.error("Failed to import backup");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 lg:px-8 relative z-10">
      <header className="mb-8 flex justify-between items-end flex-shrink-0">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">System Settings</h1>
          <p className="text-slate-400 text-lg">Manage application preferences and local database.</p>
        </div>
        {onLogout && (
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        )}
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 relative">
        {/* Settings Navigation */}
        <div className="space-y-2 shrink-0">
          <button 
            onClick={() => setActiveSection('appearance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${activeSection === 'appearance' ? 'bg-[white/5] border border-white/10 text-white' : 'hover:bg-white/5 border border-transparent text-slate-400 hover:text-white'}`}
          >
            <Monitor className={`w-5 h-5 ${activeSection === 'appearance' ? 'text-[blue-500]' : ''}`} />
            Appearance
          </button>
          <button 
            onClick={() => setActiveSection('data')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${activeSection === 'data' ? 'bg-[white/5] border border-white/10 text-white' : 'hover:bg-white/5 border border-transparent text-slate-400 hover:text-white'}`}
          >
            <Database className={`w-5 h-5 ${activeSection === 'data' ? 'text-[blue-500]' : ''}`} />
            Data Management
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent text-slate-400 hover:text-white font-medium transition-colors">
            <Bell className="w-5 h-5" />
            Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent text-slate-400 hover:text-white font-medium transition-colors">
            <Shield className="w-5 h-5" />
            Security
          </button>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3 space-y-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 pb-4">
          {activeSection === 'appearance' && (
            <GlassCard className="space-y-6">
              <h2 className="text-[14px] font-semibold uppercase tracking-[0.05em] text-slate-400 border-b border-white/10 pb-3">
                Appearance
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-medium text-white">Theme</h3>
                    <p className="text-[13px] text-slate-400 mt-1">Application is currently optimized for dark mode environments.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg p-1">
                    <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-[white/5] text-white shadow-sm">
                      Dark
                    </button>
                    <button className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 opacity-50 cursor-not-allowed">
                      Light
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {activeSection === 'data' && (
            <GlassCard className="space-y-6">
              <h2 className="text-[14px] font-semibold uppercase tracking-[0.05em] text-slate-400 border-b border-white/10 pb-3">
                Data Management (Offline DB)
              </h2>
              
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[15px] font-medium text-[blue-500]">Seed Sample Data</h3>
                    <p className="text-[13px] text-slate-400 mt-1">Populate the database with sample maintenance data for testing.</p>
                  </div>
                  <button 
                    onClick={handleSeedDatabase}
                    disabled={isSeeding}
                    className="flex items-center gap-2 bg-[blue-500] hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
                    {isSeeding ? 'Seeding...' : 'Seed DB'}
                  </button>
                </div>
                
                {seedSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                    Database seeded successfully. Check PDR Dashboard.
                  </div>
                )}

                <div className="h-px w-full bg-[white/10]" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[15px] font-medium text-white">Export Database</h3>
                    <p className="text-[13px] text-slate-400 mt-1">Download a JSON backup of all spare parts, stock movements, and structure.</p>
                  </div>
                  <button 
                    onClick={handleExportData}
                    disabled={isExporting || isImporting}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isExporting ? 'Exporting...' : 'Export JSON'}
                  </button>
                </div>

                <div className="h-px w-full bg-[white/10]" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <div>
                    <h3 className="text-[15px] font-medium text-amber-500 flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Restore from Vault (Backup)
                    </h3>
                    <p className="text-[13px] text-slate-400 mt-1">
                      Upload a `.json` backup file. <strong className="text-red-400">WARNING: This replaces the entire local database.</strong>
                    </p>
                  </div>
                  <input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImportData} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExporting || isImporting}
                    className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-500 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isImporting ? 'Restoring...' : 'Restore JSON'}
                  </button>
                </div>

                <div className="h-px w-full bg-[white/10]" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[15px] font-medium text-red-400">Clear Database</h3>
                    <p className="text-[13px] text-slate-400 mt-1">Permanently delete all local data. This action cannot be undone.</p>
                  </div>
                  
                  <Dialog.Root>
                    <Dialog.Trigger asChild>
                      <button className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors shrink-0">
                        <Trash2 className="w-4 h-4" />
                        Clear Data
                      </button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
                      <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-transparent border border-white/10 rounded-2xl p-6 z-50 shadow-2xl">
                        <Dialog.Title className="text-lg font-semibold text-red-400 mb-2">Are you absolutely sure?</Dialog.Title>
                        <Dialog.Description className="text-[14px] text-slate-400 mb-6">
                          This action cannot be undone. This will permanently delete all spare parts and stock movement history from your local browser database.
                        </Dialog.Description>
                        
                        <div className="flex justify-end gap-3">
                          <Dialog.Close asChild>
                            <button className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                              Cancel
                            </button>
                          </Dialog.Close>
                          <Dialog.Close asChild>
                            <button 
                              onClick={handleClearDatabase}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                              Yes, delete everything
                            </button>
                          </Dialog.Close>
                        </div>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </div>
                
                {clearSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                    Database cleared successfully.
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Remove activeSection === 'users' logic, as users are managed in System Config / User Management View now */}
        </div>
      </div>
    </div>
  );
}

