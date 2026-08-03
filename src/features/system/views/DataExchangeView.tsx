import { PageHeader } from "@/shared/components/PageHeader";
import React, { useState } from 'react';
import { DownloadCloud, UploadCloud, Database, Users, Factory, Package, AlertTriangle, RefreshCw, HardDrive } from 'lucide-react';
import ExcelJS from 'exceljs';
import { db } from '@/core/db';
import { toast } from 'sonner';
import { measureOperation, logger } from '@/core/logger';
import { GlassCard } from '@/shared/components/GlassCard';
import { motion, Variants } from 'motion/react';
import { generatePdrSlotId } from '@/core/config/pdrMatrix';
import { saveAs } from 'file-saver';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export function DataExchangeView() {
  const [isProcessing, setIsProcessing] = useState(false);

  // --- DOWNLOAD HELPER ---
  const handleDownloadTemplate = async (fileName: string, columns: { header: string, key: string, width: number }[]) => {
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Template');
      ws.columns = columns;
      
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error('Failed to generate template', { description: err.message });
    }
  };

  // --- UPLOAD HELPER ---
  const triggerFileUpload = (inputId: string) => document.getElementById(inputId)?.click();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, processFn: (ws: ExcelJS.Worksheet) => Promise<void>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(arrayBuffer);
      const ws = wb.worksheets[0];
      
      if (!ws) throw new Error('No worksheet found in file.');
      
      await measureOperation(`Upload_${file.name}`, async () => {
        await processFn(ws);
      });
      
      toast.success('Data Injected', { description: `Successfully safely processed ${file.name}` });
    } catch (err: any) {
      logger.error('Injection Error', err);
      toast.error('Injection Failed', { description: err.message });
    } finally {
      e.target.value = '';
      setIsProcessing(false);
    }
  };

  // --- MODULE 1: FACTORY ORG ---
  const FACTORY_COLS = [
    { header: 'Sector Name (Required)', key: 'sector', width: 25 },
    { header: 'Machine Name (Required)', key: 'machine', width: 30 },
    { header: 'Machine Reference Code', key: 'code', width: 25 },
    { header: 'Machine Family', key: 'family', width: 25 }
  ];

  const processFactoryData = async (ws: ExcelJS.Worksheet) => {
    // PASS 1: DB Read & Memory Allocation
    const existingSectors = await db.sectors.toArray();
    const existingMachines = await db.machines.toArray();
    
    const dbSectorsMap = new Map<string, string>(); // name -> id
    existingSectors.forEach(s => dbSectorsMap.set(s.name.toUpperCase(), s.id));
    
    const dbMachinesSet = new Set<string>(); // sectorId_machineName
    existingMachines.forEach(m => dbMachinesSet.add(`${m.sectorId}_${m.referenceCode.toUpperCase()}`));

    const newSectorsToInsert = new Map<string, any>(); // name -> object
    const newMachinesToInsert: any[] = [];
    
    let skippedMachines = 0;

    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const sectorName = row.getCell(1).text?.trim();
      const machineName = row.getCell(2).text?.trim();
      if (!sectorName || !machineName) return;

      const code = row.getCell(3).text?.trim() || 'N/A';
      const family = row.getCell(4).text?.trim() || 'General';

      let sectorId = dbSectorsMap.get(sectorName.toUpperCase());
      if (!sectorId) {
        if (newSectorsToInsert.has(sectorName.toUpperCase())) {
          sectorId = newSectorsToInsert.get(sectorName.toUpperCase()).id;
        } else {
          sectorId = crypto.randomUUID();
          newSectorsToInsert.set(sectorName.toUpperCase(), { id: sectorId, name: sectorName });
        }
      }

      if (dbMachinesSet.has(`${sectorId}_${machineName.toUpperCase()}`)) {
        skippedMachines++;
        return; // Avoid duplicating exact same machine in same sector
      }

      newMachinesToInsert.push({
        id: crypto.randomUUID(),
        referenceCode: code || machineName, // use code or name
        sectorId: sectorId,
        family: family,
        template: 'Standard'
      });
      dbMachinesSet.add(`${sectorId}_${machineName.toUpperCase()}`); // mark as seen
    });

    if (newSectorsToInsert.size === 0 && newMachinesToInsert.length === 0) {
      throw new Error("No new valid machines or sectors found (or all completely duplicated).");
    }

    // PASS 2: Transaction Bulk Execution
    await db.transaction('rw', db.sectors, db.machines, async () => {
      if (newSectorsToInsert.size > 0) await db.sectors.bulkAdd(Array.from(newSectorsToInsert.values()));
      if (newMachinesToInsert.length > 0) await db.machines.bulkAdd(newMachinesToInsert);
    });

    if (skippedMachines > 0) toast.info(`Skipped ${skippedMachines} already existing machines.`);
  };

  // --- MODULE 3: PDR CATALOG ---
  const CATALOG_COLS = [
    { header: 'Family (Required)', key: 'family', width: 25 },
    { header: 'Template/Type (Required)', key: 'template', width: 30 },
    { header: 'Reference/SKU (Required)', key: 'reference', width: 25 },
    { header: 'Linked Machine Ref (Optional)', key: 'machineRef', width: 30 },
    { header: 'Unit', key: 'unit', width: 15 },
    { header: 'Min Threshold', key: 'minThreshold', width: 15 }
  ];

  const processCatalogData = async (ws: ExcelJS.Worksheet) => {
     // DB Fetch
     const [dbFamilies, dbTemplates, dbBlueprints, dbMachines, dbMappings] = await Promise.all([
       db.pdrFamilies.toArray(),
       db.pdrTemplates.toArray(),
       db.pdrBlueprints.toArray(),
       db.machines.toArray(),
       db.machinePartMappings.toArray()
     ]);

     const fMap = new Map<string, string>(); dbFamilies.forEach(f => fMap.set(f.name.toUpperCase(), f.id));
     const tMap = new Map<string, any>(); dbTemplates.forEach(t => tMap.set(`${t.familyId}_${t.name.toUpperCase()}`, t));
     const bpMap = new Map<string, any>(); dbBlueprints.forEach(b => bpMap.set(b.reference.toUpperCase(), b));
     const machineMap = new Map<string, string>(); dbMachines.forEach(m => machineMap.set(m.referenceCode?.toUpperCase() || '', m.id));
     const existingMappings = new Set(dbMappings.map(m => `${m.machineId}_${m.blueprintId}`));
     
     // 999 Slot Tracking
     const existingBpIds = new Set(dbBlueprints.map(b => b.id));

     const newFamilies = new Map<string, any>();
     const newTemplates = new Map<string, any>();
     const newBlueprints: any[] = [];
     const updateBlueprints: any[] = [];
     const newBoms: any[] = [];
     
     let rowCount = 0; let updatedRef = 0; let newBomsCount = 0;

     ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const familyRow = row.getCell(1).text?.trim();
        const templateRow = row.getCell(2).text?.trim();
        const referenceRow = row.getCell(3).text?.trim();
        const machineRefRow = row.getCell(4).text?.trim();
        
        if (!familyRow || !templateRow || !referenceRow) return;

        let thresholdValue = 0;
        const rawT = row.getCell(6).value;
        if (typeof rawT === 'number') thresholdValue = rawT;
        else if (typeof rawT === 'string') thresholdValue = parseInt(rawT, 10);
        if (isNaN(thresholdValue)) thresholdValue = 0;
        
        const unitVal = row.getCell(5).text?.trim() || 'Pcs';

        // Family resolution
        let familyId = fMap.get(familyRow.toUpperCase());
        if (!familyId) {
          if(newFamilies.has(familyRow.toUpperCase())) familyId = newFamilies.get(familyRow.toUpperCase()).id;
          else {
            familyId = crypto.randomUUID();
            newFamilies.set(familyRow.toUpperCase(), { id: familyId, name: familyRow, createdAt: new Date().toISOString() });
          }
        }

        // Template resolution
        const tKey = `${familyId}_${templateRow.toUpperCase()}`;
        let templateId: string;
        let templateCode: string;
        
        if (tMap.has(tKey)) {
           templateId = tMap.get(tKey).id;
           templateCode = tMap.get(tKey).skuBase || tMap.get(tKey).code || 'GEN';
        } else if (newTemplates.has(tKey)) {
           templateId = newTemplates.get(tKey).id;
           templateCode = newTemplates.get(tKey).skuBase;
        } else {
           templateId = crypto.randomUUID();
           templateCode = templateRow.substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '');
           newTemplates.set(tKey, { id: templateId, familyId, name: templateRow, skuBase: templateCode, createdAt: new Date().toISOString() });
        }

        let blueprintId;
        const existingBp = bpMap.get(referenceRow.toUpperCase());
        
        if (existingBp) {
           // Upsert Logic: Update existing record instead of skipping
           blueprintId = existingBp.id;
           updateBlueprints.push({
              ...existingBp,
              templateId, // Allow correcting the template
              unit: unitVal,
              minThreshold: thresholdValue // Allow updating threshold
           });
           updatedRef++;
        } else {
           // Locate next 999 slot
           let nextSlotIndex = 1;
           while(nextSlotIndex <= 999) {
             const candidateId = generatePdrSlotId(templateCode, nextSlotIndex);
             if (!existingBpIds.has(candidateId)) {
               blueprintId = candidateId;
               break;
             }
             nextSlotIndex++;
           }
           
           if (!blueprintId) {
             throw new Error(`Master Catalog Overflow: Template ${templateCode} has exhausted all 999 available slots.`);
           }

           existingBpIds.add(blueprintId); // Locally mark slot as filled
           
           newBlueprints.push({
             id: blueprintId,
             templateId,
             reference: referenceRow,
             unit: unitVal,
             minThreshold: thresholdValue,
             createdAt: new Date().toISOString()
           });
           bpMap.set(referenceRow.toUpperCase(), { id: blueprintId }); // mark as seen locally
        }

        // BOM Validation Linker
        if (machineRefRow) {
           const dbMachineId = machineMap.get(machineRefRow.toUpperCase());
           if (dbMachineId) {
              const linkageKey = `${dbMachineId}_${blueprintId}`;
              if (!existingMappings.has(linkageKey)) {
                 newBoms.push({
                    id: crypto.randomUUID(),
                    machineId: dbMachineId,
                    blueprintId: blueprintId,
                    addedAt: new Date().toISOString()
                 });
                 existingMappings.add(linkageKey);
                 newBomsCount++;
              }
           }
        }

        rowCount++;
     });

     if (rowCount === 0) throw new Error("No valid new catalog items found.");

     await db.transaction('rw', db.pdrFamilies, db.pdrTemplates, db.pdrBlueprints, db.machinePartMappings, async () => {
        if (newFamilies.size > 0) await db.pdrFamilies.bulkAdd(Array.from(newFamilies.values()));
        if (newTemplates.size > 0) await db.pdrTemplates.bulkAdd(Array.from(newTemplates.values()));
        if (newBlueprints.length > 0) await db.pdrBlueprints.bulkAdd(newBlueprints);
        if (updateBlueprints.length > 0) await db.pdrBlueprints.bulkPut(updateBlueprints);
        if (newBoms.length > 0) await db.machinePartMappings.bulkAdd(newBoms);
     });

     if(updatedRef > 0) toast.info(`Upsert complete: Updated ${updatedRef} existing references.`);
     if(newBomsCount > 0) toast.success(`BOM Linker: Created ${newBomsCount} new spare part links to machines.`);
  };

  // --- MODULE 4: INVENTORY STOCK ---
  const STOCK_COLS = [
    { header: 'Reference/SKU (Required)', key: 'reference', width: 30 },
    { header: 'Quantity (Required)', key: 'quantity', width: 20 },
    { header: 'Warehouse', key: 'warehouse', width: 25 },
    { header: 'Location Details', key: 'location', width: 30 }
  ];

  const processStockData = async (ws: ExcelJS.Worksheet) => {
    // Pass 1: Fetch state
    const blueprints = await db.pdrBlueprints.toArray();
    const bpMap = new Map<string, string>(); // ref -> bpId
    blueprints.forEach(bp => bpMap.set(bp.reference.toUpperCase(), bp.id));

    const inventories = await db.inventory.toArray();
    const invMap = new Map<string, any>(); // bpId -> stockItem
    inventories.forEach(inv => invMap.set(inv.blueprintId, inv));

    // Phase 2: Accumulation & Delta calculation 
    const stockUpdates = new Map<string, any>(); // Existing DB Items to update -> { full partial object }
    const newStocks = new Map<string, any>(); // bpId -> full new stock object
    const newMovements: any[] = [];
    
    let missingReferences = 0; let validRows = 0;

    ws.eachRow((row, rowNumber) => {
       if (rowNumber === 1) return;
       const referenceRow = row.getCell(1).text?.trim();
       if (!referenceRow) return;

       const bpId = bpMap.get(referenceRow.toUpperCase());
       if (!bpId) { missingReferences++; return; }

       const qtyRaw = row.getCell(2).value;
       const quantity = (typeof qtyRaw === 'number') ? qtyRaw : parseFloat(row.getCell(2).text || '0');
       if (isNaN(quantity) || quantity <= 0) return; 

       const warehouse = row.getCell(3).text?.trim() || 'Main Warehouse';
       const location = row.getCell(4).text?.trim() || '';
       const now = new Date().toISOString();

       const existingDBStock = invMap.get(bpId);

       if (existingDBStock) {
          // Add to existing
          const activeItem = stockUpdates.get(existingDBStock.id) || existingDBStock;
          
          stockUpdates.set(existingDBStock.id, {
             quantityCurrent: activeItem.quantityCurrent + quantity, // cumulative additive
             updatedAt: now,
             ...(location && { locationDetails: location })
          });

          newMovements.push({
             id: crypto.randomUUID(),
             stockId: existingDBStock.id,
             type: 'IN',
             quantity: quantity,
             performedBy: 'System Import',
             notes: 'Legacy stock additive import',
             timestamp: now
          });
       } else {
          // Add to new entirely
          const pendingStock = newStocks.get(bpId);
          let stockId;
          
          if (pendingStock) {
             pendingStock.quantityCurrent += quantity; // accumulate duplicates in file
             if (location) pendingStock.locationDetails = location;
             stockId = pendingStock.id;
          } else {
             stockId = crypto.randomUUID();
             newStocks.set(bpId, {
                id: stockId,
                blueprintId: bpId,
                warehouseId: warehouse,
                quantityCurrent: quantity,
                locationDetails: location,
                updatedAt: now
             });
          }
          
          newMovements.push({
             id: crypto.randomUUID(),
             stockId: stockId,
             type: 'IN',
             quantity: quantity,
             performedBy: 'System Import',
             notes: 'Legacy stock opening balance',
             timestamp: now
          });
       }
       validRows++;
    });

    if (validRows === 0 && missingReferences > 0) {
      throw new Error(`Execution halted. 0 rows imported. All ${missingReferences} references were completely unknown to the Master Index.`);
    }

    // Pass 3: Strict Transaction Commit
    await db.transaction('rw', db.inventory, db.movements, async () => {
       if (stockUpdates.size > 0) {
           const keys = Array.from(stockUpdates.keys());
           const changes = Array.from(stockUpdates.values());
           for (let i = 0; i < keys.length; i++) {
               await db.inventory.update(keys[i], changes[i]);
           }
       }
       if (newStocks.size > 0) await db.inventory.bulkAdd(Array.from(newStocks.values()));
       if (newMovements.length > 0) await db.movements.bulkAdd(newMovements);
    });
    
    if (missingReferences > 0) {
      toast.warning('Import Incomplete', { description: `${missingReferences} rows were safely skipped due to unrecognized references.` });
    }
  };

  const CARDS = [
    {
      id: 'factory',
      title: 'Factory Infrastructure',
      desc: 'Define your production lines, sectors, and physical machines.',
      icon: <Factory className="w-8 h-8 text-indigo-400" />,
      cols: FACTORY_COLS,
      processFn: processFactoryData,
      filename: 'Factory_Master_Template.xlsx',
      color: 'bg-indigo-500'
    },
    {
      id: 'catalog',
      title: 'Master PDR Catalog',
      desc: 'Create parts dictionary: Families, types, and strict references without balances.',
      icon: <Database className="w-8 h-8 text-blue-400" />,
      cols: CATALOG_COLS,
      processFn: processCatalogData,
      filename: 'PDR_Catalog_Template.xlsx',
      color: 'bg-blue-500'
    },
    {
      id: 'stock',
      title: 'Inventory Stock balances',
      desc: 'Initialize the actual physical stock balances using references established above.',
      icon: <Package className="w-8 h-8 text-amber-400" />,
      cols: STOCK_COLS,
      processFn: processStockData,
      filename: 'Inventory_Opening_Stock.xlsx',
      color: 'bg-amber-500'
    }
  ];

  const handleSnapshotDownload = async () => {
    setIsProcessing(true);
    try {
      const blob = await (db as any).export();
      saveAs(blob, `BDR_Nexus_Snapshot_${new Date().toISOString().slice(0,10)}.json`);
      toast.success("Snapshot Exported", { description: "You can load this offline or in Windows Electron." });
    } catch(err: any) {
       toast.error("Snapshot Failed", { description: err.message });
    } finally {
       setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-6 pb-12 lg:px-8"
    >
      <PageHeader
        title="Data Exchange Hub"
        subtitle={<>Strict, standardized template injection framework. Buffered extraction ensures 100% database ACID compliance. <strong className="text-amber-400">Note: You must upload the Master PDR Catalog before injecting Inventory.</strong></>}
        icon={<RefreshCw className={`w-6 h-6 text-slate-400 ${isProcessing ? 'animate-spin border-slate-500 rounded-full' : ''}`} />}
        actions={
          <button 
            onClick={handleSnapshotDownload}
            disabled={isProcessing}
            className="titan-button bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
          >
            <HardDrive className="w-4 h-4" /> Export DB Snapshot
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CARDS.map((card, idx) => (
          <motion.div key={card.id} variants={itemVariants}>
            <GlassCard className="p-6 border border-white/10 bg-white/[0.06] flex flex-col relative overflow-hidden group hover:border-white/30 transition-all shadow-xl hover:shadow-2xl backdrop-blur-md h-full">
               <div className="flex items-start gap-5 mb-6">
                  <div className={`p-4 rounded-2xl bg-black/40 border border-white/5 shadow-inner`}>
                    {card.icon}
                  </div>
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                       <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded uppercase tracking-widest border border-white/10">Step {idx + 1}</span>
                       <h3 className="text-xl font-bold text-slate-200">{card.title}</h3>
                     </div>
                     <p className="text-sm text-slate-400 mt-2">{card.desc}</p>
                  </div>
               </div>
               
               <div className="mt-auto pt-4 flex gap-3 border-t border-white/5 relative z-10">
                  <button 
                    onClick={() => handleDownloadTemplate(card.filename, card.cols)}
                    disabled={isProcessing}
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-black/40 hover:bg-white/10 text-slate-300 rounded-xl font-medium text-sm transition-colors border border-white/10 disabled:opacity-50"
                  >
                    <DownloadCloud className="w-4 h-4" /> Get Template
                  </button>
                  
                  <button 
                    onClick={() => triggerFileUpload(`upload-${card.id}`)}
                    disabled={isProcessing}
                    className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 ${card.color} hover:opacity-80 text-white rounded-xl font-medium text-sm transition-opacity shadow-lg disabled:opacity-50`}
                  >
                    <UploadCloud className="w-4 h-4" /> Inject Data
                  </button>
                  
                  <input 
                    type="file" 
                    id={`upload-${card.id}`} 
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, card.processFn)}
                  />
               </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
      
      <motion.div variants={itemVariants} className="mt-8 p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-4">
        <AlertTriangle className="w-6 h-6 text-blue-400 shrink-0" />
        <div>
           <h4 className="font-bold text-blue-400 uppercase tracking-widest text-sm mb-1">Architectural Integrity Engine</h4>
           <p className="text-slate-300 text-[13px] leading-relaxed max-w-4xl">
             This module processes massive spreadsheets via a hyper-safe 2-pass RAM buffer. 
             In Pass 1, duplicate values (e.g. accidentally copy-pasting the same machine 8 times) are silently merged locally. 
             In Pass 2, validated unique objects are committed through a strict bulk transaction port. 
             Missing cross-references are isolated rather than corrupting relational datasets.
           </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
