import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useExcelStorage } from '@/core/excel/excelStorage';
import { ExcelEngine } from '@/core/excel/excelEngine';
import { ALL_TEMPLATES, getTemplatesByPortal } from '@/core/excel/templates';
import { Download, Upload, FileText, Trash2, Plus, RefreshCw, Box, Database } from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { db } from '@/core/db';
import { GlassCard } from '@/shared/components/GlassCard';

interface ExcelManagerProps {
  portalId: 'PDR' | 'PREVENTIVE' | 'ORGANIZATION' | 'FACTORY' | 'ANALYTICS' | 'SETTINGS';
}

export function ExcelManager({ portalId }: ExcelManagerProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'backups' | 'templates'>('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError, showWarning } = useNotifications();

  const {
    backups,
    createBackup,
    restoreBackup,
    deleteBackup,
    syncWithDatabase
  } = useExcelStorage();

  const templates = getTemplatesByPortal(portalId);
  const portalBackups = backups.filter(b => b.portalId === portalId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleImportFile = async (file: File) => {
    try {
      setIsLoading(true);

      const template = getTemplatesByPortal(portalId)[0] || Object.values(ALL_TEMPLATES)[0];

      if (!template) {
        throw new Error('No template found for this portal.');
      }

      const result = await ExcelEngine.readExcelFile(file, template);

      if (!result.success) {
        const errorMessages = result.errors
          .filter(e => e.severity === 'error')
          .map(e => `Row ${e.row}: ${e.message}`)
          .slice(0, 5)
          .join('\n');

        throw new Error(`Import failed:\n${errorMessages}`);
      }

      const backupData: Record<string, any> = {};
      for (const sheet of template.sheets) {
        if (sheet.data && sheet.data.length > 0) {
          const table = (db as any)[sheet.tableName];
          if (table) {
             const existingData = await table.toArray();
             backupData[sheet.tableName] = existingData; // Backup existing data
             await table.clear(); // Clear existing
             await table.bulkAdd(sheet.data); // Add new
          }
        }
      }

      await createBackup(portalId, file.name, backupData);
      await syncWithDatabase(portalId);

      if (result.warnings.length > 0) {
        showWarning(`Imported ${result.importedRows} rows.`, `${result.warnings.length} warnings.`);
      } else {
        showSuccess(`Imported ${result.importedRows} rows successfully.`);
      }

      setSelectedFile(null);
    } catch (error: any) {
      showError('Import Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async (templateId: string) => {
    try {
      setIsLoading(true);

      const template = ALL_TEMPLATES[templateId];
      if (!template) {
        throw new Error('Template not found.');
      }

      // Clone template to avoid mutating the original
      const templateClone = JSON.parse(JSON.stringify(template));

      for (const sheet of templateClone.sheets) {
        const table = (db as any)[sheet.tableName];
        if (table) {
          sheet.data = await table.toArray();
        }
      }

      const buffer = await ExcelEngine.writeExcelFile(
        templateClone,
        `${templateClone.name}_${new Date().toISOString().split('T')[0]}.xlsx`
      );

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.name}_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess('Data exported successfully.');
    } catch (error: any) {
      showError('Export Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    try {
      setIsLoading(true);
      await restoreBackup(backupId);
      showSuccess('Backup restored successfully.');
    } catch (error: any) {
      showError('Restore Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Tabs matching Glassmorphism */}
      <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto custom-scrollbar">
        {['import', 'export', 'backups', 'templates'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide uppercase transition-all shrink-0 ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] border border-blue-500'
                : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            {tab === 'import' && <><Upload className="w-4 h-4" /> Import</>}
            {tab === 'export' && <><Download className="w-4 h-4" /> Export</>}
            {tab === 'backups' && <><Database className="w-4 h-4" /> Backups</>}
            {tab === 'templates' && <><FileText className="w-4 h-4" /> Templates</>}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
      {/* Import View */}
      {activeTab === 'import' && (
        <GlassCard className="p-8 flex flex-col items-center justify-center text-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setSelectedFile(file);
                handleImportFile(file);
              }
            }}
            className="hidden"
            id="excel-file-input"
            disabled={isLoading}
          />
          <label 
            htmlFor="excel-file-input" 
            className="cursor-pointer border-2 border-dashed border-blue-500/30 hover:border-blue-500 bg-blue-500/5 hover:bg-blue-500/10 rounded-2xl w-full max-w-xl py-16 transition-all duration-300 flex flex-col items-center group"
          >
            {isLoading ? (
               <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            ) : (
               <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-blue-500/30">
                  <Upload className="w-8 h-8 text-blue-400" />
               </div>
            )}
            <h3 className="text-xl font-bold text-slate-200 tracking-tight mb-2">Select Excel file to start</h3>
            <p className="text-slate-500 text-sm max-w-sm">
              Upload templates with data to automatically build your relational database.
            </p>
          </label>
        </GlassCard>
      )}

      {/* Export View */}
      {activeTab === 'export' && (
        <GlassCard className="p-6 h-[400px] overflow-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleExportData(template.id)}
                disabled={isLoading}
                className="flex items-start gap-4 p-5 rounded-xl border border-white/10 hover:border-blue-500/50 bg-black/40 hover:bg-black/60 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 transition-colors">
                  <Download className="w-6 h-6 text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 mb-1 group-hover:text-blue-400 transition-colors tracking-tight">{template.name}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{template.description}</p>
                </div>
              </button>
            ))}
            {templates.length === 0 && (
               <div className="col-span-2 text-center py-12 text-slate-500">
                 No export templates configured for this portal yet.
               </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Backups View */}
      {activeTab === 'backups' && (
        <GlassCard className="p-6 h-[400px] overflow-auto custom-scrollbar">
          {portalBackups.length === 0 ? (
            <div className="text-center py-20 text-slate-500 flex flex-col items-center">
               <Box className="w-12 h-12 mb-4 opacity-30" />
               <p>No excel sync history available.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {portalBackups.map(backup => (
                <div key={backup.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/40 hover:bg-black/60 transition-colors group">
                  <div>
                    <h4 className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{backup.fileName}</h4>
                    <div className="flex gap-4 mt-1 text-[11px] text-slate-500 uppercase tracking-widest font-mono">
                      <span>{backup.rowCount} Rows</span>
                      <span>{(backup.fileSize / 1024).toFixed(1)} KB</span>
                      <span>{new Date(backup.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-10 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleRestoreBackup(backup.id)}
                      disabled={isLoading}
                      className="p-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-lg transition-colors border border-blue-500/20"
                      title="Restore from Backup"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteBackup(backup.id)}
                      disabled={isLoading}
                      className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-colors border border-rose-500/20"
                      title="Delete Backup"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* Templates View */}
      {activeTab === 'templates' && (
        <GlassCard className="p-6 h-[400px] overflow-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <div key={template.id} className="flex flex-col p-5 rounded-xl border border-white/10 bg-black/40">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 leading-tight tracking-tight">{template.name}</h4>
                    <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono mt-1 block">v{template.version}</span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 leading-relaxed mb-6 flex-1">
                  {template.description}
                </p>

                <button
                  onClick={() => handleExportData(template.id)}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  Download Schema
                </button>
              </div>
            ))}
            {templates.length === 0 && (
               <div className="col-span-full text-center py-12 text-slate-500">
                 No import templates active.
               </div>
            )}
          </div>
        </GlassCard>
      )}
      </AnimatePresence>
    </div>
  );
}
