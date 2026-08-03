import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, QrCode, Cpu, ShieldCheck, User, MapPin, Settings2, Boxes } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';

interface MachineDigitalIdModalProps {
  machine: any | null;
  onClose: () => void;
}

export function MachineDigitalIdModal({ machine, onClose }: MachineDigitalIdModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Read associated data
  const blueprint = useLiveQuery(() => 
    machine?.blueprintId ? db.machineBlueprints.get(machine.blueprintId) : null
  , [machine]);

  // Read associated PDR data
  const pdrTemplates = useLiveQuery(() => db.pdrTemplates.toArray(), []) || [];
  const pdrBlueprints = useLiveQuery(() => db.pdrBlueprints.toArray(), []) || [];

  const allTasks = useLiveQuery(() => db.preventiveTasks.toArray(), []) || [];
  const executions = useLiveQuery(() => 
    machine ? db.taskExecutions.where('machineId').equals(machine.id).toArray() : []
  , [machine]) || [];
  const actions = useLiveQuery(() => db.standardActions.toArray(), []) || [];

  if (!machine) return null;

  // Resolve assembled spare parts for this blueprint
  const blueprintPdrBlueprints = blueprint?.pdrBlueprintIds 
    ? pdrBlueprints.filter(bp => blueprint.pdrBlueprintIds?.includes(bp.id)) 
    : [];

  // Derive tasks based on PDR Elements (Part templates composing the machine blueprint)
  const partTemplateIds = blueprint?.partTemplateIds || [];
  const partFamilyIds = [...new Set(pdrTemplates.filter(t => partTemplateIds.includes(t.id)).map(t => t.familyId))];

  const derivedTasks = allTasks.filter(task => {
    if (task.pdrTemplateId) {
      return partTemplateIds.includes(task.pdrTemplateId);
    }
    if (task.pdrFamilyId) {
      return partFamilyIds.includes(task.pdrFamilyId);
    }
    return false;
  });

  // Resolve the primary technician & sector names
  const techName = machine.technicianName || 'Unassigned';
  const sectorName = machine.sectorName || 'No Sector Registered';

  const handlePrintLabel = () => {
    const printContent = printAreaRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print asset labels.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>BDR Nexus Label - ${machine.referenceCode}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; color: black; background: white; }
              .label-card { border: 4px solid black; padding: 30px; max-width: 450px; margin: 0 auto; page-break-inside: avoid; border-radius: 12px; }
              .branding { font-size: 24px; font-weight: 900; letter-spacing: 2px; margin-bottom: 5px; border-bottom: 2px solid black; padding-bottom: 8px; }
              .asset-code { font-size: 38px; font-weight: 1000; font-family: monospace; letter-spacing: 1px; margin: 15px 0; }
              .details { text-align: left; font-size: 13px; line-height: 1.6; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 12px 0; margin: 15px 0; }
              .details-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
              .details-label { font-weight: bold; text-transform: uppercase; color: #555; }
              .details-value { font-family: monospace; font-weight: bold; }
              .qr-stub { display: inline-block; width: 140px; height: 140px; margin: 15px auto; padding: 5px; border: 2px solid black; }
              .footer-text { font-size: 9px; font-weight: bold; letter-spacing: 1px; color: #777; text-transform: uppercase; margin-top: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="branding">BDR NEXUS - CIOB MAROC</div>
            <div class="asset-code">${machine.referenceCode}</div>
            
            <div class="qr-stub">
              <!-- Inline simulated clean QR matrix for printing -->
              <svg viewBox="0 0 100 100" width="100%" height="100%" style="display: block; shape-rendering: crispEdges;">
                <path d="M0,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z M70,0 h30 v30 h-30 z M80,10 h10 v10 h-10 z M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z" fill="black" />
                <path d="M35,5 h5 v10 h-5 z M45,0 h10 v5 h-10 z M60,10 h5 v5 h-5 z M40,20 h15 v5 h-15 z" fill="black" />
                <path d="M5,35 h15 v5 h-15 z M15,45 h25 v10 h-25 z M0,60 h10 v5 h-10 z M45,35 h10 v5 h-10 z M35,45 h5 v5 h-5 z" fill="black" />
                <path d="M70,35 h5 v10 h-5 z M80,45 h15 v10 h-15 z M90,60 h10 v5 h-10 z M65,45 h10 v15 h-10 z M55,65 h15 v5 h-15 z" fill="black" />
                <path d="M35,70 h10 v10 h-10 z M45,85 h20 v10 h-20 z M55,75 h5 v5 h-5 z M90,80 h10 v10 h-10 z m-10,10 h5 v5 h-5 z" fill="black" />
              </svg>
            </div>

            <div class="details">
              <div class="details-row"><span class="details-label">Machine Name:</span><span class="details-value">${machine.name}</span></div>
              <div class="details-row"><span class="details-label">Model Ref:</span><span class="details-value">${blueprint?.reference || 'N/A'}</span></div>
              <div class="details-row"><span class="details-label">Sector:</span><span class="details-value">${sectorName}</span></div>
              <div class="details-row"><span class="details-label">Owner Tech:</span><span class="details-value">${techName}</span></div>
              <div class="details-row"><span class="details-label">Serial Code:</span><span class="details-value">${machine.serialNumber}</span></div>
              <div class="details-row"><span class="details-label">Spare Parts:</span><span class="details-value">${blueprintPdrBlueprints.length} commercial parts</span></div>
            </div>
            <div class="footer-text">SCAN MACHINE TO ACCESS DNA PREVENTIVE PROTOCOL</div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 300);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="relative w-full max-w-2xl bg-[#090b11] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Top styling strip */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
                Digital ID & QR Card
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Physical Identification Tag Generating Engine - Ciob Maroc</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Left Column: Outer ID Tag styling (The card itself) */}
            <div className="p-6 bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 rounded-2xl flex flex-col items-center justify-center relative group min-h-[340px] text-center">
              {/* Card Glare effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none rounded-2xl transition-opacity group-hover:opacity-100" />
              
              <p className="text-[9px] font-bold tracking-widest text-emerald-400/80 mb-2 uppercase">BDR NEXUS DIGITAL ID</p>
              <h4 className="text-2xl font-black text-white font-mono tracking-wider mb-6 bg-black/40 px-4 py-1.5 rounded-xl border border-white/5">
                {machine.referenceCode}
              </h4>
              
              {/* Authentic styled QR code vector canvas */}
              <div className="w-40 h-40 bg-white p-3 rounded-2xl shadow-2xl relative mb-6">
                <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ shapeRendering: 'crispEdges' }}>
                  {/* Outer Anchor Top-Left */}
                  <path d="M0,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z" fill="black" />
                  {/* Outer Anchor Top-Right */}
                  <path d="M70,0 h30 v30 h-30 z M80,10 h10 v10 h-10 z" fill="black" />
                  {/* Outer Anchor Bottom-Left */}
                  <path d="M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z" fill="black" />
                  {/* Standard random/fictitious QR blocks matching BDR brand blueprint */}
                  <path d="M35,5 h5 v10 h-5 z M45,0 h10 v5 h-10 z M60,10 h5 v5 h-5 z M40,20 h15 v5 h-15 z" fill="black" />
                  <path d="M5,35 h15 v5 h-15 z M15,45 h25 v10 h-25 z M0,60 h10 v5 h-10 z M45,35 h10 v5 h-10 z M35,45 h5 v5 h-5 z" fill="black" />
                  <path d="M70,35 h5 v10 h-5 z M80,45 h15 v10 h-15 z M90,60 h10 v5 h-10 z M65,45 h10 v15 h-10 z M55,65 h15 v5 h-15 z" fill="black" />
                  <path d="M35,70 h10 v10 h-10 z M45,85 h20 v10 h-20 z M55,75 h5 v5 h-5 z M90,80 h10 v10 h-10 z m-10,10 h5 v5 h-5 z" fill="black" />
                  {/* Decorative center small green logo mockup */}
                  <rect x="42" y="42" width="16" height="16" rx="4" fill="#10b981" />
                  <circle cx="50" cy="50" r="4" fill="white" />
                </svg>
              </div>

              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-medium">SCAN MACHINE IN FACTORY FLOOR</span>
            </div>

            {/* Right Column: Information Sheet */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-400" /> Physical Identification
                </h3>
                <h2 className="text-xl font-bold text-white leading-tight uppercase mb-1">{machine.name}</h2>
                <div className="flex gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase">Serial: {machine.serialNumber}</span>
                  <span className="text-xs text-slate-600 font-mono">•</span>
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase">Year: {machine.manufacturingYear}</span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-500 uppercase font-bold tracking-wider">Sector Allocation:</span>
                  <span className="text-white font-mono font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-400" /> {sectorName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-500 uppercase font-bold tracking-wider">Technician Assigned:</span>
                  <span className="text-white font-mono font-semibold flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-indigo-400" /> {techName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-500 uppercase font-bold tracking-wider">Parent DNA Model:</span>
                  <span className="text-indigo-400 font-mono font-bold">[{blueprint?.reference || 'N/A'}]</span>
                </div>
              </div>

              {/* Associated Spare Parts (BDR Catalogue) */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-mono">
                  <Boxes className="w-4 h-4 text-cyan-400" /> قطع الغيار المرتبطة ({blueprintPdrBlueprints.length})
                </h3>
                {blueprintPdrBlueprints.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">لا توجد قطع غيار تجارية مرتبطة بنموذج هذه الآلة.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                    {blueprintPdrBlueprints.map(bp => {
                      const tmpl = pdrTemplates.find(t => t.id === bp.templateId);
                      return (
                        <div key={bp.id} className="flex flex-col p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-cyan-300 font-mono">
                              {bp.id}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 uppercase">
                              {tmpl?.name || 'Spare Part'}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-white truncate">{bp.reference}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Preventive tasks */}
              <div>
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Settings2 className="w-4 h-4" /> Derived Component Tasks ({derivedTasks.length})
                </h3>
                <div className="max-h-[105px] overflow-y-auto space-y-1 custom-scrollbar">
                  {derivedTasks.map(taskDef => {
                    
                    return (
                      <div key={taskDef.id} className="flex justify-between text-[11px] text-slate-300 bg-white/[0.01] hover:bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/5">
                        <span className="truncate">{taskDef?.title || 'Unknown Preventive Protocol'}</span>
                        <span className="text-[9px] text-slate-500 font-mono ml-2 shrink-0">{taskDef?.frequencyValue} Days</span>
                      </div>
                    );
                  })}
                  {derivedTasks.length === 0 && (
                    <p className="text-[11px] text-slate-500 italic">No custom tasks attached to this asset.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-white/5 flex gap-3 text-left">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium text-xs uppercase tracking-widest transition-all"
          >
            Close Dialog
          </button>
          <button
            type="button"
            onClick={handlePrintLabel}
            className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print physical QR label
          </button>
        </div>
      </motion.div>
    </div>
  );
}
