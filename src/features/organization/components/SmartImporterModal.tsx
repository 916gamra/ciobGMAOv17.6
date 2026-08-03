import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, RefreshCw, Layers } from 'lucide-react';
import { useOrganizationEngine } from '../hooks/useOrganizationEngine';
import { useMachineLibrary } from '../hooks/useMachineLibrary';
import { useNotifications } from '@/shared/hooks/useNotifications';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface SmartImporterModalProps {
  onClose: () => void;
}

export function SmartImporterModal({ onClose }: SmartImporterModalProps) {
  const { sectors, technicians, createMachine } = useOrganizationEngine();
  const { blueprints, templates } = useMachineLibrary();
  const { showSuccess, showError } = useNotifications();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [mappedRows, setMappedRows] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Mapping States
  const [colRef, setColRef] = useState<string>('');
  const [colBlueprint, setColBlueprint] = useState<string>('');
  const [colSector, setColSector] = useState<string>('');
  const [colTech, setColTech] = useState<string>('');
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    const isCsv = file.name.endsWith('.csv');
    
    if (isCsv) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setRawRows(results.data);
          setStep(2);
        },
        error: (err) => {
          showError('Parse Error', err.message);
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        try {
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          setRawRows(data);
          setStep(2);
        } catch (err: any) {
          showError('Parse Error', 'Failed to read Excel file.');
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const getHeaders = () => {
    if (rawRows.length === 0) return [];
    return Object.keys(rawRows[0]);
  };

  const handleSmartMatch = () => {
    // Generate mapped rows based on selected columns
    const processed = rawRows.map((row, index) => {
      const rawRef = row[colRef] || `UNKNOWN-${index}`;
      const rawBp = row[colBlueprint] || '';
      const rawSec = row[colSector] || '';
      const rawTech = row[colTech] || '';

      // Find references
      const bpMatch = blueprints.find(b => 
        b.reference.toLowerCase() === String(rawBp).toLowerCase() ||
        templates.find(t => t.id === b.templateId)?.name.toLowerCase() === String(rawBp).toLowerCase()
      );
      
      const secMatch = sectors.find(s => s.name.toLowerCase().includes(String(rawSec).toLowerCase()));
      const techMatch = technicians.find(t => t.name.toLowerCase().includes(String(rawTech).toLowerCase()));

      return {
        _raw: row,
        _index: index,
        referenceCode: String(rawRef),
        serialNumber: `SN-AUTO-${index}`,
        manufacturingYear: new Date().getFullYear(),
        blueprintId: bpMatch?.id || null,
        blueprintName: bpMatch?.reference || 'Not Found',
        sectorId: secMatch?.id || null,
        sectorName: secMatch?.name || 'Not Found',
        technicianId: techMatch?.id || null,
        technicianName: techMatch?.name || 'Not Found',
        isValid: !!(bpMatch && secMatch && techMatch && rawRef)
      };
    });

    setMappedRows(processed);
    setStep(3);
  };

  const handleInject = async () => {
    try {
      const validRows = mappedRows.filter(r => r.isValid);
      if (validRows.length === 0) {
        showError('No Valid Records', 'There are no correctly mapped records to inject.');
        return;
      }

      // We group by Blueprint to calculate slots efficiently
      const blueprintCounts: Record<string, number> = {};
      const { getAssetMatrixForBlueprint } = require('@/core/config/assetMatrix');
      const machinesInDb = await require('@/core/db').db.machines.toArray();
      
      const payload: any[] = [];
      let mappedValid = 0;
      let mappedError = 0;

      for (const row of validRows) {
        const bpId = row.blueprintId;
        const bpMatch = blueprints.find(b => b.id === bpId);
        if (!bpMatch) continue;

        // Ensure we know how many exist currently for this blueprint
        if (blueprintCounts[bpId] === undefined) {
          const existingOfThisBp = machinesInDb.filter((m: any) => m.blueprintId === bpId).length;
          blueprintCounts[bpId] = existingOfThisBp;
        }

        const currentCount = blueprintCounts[bpId];
        const matrixSlots = getAssetMatrixForBlueprint(bpId, bpMatch.reference);
        
        if (currentCount >= matrixSlots.length) {
          mappedError++;
          continue; // Cannot inject more for this blueprint
        }

        const slot = matrixSlots[currentCount]; // The next available slot 
        blueprintCounts[bpId]++; // Increment

        payload.push({
          id: slot.id,
          sectorId: row.sectorId,
          technicianId: row.technicianId,
          blueprintId: row.blueprintId,
          referenceCode: slot.referenceCode, // Enforce system-generated reference
          serialNumber: row.serialNumber, // from Auto generated or Excel
          manufacturingYear: row.manufacturingYear,
          status: 'Active'
        });
        
        mappedValid++;
      }

      const { db } = require('@/core/db');
      await db.transaction('rw', [db.machines, db.auditLogs], async () => {
         for (const mach of payload) {
           await db.machines.add(mach);
           await db.auditLogs.add({
             userId: 'SYSTEM',
             userName: 'SMART_IMPORTER',
             action: 'BULK_IMPORT_MACHINE',
             entityType: 'MACHINE',
             entityId: mach.id,
            details: `Smart Importer Injected: ${mach.referenceCode}`,
             severity: 'INFO',
             timestamp: new Date().toISOString()
           });
         }
      });

      showSuccess('Data Alchemy Complete', `Successfully Injected ${mappedValid} Machines | ${mappedError} Errors Skipped | 100% Alignment.`);
      onClose();
    } catch (err: any) {
      showError('Injection Failed', err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
       <motion.div 
         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
         className="absolute inset-0 bg-black/80 backdrop-blur-md"
         onClick={onClose}
       />
       
       <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-5xl h-[85vh] bg-[#0a0f18] border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)] rounded-3xl overflow-hidden flex flex-col"
       >
         <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
         
         <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Layers className="w-6 h-6 text-emerald-400" />
                Smart Importer Engine
              </h2>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Bridging Legacy Data into BDR Nexus</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl border border-white/5 hover:bg-white/5 text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
         </div>

         <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            {step === 1 && (
              <div className="h-full flex flex-col items-center justify-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-emerald-400 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-emerald-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <Upload className="w-10 h-10 mb-2 relative z-10" />
                  <span className="text-[10px] font-bold uppercase tracking-widest relative z-10">Select File</span>
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">Upload Data Source</h3>
                  <p className="text-sm text-slate-400 max-w-sm">Upload your Excel (.xlsx) or CSV file containing machine data to begin the alignment process.</p>
                </div>
                
                <label className="cursor-pointer group">
                  <div className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">
                    Browse Files
                  </div>
                  <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 max-w-3xl mx-auto">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">Column Algebra Alignment</h3>
                  <p className="text-sm text-slate-400">Map your file's columns to BDR Nexus variables.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Nexus Variables</h4>
                    
                    <div className="space-y-4">
                      <div>
                         <label className="block text-xs font-bold text-slate-300 mb-2">Reference Code</label>
                         <select value={colRef} onChange={e=>setColRef(e.target.value)} className="w-full bg-[#12141c] border border-white/10 rounded-lg p-2 text-sm text-white">
                            <option value="">-- Select Column --</option>
                            {getHeaders().map(h => <option key={h} value={h}>{h}</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-300 mb-2">Machine Blueprint (Model)</label>
                         <select value={colBlueprint} onChange={e=>setColBlueprint(e.target.value)} className="w-full bg-[#12141c] border border-white/10 rounded-lg p-2 text-sm text-white">
                            <option value="">-- Select Column --</option>
                            {getHeaders().map(h => <option key={h} value={h}>{h}</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-300 mb-2">Sector</label>
                         <select value={colSector} onChange={e=>setColSector(e.target.value)} className="w-full bg-[#12141c] border border-white/10 rounded-lg p-2 text-sm text-white">
                            <option value="">-- Select Column --</option>
                            {getHeaders().map(h => <option key={h} value={h}>{h}</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-300 mb-2">Owner (Technician)</label>
                         <select value={colTech} onChange={e=>setColTech(e.target.value)} className="w-full bg-[#12141c] border border-white/10 rounded-lg p-2 text-sm text-white">
                            <option value="">-- Select Column --</option>
                            {getHeaders().map(h => <option key={h} value={h}>{h}</option>)}
                         </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col justify-center items-center text-center space-y-4">
                     <FileSpreadsheet className="w-16 h-16 text-indigo-400 opacity-50" />
                     <div>
                       <div className="text-sm font-bold text-white">Parsed File</div>
                       <div className="text-xs text-indigo-400">{rawRows.length} Rows Detected</div>
                     </div>
                     <button 
                        onClick={handleSmartMatch}
                        disabled={!colRef || !colBlueprint}
                        className="mt-6 w-full px-6 py-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
                     >
                       Run Smart Match
                     </button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="h-full flex flex-col">
                <div className="flex justify-between items-end mb-6 shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Preview & Fix</h3>
                    <p className="text-xs text-slate-400">Review alignments before injecting data into the registry.</p>
                  </div>
                  <div className="flex gap-4 items-center bg-black/40 px-4 py-2 rounded-lg border border-white/5">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500" />
                       <span className="text-xs font-bold text-white">{mappedRows.filter(r => r.isValid).length} Valid</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-amber-500" />
                       <span className="text-xs font-bold text-white">{mappedRows.filter(r => !r.isValid).length} Invalid</span>
                     </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar border border-white/5 rounded-2xl bg-black/20">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#0f111a] text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-3 font-medium border-b border-white/5">Status</th>
                        <th className="px-4 py-3 font-medium border-b border-white/5">Reference</th>
                        <th className="px-4 py-3 font-medium border-b border-white/5">Blueprint Match</th>
                        <th className="px-4 py-3 font-medium border-b border-white/5">Sector Match</th>
                        <th className="px-4 py-3 font-medium border-b border-white/5">Tech Match</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {mappedRows.map((r, i) => (
                        <tr key={i} className={r.isValid ? "hover:bg-white/[0.02]" : "bg-amber-500/5 border-l-2 border-l-amber-500"}>
                          <td className="px-4 py-3">
                            {r.isValid ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          </td>
                          <td className="px-4 py-3 font-mono text-white">{r.referenceCode}</td>
                          <td className={`px-4 py-3 ${r.blueprintId ? 'text-emerald-400' : 'text-amber-400 font-bold'}`}>{r.blueprintName}</td>
                          <td className={`px-4 py-3 ${r.sectorId ? 'text-indigo-400' : 'text-slate-500'}`}>{r.sectorName}</td>
                          <td className={`px-4 py-3 ${r.technicianId ? 'text-indigo-400' : 'text-slate-500'}`}>{r.technicianName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-between items-center shrink-0">
                  <button onClick={() => setStep(2)} className="px-6 py-2 border border-white/10 rounded-xl text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors">
                    Back to Selection
                  </button>
                  <button 
                    onClick={handleInject}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Inject into Registry
                  </button>
                </div>
              </div>
            )}
         </div>
       </motion.div>
    </div>
  );
}
