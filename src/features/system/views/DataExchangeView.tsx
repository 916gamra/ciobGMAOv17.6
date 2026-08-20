import { PageHeader } from "@/shared/components/PageHeader";
import { HeaderBentoCard } from "@/shared/components/HeaderBentoCard";
import { GlassCard } from "@/shared/components/GlassCard";
import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  HardDrive, 
  FileSpreadsheet, 
  UploadCloud, 
  DownloadCloud, 
  Factory, 
  Database, 
  Package, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { db } from '@/core/db';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { motion, Variants } from 'motion/react';
import { useTranslation } from 'react-i18next';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export function DataExchangeView() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [isProcessing, setIsProcessing] = useState(false);
  const [sectorsCount, setSectorsCount] = useState(0);
  const [machinesCount, setMachinesCount] = useState(0);
  const [blueprintsCount, setBlueprintsCount] = useState(0);
  const [inventoryCount, setInventoryCount] = useState(0);

  const refreshStats = async () => {
    try {
      const [sec, mach, bp, inv] = await Promise.all([
        db.sectors.count(),
        db.machines.count(),
        db.pdrBlueprints.count(),
        db.inventory.count()
      ]);
      setSectorsCount(sec);
      setMachinesCount(mach);
      setBlueprintsCount(bp);
      setInventoryCount(inv);
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  // --- EXCEL GENERATOR HELPER ---
  const handleDownloadTemplate = async (filename: string, columns: { header: string, key: string, width: number }[]) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Template');
      sheet.columns = columns;

      // Style Header
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' } // Slate 800
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, filename);
      toast.success(isAr ? 'تم تحميل القالب بنجاح' : 'Template Downloaded', { 
        description: isAr ? `جاهز لإدخال البيانات: ${filename}` : `Ready for populating data: ${filename}` 
      });
    } catch (e: any) {
      toast.error(isAr ? 'فشل تحميل القالب' : 'Download Failed', { description: e.message });
    }
  };

  // --- GENERIC UPLOADER & BUFFER PROCESSOR ---
  const triggerFileUpload = (inputId: string) => {
    document.getElementById(inputId)?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, processFn: (ws: ExcelJS.Worksheet) => Promise<void>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const toastId = toast.loading(isAr ? 'جاري قراءة وتحليل ملف البيانات...' : 'Processing Excel File...');

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      
      if (!worksheet || worksheet.rowCount <= 1) {
        throw new Error(isAr ? 'الملف فارغ أو لا يحتوي على صفوف بيانات صالحة' : 'File is empty or contains no valid rows.');
      }

      await processFn(worksheet);
      await refreshStats();
      toast.success(isAr ? 'تم حقن البيانات بنجاح' : 'Injection Succeeded', { 
        id: toastId, 
        description: isAr ? 'تم التحقق من تكامل البيانات وحفظها في قاعدة البيانات' : 'Dataset structurally verified and committed to persistent database.' 
      });
    } catch (err: any) {
      console.error(err);
      toast.error(isAr ? 'فشل معالجة البيانات' : 'Injection Failed', { id: toastId, description: err.message });
    } finally {
      setIsProcessing(false);
      e.target.value = ''; // reset
    }
  };

  // --- MODULE 2: FACTORY INFRASTRUCTURE ---
  const FACTORY_COLS = [
    { header: 'Sector/Zone (Required)', key: 'sector', width: 30 },
    { header: 'Machine Name (Required)', key: 'name', width: 30 },
    { header: 'Code/Ref (Optional)', key: 'code', width: 25 },
    { header: 'Family/Type (Optional)', key: 'family', width: 25 }
  ];

  const processFactoryData = async (ws: ExcelJS.Worksheet) => {
    const existingSectors = await db.sectors.toArray();
    const existingMachines = await db.machines.toArray();

    const sectorMap = new Map<string, string>();
    existingSectors.forEach(s => sectorMap.set(s.name.toUpperCase(), s.id));

    const dbMachinesSet = new Set<string>();
    existingMachines.forEach(m => dbMachinesSet.add(`${m.sectorId}_${(m.referenceCode || '').toUpperCase()}`));

    const newSectorsToInsert = new Map<string, any>();
    const newMachinesToInsert: any[] = [];
    let skippedMachines = 0;

    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const sectorName = row.getCell(1).text?.trim();
      const machineName = row.getCell(2).text?.trim();
      const code = row.getCell(3).text?.trim();
      const family = row.getCell(4).text?.trim() || 'General';

      if (!sectorName || !machineName) return;

      let sectorId = sectorMap.get(sectorName.toUpperCase());
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
        return;
      }

      newMachinesToInsert.push({
        id: crypto.randomUUID(),
        referenceCode: code || machineName,
        sectorId: sectorId,
        family: family,
        template: 'Standard'
      });
      dbMachinesSet.add(`${sectorId}_${machineName.toUpperCase()}`);
    });

    if (newSectorsToInsert.size === 0 && newMachinesToInsert.length === 0) {
      throw new Error(isAr ? 'لم يتم العثور على آلات أو مناطق جديدة' : "No new valid machines or sectors found (or all completely duplicated).");
    }

    await db.transaction('rw', db.sectors, db.machines, async () => {
      if (newSectorsToInsert.size > 0) await db.sectors.bulkAdd(Array.from(newSectorsToInsert.values()));
      if (newMachinesToInsert.length > 0) await db.machines.bulkAdd(newMachinesToInsert);
    });

    if (skippedMachines > 0) {
      toast.info(isAr ? `تم تخطي ${skippedMachines} آلة موجودة مسبقاً` : `Skipped ${skippedMachines} already existing machines.`);
    }
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
          if (newFamilies.has(familyRow.toUpperCase())) familyId = newFamilies.get(familyRow.toUpperCase()).id;
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
           blueprintId = existingBp.id;
           updateBlueprints.push({
              ...existingBp,
              templateId,
              unit: unitVal,
              minThreshold: thresholdValue
           });
           updatedRef++;
        } else {
           blueprintId = crypto.randomUUID();
           newBlueprints.push({
              id: blueprintId,
              templateId,
              reference: referenceRow,
              sku: referenceRow,
              unit: unitVal,
              minThreshold: thresholdValue,
              isActivated: false,
              createdAt: new Date().toISOString()
           });
           bpMap.set(referenceRow.toUpperCase(), { id: blueprintId });
        }

        if (machineRefRow) {
           const machineId = machineMap.get(machineRefRow.toUpperCase());
           if (machineId) {
              const mapKey = `${machineId}_${blueprintId}`;
              if (!existingMappings.has(mapKey)) {
                 newBoms.push({
                    id: crypto.randomUUID(),
                    machineId,
                    blueprintId,
                    quantityRequired: 1,
                    criticality: 'MEDIUM'
                 });
                 existingMappings.add(mapKey);
                 newBomsCount++;
              }
           }
        }
        rowCount++;
     });

     if (rowCount === 0) throw new Error(isAr ? "لم يتم العثور على قطع غيار صالحة للإدراج" : "No valid new catalog items found.");

     await db.transaction('rw', db.pdrFamilies, db.pdrTemplates, db.pdrBlueprints, db.machinePartMappings, async () => {
        if (newFamilies.size > 0) await db.pdrFamilies.bulkAdd(Array.from(newFamilies.values()));
        if (newTemplates.size > 0) await db.pdrTemplates.bulkAdd(Array.from(newTemplates.values()));
        if (newBlueprints.length > 0) await db.pdrBlueprints.bulkAdd(newBlueprints);
        if (updateBlueprints.length > 0) await db.pdrBlueprints.bulkPut(updateBlueprints);
        if (newBoms.length > 0) await db.machinePartMappings.bulkAdd(newBoms);
     });

     if (updatedRef > 0) toast.info(isAr ? `تم تحديث ${updatedRef} مرجع موجود مسبقاً` : `Upsert complete: Updated ${updatedRef} existing references.`);
     if (newBomsCount > 0) toast.success(isAr ? `تم ربط ${newBomsCount} قطعة غيار بالآلات` : `BOM Linker: Created ${newBomsCount} new spare part links to machines.`);
  };

  // --- MODULE 4: INVENTORY STOCK ---
  const STOCK_COLS = [
    { header: 'Reference/SKU (Required)', key: 'reference', width: 30 },
    { header: 'Quantity (Required)', key: 'quantity', width: 20 },
    { header: 'Warehouse', key: 'warehouse', width: 25 },
    { header: 'Location Details', key: 'location', width: 30 }
  ];

  const processStockData = async (ws: ExcelJS.Worksheet) => {
    const blueprints = await db.pdrBlueprints.toArray();
    const bpMap = new Map<string, string>();
    blueprints.forEach(bp => bpMap.set(bp.reference.toUpperCase(), bp.id));

    const inventories = await db.inventory.toArray();
    const invMap = new Map<string, any>();
    inventories.forEach(inv => invMap.set(inv.blueprintId, inv));

    const stockUpdates = new Map<string, any>();
    const newStocks = new Map<string, any>();
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
          const activeItem = stockUpdates.get(existingDBStock.id) || existingDBStock;
          stockUpdates.set(existingDBStock.id, {
             quantityCurrent: activeItem.quantityCurrent + quantity,
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
          const pendingStock = newStocks.get(bpId);
          let stockId;
          
          if (pendingStock) {
             pendingStock.quantityCurrent += quantity;
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
      throw new Error(isAr ? `فشل الاستيراد: ${missingReferences} مرجع غير مسجل في الكتالوج مسبقاً` : `Execution halted. 0 rows imported. All ${missingReferences} references were completely unknown to the Master Index.`);
    }

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
      toast.warning(isAr ? 'اكتمل الاستيراد جزئياً' : 'Import Incomplete', { 
        description: isAr ? `تم تخطي ${missingReferences} صف لعدم تسجيل المرجع مسبقاً في الكتالوج.` : `${missingReferences} rows were safely skipped due to unrecognized references.` 
      });
    }
  };

  const CARDS = [
    {
      id: 'factory',
      title: isAr ? 'البنية التحتية والآلات' : 'Factory Infrastructure',
      desc: isAr ? 'تعريف خطوط الإنتاج، المناطق الصناعية، والآلات والمعدات الإنتاجية.' : 'Define your production lines, sectors, and physical machines.',
      icon: <Factory className="w-6 h-6 text-slate-300" />,
      cols: FACTORY_COLS,
      processFn: processFactoryData,
      filename: 'Factory_Master_Template.xlsx',
    },
    {
      id: 'catalog',
      title: isAr ? 'كتالوج قطع الغيار' : 'Master PDR Catalog',
      desc: isAr ? 'بناء شجرة المعرفة: عائلات القطع، القوالب المجردة، والمرجعيات الفنية.' : 'Create parts dictionary: Families, types, and strict references without balances.',
      icon: <Database className="w-6 h-6 text-slate-300" />,
      cols: CATALOG_COLS,
      processFn: processCatalogData,
      filename: 'PDR_Catalog_Template.xlsx',
    },
    {
      id: 'stock',
      title: isAr ? 'الرصيد الافتتاحي للمخزون' : 'Inventory Stock Balances',
      desc: isAr ? 'إدخال الأرصدة المادية الفعلية وربطها بالمستودعات والأرفف المحددة.' : 'Initialize the actual physical stock balances using references established above.',
      icon: <Package className="w-6 h-6 text-slate-300" />,
      cols: STOCK_COLS,
      processFn: processStockData,
      filename: 'Inventory_Opening_Stock.xlsx',
    }
  ];

  const handleSnapshotDownload = async () => {
    setIsProcessing(true);
    try {
      const blob = await (db as any).export();
      saveAs(blob, `BDR_Nexus_Snapshot_${new Date().toISOString().slice(0,10)}.json`);
      toast.success(isAr ? "تم تصدير اللقطة الشاملة بنجاح" : "Snapshot Exported", { 
        description: isAr ? "يمكنك استخدام هذا الملف للاستعادة دون اتصال أو النقل." : "You can load this offline or in Windows Electron." 
      });
    } catch(err: any) {
       toast.error(isAr ? "فشل تصدير اللقطة" : "Snapshot Failed", { description: err.message });
    } finally {
       setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-8 pb-12 pt-2 px-4 md:px-0 lg:px-8"
    >
      <PageHeader
        title={isAr ? "مركز تبادل وحقن البيانات" : "Data Exchange Hub"}
        subtitle={isAr ? "منظومة معيارية لحقن واستيراد البيانات الصناعية الضخمة، وضمان الامتثال الصارم لقواعد تكامل قاعدة البيانات." : "Strict, standardized template injection framework. Buffered extraction ensures 100% database ACID compliance."}
        icon={<RefreshCw className={`w-7 h-7 text-slate-300 ${isProcessing ? 'animate-spin' : ''}`} />}
        badgeText={isAr ? "تبادل البيانات" : "Data Exchange Hub"}
        badgeColor="slate"
        actions={
          <button 
            onClick={handleSnapshotDownload}
            disabled={isProcessing}
            className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <HardDrive className="w-4 h-4" /> {isAr ? "تصدير لقطة البيانات" : "Export DB Snapshot"}
          </button>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title={isAr ? "البنية التحتية" : "Infrastructure"}
            subtitle="ZONES & MACHINES"
            value={`${sectorsCount} ${isAr ? 'منطقة' : 'Z'} / ${machinesCount} ${isAr ? 'آلة' : 'M'}`}
            icon={<Factory className="w-3.5 h-3.5" />}
            color="slate"
          />
          <HeaderBentoCard
            title={isAr ? "مصفوفة الكتالوج" : "Catalog Matrix"}
            subtitle="PDR BLUEPRINTS"
            value={blueprintsCount}
            icon={<Database className="w-3.5 h-3.5" />}
            color="blue"
          />
          <HeaderBentoCard
            title={isAr ? "أرصدة المخزون" : "Inventory Items"}
            subtitle="STOCK BALANCES"
            value={inventoryCount}
            icon={<Package className="w-3.5 h-3.5" />}
            color="emerald"
          />
          <HeaderBentoCard
            title={isAr ? "محرك السلامة" : "ACID Validation"}
            subtitle="BUFFER ENGINE"
            value={isAr ? "نشط ومفحوص" : "Active"}
            icon={<ShieldCheck className="w-3.5 h-3.5" />}
            color="cyan"
          />
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CARDS.map((card, idx) => (
          <motion.div key={card.id} variants={itemVariants}>
            <div className="p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col relative overflow-hidden group hover:border-white/20 transition-all shadow-xl hover:shadow-2xl h-full">
               <div className="flex items-start gap-4 mb-6">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 shadow-inner shrink-0 group-hover:border-white/20 transition-colors">
                    {card.icon}
                  </div>
                  <div>
                     <div className="flex items-center gap-2 mb-1.5">
                       <span className="text-[10px] font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider border border-white/10">
                         {isAr ? `الخطوة ${idx + 1}` : `Step ${idx + 1}`}
                       </span>
                     </div>
                     <h3 className="text-base font-bold text-white tracking-tight">{card.title}</h3>
                     <p className="text-xs text-slate-400 mt-2 leading-relaxed">{card.desc}</p>
                  </div>
               </div>
               
               <div className="mt-auto pt-4 flex gap-2.5 border-t border-white/5 relative z-10">
                  <button 
                    onClick={() => handleDownloadTemplate(card.filename, card.cols)}
                    disabled={isProcessing}
                    className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white rounded-xl font-bold text-xs transition-colors border border-white/10 disabled:opacity-50"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" /> {isAr ? "تحميل القالب" : "Get Template"}
                  </button>
                  
                  <button 
                    onClick={() => triggerFileUpload(`upload-${card.id}`)}
                    disabled={isProcessing}
                    className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-white text-slate-950 hover:bg-slate-200 rounded-xl font-extrabold text-xs transition-all shadow-md disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5" /> {isAr ? "استيراد وحقن" : "Inject Data"}
                  </button>
                  
                  <input 
                    type="file" 
                    id={`upload-${card.id}`} 
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, card.processFn)}
                  />
               </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div variants={itemVariants} className="p-5 bg-slate-900/40 border border-white/10 rounded-2xl flex gap-4 backdrop-blur-md">
        <AlertTriangle className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div>
           <h4 className="font-bold text-sky-400 uppercase tracking-wider text-xs mb-1">
             {isAr ? "محرك السلامة الهيكلية والتكامل المزدوج" : "Architectural Integrity Engine"}
           </h4>
           <p className="text-slate-300 text-xs leading-relaxed max-w-4xl">
             {isAr 
               ? "تتم معالجة جداول البيانات عبر مخزن مؤقت ثنائي المراحل. في المرحلة الأولى، يتم دمج القيم المكررة تلقائياً والتحقق من المرجعيات. في المرحلة الثانية، يتم تنفيذ المعاملة الشاملة داخل قاعدة البيانات مع عزل السجلات غير المطابقة لمنع أي تشوه في العلاقات البنيوية."
               : "This module processes massive spreadsheets via a hyper-safe 2-pass RAM buffer. Duplicate values are safely merged locally, and validated unique objects are committed through a strict bulk transaction port."}
           </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
