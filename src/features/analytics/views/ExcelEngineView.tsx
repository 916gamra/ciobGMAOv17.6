import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { AuditService } from '@/core/logging/AuditService';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { GlassCard } from '@/shared/components/GlassCard';
import { useTranslation } from 'react-i18next';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  ShoppingCart, 
  Calendar, 
  Search, 
  DollarSign,
  Boxes,
  Sparkles,
  FileCheck,
  Factory
} from 'lucide-react';
import { toast } from 'sonner';

export function ExcelEngineView({ user }: { user?: any }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'reorder' | 'preventive' | 'import'>('reorder');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dexie Queries
  const inventoryItems = useLiveQuery(() => db.inventory.toArray()) || [];
  const pdrBlueprints = useLiveQuery(() => db.pdrBlueprints.toArray()) || [];
  const machines = useLiveQuery(() => db.machines.toArray()) || [];
  const machineTasks = useLiveQuery(() => db.machineTasks.toArray()) || [];
  const preventiveTasks = useLiveQuery(() => db.preventiveTasks.toArray()) || [];

  // PDR Reorder Data Map
  const reorderData = inventoryItems.map(inv => {
    const bp = pdrBlueprints.find(b => b.id === inv.blueprintId);
    const minThreshold = bp?.minThreshold || 5;
    const currentStock = inv.quantityCurrent || 0;
    const isBelowMin = currentStock <= minThreshold;
    const qtyToReorder = isBelowMin ? Math.max((minThreshold * 2) - currentStock, 10) : 0;
    const unitPrice = 1200; // DZD estimated average
    const estimatedCost = qtyToReorder * unitPrice;

    return {
      id: inv.id,
      blueprintId: inv.blueprintId,
      partCode: bp?.reference || inv.blueprintId || 'ROB-001',
      partName: bp?.model ? `${bp.reference} (${bp.model})` : (bp?.reference || 'قطعة غيار غير محددة'),
      familyCode: bp?.templateId || 'ROB',
      currentStock,
      minThreshold,
      rackLocation: inv.locationDetails || 'Aisle 1 - Shelf A',
      unit: bp?.unit || 'Pcs',
      unitPrice,
      qtyToReorder,
      estimatedCost,
      isBelowMin
    };
  });

  const lowStockItems = reorderData.filter(i => i.isBelowMin);
  const totalReorderCost = lowStockItems.reduce((sum, item) => sum + item.estimatedCost, 0);

  // Filtered List for Table
  const filteredReorderData = reorderData.filter(i => 
    i.partCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.rackLocation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- EXCEL EXPORT: PDR Audit & Reorder Matrix ---
  const exportReorderMatrixToExcel = () => {
    try {
      const dataToExport = lowStockItems.length > 0 ? lowStockItems : reorderData;
      
      const excelRows = dataToExport.map((item, index) => ({
        '#': index + 1,
        'رمز القطعة (Reference)': item.partCode,
        'اسم قطعة الغيار': item.partName,
        'القالب (Template)': item.familyCode,
        'الرصيد الحالي': item.currentStock,
        'الحد الأدنى (Min)': item.minThreshold,
        'موقع الرف': item.rackLocation,
        'الكمية المقترحة للشراء': item.qtyToReorder,
        'سعر الوحدة (DZD)': item.unitPrice,
        'التكلفة الإجمالية التقديرية (DZD)': item.estimatedCost,
        'حالة الرصيد': item.isBelowMin ? '⚠️ تحت الحد الأدنى' : '✅ آمن'
      }));

      // Create Worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      
      // Add Summary Row
      XLSX.utils.sheet_add_aoa(worksheet, [
        [],
        ['', '', '', '', '', '', '', 'المجموع الكلي المقدر:', '', totalReorderCost, 'DZD']
      ], { origin: -1 });

      // Auto Column Widths
      const colWidths = [
        { wch: 5 }, { wch: 18 }, { wch: 30 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
        { wch: 15 }, { wch: 25 }, { wch: 20 }
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock_Audit_Reorder');

      const fileName = `PDR_Stock_Audit_Matrix_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      AuditService.log(
        'EXCEL_EXPORT_REORDER_MATRIX',
        'PDR_INVENTORY',
        'ALL',
        `Exported Excel Reorder Matrix with ${dataToExport.length} items. Total Cost: ${totalReorderCost} DZD`,
        user?.id || 'sys-admin',
        user?.name || 'System Admin',
        'INFO'
      );

      toast.success(`تم استخراج ملف Excel للجرد ورصيد المخزن بنجاح (${fileName})`);
    } catch (err: any) {
      toast.error(`فشل استخراج ملف Excel: ${err.message}`);
    }
  };

  // --- CREATE PURCHASE REQUISITIONS BATCH ---
  const createRequisitionBatch = async () => {
    if (lowStockItems.length === 0) {
      toast.info('جميع القطع في المستوى الآمن. لا توجد نواقص لتوليد طلب توريد!');
      return;
    }

    try {
      const reqId = `REQ-AUTO-${Date.now().toString().slice(-6)}`;
      const firstMac = machines[0]?.id || 'MAC-DEFAULT';

      await db.partRequisitions.add({
        id: reqId,
        technicianId: user?.id || 'usr-storekeeper',
        machineId: firstMac,
        status: 'PENDING',
        requestDate: new Date().toISOString()
      });

      for (const item of lowStockItems) {
        await db.partRequisitionLines.add({
          id: `REQLINE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          requisitionId: reqId,
          blueprintId: item.blueprintId,
          quantity: item.qtyToReorder
        });
      }

      AuditService.log(
        'AUTO_PURCHASE_REQUISITION_CREATED',
        'PART_REQUISITION',
        reqId,
        `Generated auto purchase requisition batch for ${lowStockItems.length} low stock items.`,
        user?.id || 'sys-admin',
        user?.name || 'System Admin',
        'WARNING'
      );

      toast.success(`تم توليد طلب الشراء والتوريد التلقائي برقم [${reqId}] بنجاح!`);
    } catch (err: any) {
      toast.error(`خطأ أثناء إنشاء طلب التوريد: ${err.message}`);
    }
  };

  // --- PREVENTIVE SCHEDULE EXPORT ---
  const exportPreventiveScheduleToExcel = () => {
    try {
      const scheduleRows = machineTasks.map((mt, idx) => {
        const m = machines.find(mac => mac.id === mt.machineId);
        const task = preventiveTasks.find(pt => pt.id === mt.taskId);
        
        return {
          '#': idx + 1,
          'رمز الآلة': m?.referenceCode || mt.machineId,
          'رقم المسلسل': m?.serialNumber || 'SN-UNKNOWN',
          'القسم الفني': m?.sectorId || 'الصيانة العامة',
          'عنوان المهمة الوقائية': task?.title || 'فحص وقائي دوري',
          'التكرار': `${task?.frequencyValue || 7} (${task?.frequencyType || 'TIME'})`,
          'مفعل': mt.isEnabled ? 'نعم' : 'لا'
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(scheduleRows.length > 0 ? scheduleRows : [
        { '#': 1, 'رمز الآلة': 'MAC-001', 'رقم المسلسل': 'SN-2024-DE', 'القسم الفني': 'Production-01', 'عنوان المهمة الوقائية': 'تشحيم المحامل وتغيير الزيت', 'التكرار': '7 (TIME)', 'مفعل': 'نعم' },
        { '#': 2, 'رمز الآلة': 'MAC-002', 'رقم المسلسل': 'SN-5021-HY', 'القسم الفني': 'Hydraulics-02', 'عنوان المهمة الوقائية': 'فحص ضغط الصمامات ومرشح الزيت', 'التكرار': '14 (TIME)', 'مفعل': 'نعم' }
      ]);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Preventive_Master_Schedule');

      const fileName = `Preventive_Maintenance_Master_Schedule_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(`تم استخراج جدول الصيانة الوقائية الإجمالي بنجاح (${fileName})`);
    } catch (err: any) {
      toast.error(`فشل استخراج جدول الصيانة الوقائية: ${err.message}`);
    }
  };

  // --- SMART IMPORT LOGIC ---
  const [importValidation, setImportValidation] = useState<{
    validCount: number;
    invalidCount: number;
    rows: Array<{ rowNumber: number; data: any; code: string; name: string; minThreshold: number; isValid: boolean; errors: string[] }>;
  }>({ validCount: 0, invalidCount: 0, rows: [] });

  const downloadSampleImportTemplate = () => {
    const templateData = [
      {
        'رمز القطعة (Reference [ROB-001])': 'ROB-001',
        'الموديل والمواصفات (Model)': 'محمل كروي 6205-2RS',
        'رمز القالب (TemplateId)': 'TEMP-BEARING',
        'الحد الأدنى للطلب (Min)': 10,
        'الوحدة (Unit)': 'Pcs',
        'موقع الرف (Rack)': 'Aisle 1 - Shelf 04'
      },
      {
        'رمز القطعة (Reference [ROB-001])': 'ROB-002',
        'الموديل والمواصفات (Model)': 'مانع تسرب هيدروليكي 40x60x10',
        'رمز القالب (TemplateId)': 'TEMP-SEAL',
        'الحد الأدنى للطلب (Min)': 15,
        'الوحدة (Unit)': 'Pcs',
        'موقع الرف (Rack)': 'Aisle 2 - Shelf 01'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PDR_Import_Template');
    XLSX.writeFile(wb, 'GMAO_PDR_Import_Template_999Slots.xlsx');
    toast.success('تم تحميل قالب الاستيراد القياسي المعتمد لـ 999 مقعد بنجاح!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws);

        // Validate Rows against 999 Slots Rule
        const validatedRows = data.map((row: any, idx: number) => {
          const errors: string[] = [];
          const code = row['رمز القطعة (Reference [ROB-001])'] || row['reference'] || row['code'] || '';
          const name = row['الموديل والمواصفات (Model)'] || row['model'] || row['name'] || '';
          const minVal = row['الحد الأدنى للطلب (Min)'] || row['minThreshold'];

          // 1. Validate Triple Code Format (ROB-001 to ROB-999)
          const tripleCodeRegex = /^[A-Z]{2,5}-\d{3}$/;
          if (!code) {
            errors.push('رمز القطعة (Reference) مفقود');
          } else if (!tripleCodeRegex.test(code)) {
            errors.push(`الكود [${code}] يخالف قانون الـ 999 مقعد (يجب أن يكون مثل ROB-001)`);
          }

          // 2. Validate Required Model/Name
          if (!name || name.toString().trim().length < 2) {
            errors.push('اسم أو وصف قطعة الغيار مفقود');
          }

          // 3. Validate Threshold Number
          if (minVal !== undefined && isNaN(Number(minVal))) {
            errors.push('الحد الأدنى للطلب يجب أن يكون رقماً صحيحاً');
          }

          return {
            rowNumber: idx + 2,
            data: row,
            code,
            name,
            minThreshold: Number(minVal) || 5,
            isValid: errors.length === 0,
            errors
          };
        });

        const validCount = validatedRows.filter(r => r.isValid).length;
        const invalidCount = validatedRows.filter(r => !r.isValid).length;

        setImportValidation({ validCount, invalidCount, rows: validatedRows });
        toast.info(`تم تحليل الملف: ${validCount} صف صالحة، ${invalidCount} صف تحتاج تصحيح`);
      } catch (err: any) {
        toast.error(`فشل قراءة ملف Excel: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const commitValidImportRows = async () => {
    const validRows = importValidation.rows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error('لا توجد صفوف صالحة للاستيراد!');
      return;
    }

    try {
      for (const row of validRows) {
        const bpId = `BP-${row.code}`;
        await db.pdrBlueprints.put({
          id: bpId,
          templateId: row.data['رمز القالب (TemplateId)'] || 'TEMP-GENERIC',
          reference: row.code,
          model: row.name,
          unit: row.data['الوحدة (Unit)'] || 'Pcs',
          minThreshold: row.minThreshold,
          createdAt: new Date().toISOString()
        });

        await db.inventory.put({
          id: `INV-${row.code}`,
          blueprintId: bpId,
          warehouseId: 'WH-MAGASIN',
          quantityCurrent: 0,
          locationDetails: row.data['موقع الرف (Rack)'] || 'Aisle 1 - Shelf A',
          updatedAt: new Date().toISOString(),
          condition: 'NEW'
        });
      }

      AuditService.log(
        'EXCEL_SMART_IMPORT_COMMITTED',
        'PDR_BLUEPRINT',
        'BULK',
        `Bulk imported ${validRows.length} PDR blueprints with 999-slots validation.`,
        user?.id || 'sys-admin',
        user?.name || 'System Admin',
        'INFO'
      );

      toast.success(`تم استيراد ${validRows.length} قطعة غيار بنجاح في الكتالوج ورصيد المخزن!`);
      setImportValidation({ validCount: 0, invalidCount: 0, rows: [] });
    } catch (err: any) {
      toast.error(`خطأ أثناء الحفظ في قاعدة البيانات: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0f] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl text-slate-800 dark:text-slate-200 font-sans pb-4 overflow-hidden overflow-y-auto custom-scrollbar dir-ltr" dir="ltr">
      {/* PAGE HEADER */}
      <div className="p-6 md:p-8 pb-0 shrink-0">
        <PageHeader
        title={t('excel.engine.title', 'محرك إكسيل التقني (Excel Engine)')}
        subtitle={t('excel.engine.subtitle', 'تصدير واستيراد تقارير الجرد، جداول الصيانة الوقائية الإجمالية، والاستيراد الذكي المعالج لقانون الـ 999 مقعد.')}
        icon={<FileSpreadsheet className="w-7 h-7 text-emerald-400" />}
        badgeText="v17.1 XLSX"
        badgeColor="emerald"
        actions={
          <button
            onClick={exportReorderMatrixToExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>{t('excel.engine.quickExport', 'تصدير تقرير Excel سريعة')}</span>
          </button>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title={t('excel.engine.totalParts', 'إجمالي قطع المخزن')}
            subtitle="TOTAL INVENTORY BLUEPRINTS"
            value={reorderData.length}
            icon={<Boxes className="w-3.5 h-3.5" />}
            color="blue"
          />
          <HeaderBentoCard
            title={t('excel.engine.lowStock', 'تحت الحد الأدنى (نواقص)')}
            subtitle="LOW STOCK DEFICIENCIES"
            value={lowStockItems.length}
            icon={<AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
            color="rose"
          />
          <HeaderBentoCard
            title={t('excel.engine.reorderBudget', 'ميزانية إعادة التوريد')}
            subtitle="ESTIMATED REORDER BUDGET"
            value={`${totalReorderCost.toLocaleString()} DZD`}
            icon={<DollarSign className="w-3.5 h-3.5 text-emerald-400" />}
            color="emerald"
          />
          <HeaderBentoCard
            title={t('excel.engine.totalMachines', 'مجموع الآلات المسجلة')}
            subtitle="TOTAL ACTIVE MACHINES"
            value={machines.length}
            icon={<Factory className="w-3.5 h-3.5" />}
            color="purple"
          />
        </div>
      </PageHeader>
    </div>

      <div className="flex flex-col flex-1 px-6 md:px-8 mt-6 gap-6 min-h-0">
        {/* ENGINE NAVIGATION TABS */}
      <div className="flex items-center gap-2 bg-[#0a0a0f]/40 p-1.5 rounded-2xl border border-white/10 overflow-x-auto self-start">
        <button
          onClick={() => setActiveTab('reorder')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reorder'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{t('excel.engine.reorderMatrix', 'قالب الجرد المادي ورصيد المخزن')}</span>
          {lowStockItems.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40">
              {lowStockItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('preventive')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'preventive'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t('excel.engine.preventiveSchedule', 'جدول الصيانة الوقائية الإجمالي')}</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'import'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>{t('excel.engine.smartImport', 'الاستيراد الذكي المعتمد')}</span>
        </button>
      </div>

      {/* TAB 1: REORDER MATRIX */}
      {activeTab === 'reorder' && (
        <div className="flex flex-col gap-6">

          {/* ACTION BAR */}
          <GlassCard className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={t('excel.engine.searchPlaceholder', 'بحث برمز القطعة، الاسم، أو الرف...')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0a0a0f]/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={createRequisitionBatch}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{t('excel.engine.autoRequest', 'إنشاء طلب توريد تلقائي')} ({lowStockItems.length})</span>
              </button>

              <button
                onClick={exportReorderMatrixToExcel}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{t('excel.engine.exportXlsx', 'تصدير Excel XLSX')}</span>
              </button>
            </div>
          </GlassCard>

          {/* DATA TABLE */}
          <GlassCard className="overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table dir="ltr" className="w-full text-left text-xs">
                <thead className="bg-white/5 text-slate-400 uppercase border-b border-white/10">
                  <tr>
                    <th className="p-4 font-bold">{t('excel.engine.partCode', 'رمز القطعة')}</th>
                    <th className="p-4 font-bold">{t('excel.engine.partName', 'اسم قطعة الغيار')}</th>
                    <th className="p-4 text-center font-bold">{t('excel.engine.currentStock', 'الرصيد الحالي')}</th>
                    <th className="p-4 text-center font-bold">{t('excel.engine.minThreshold', 'الحد الأدنى')}</th>
                    <th className="p-4 text-center font-bold">{t('excel.engine.suggestedQty', 'المقترح للشراء')}</th>
                    <th className="p-4 font-bold">{t('excel.engine.unitPrice', 'سعر الوحدة')}</th>
                    <th className="p-4 font-bold">{t('excel.engine.estimatedCost', 'التكلفة التقديرية')}</th>
                    <th className="p-4 text-center font-bold">{t('excel.engine.status', 'الحالة')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredReorderData.length > 0 ? (
                    filteredReorderData.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-mono font-bold text-emerald-400">{item.partCode}</td>
                        <td className="p-4 font-medium text-white">{item.partName}</td>
                        <td className="p-4 text-center font-bold">
                          <span className={`px-2.5 py-1 rounded-lg ${item.isBelowMin ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            {item.currentStock} {item.unit}
                          </span>
                        </td>
                        <td className="p-4 text-center text-slate-400">{item.minThreshold} {item.unit}</td>
                        <td className="p-4 text-center font-bold text-amber-400">{item.qtyToReorder}</td>
                        <td className="p-4 text-slate-300">{item.unitPrice.toLocaleString()} DZD</td>
                        <td className="p-4 font-bold text-emerald-400">{item.estimatedCost.toLocaleString()} DZD</td>
                        <td className="p-4 text-center">
                          {item.isBelowMin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              {t('excel.engine.underMin', 'تحت الحد')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              {t('excel.engine.inStock', 'مكتمل')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        {t('excel.engine.noData', 'لا توجد بيانات مطابقة لشروط البحث')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 2: PREVENTIVE SCHEDULE */}
      {activeTab === 'preventive' && (
        <div className="flex flex-col gap-6">
          <GlassCard className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">{t('excel.engine.preventiveScheduleTitle', 'جدول الصيانة الوقائية الإجمالي (Preventive Master Schedule)')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('excel.engine.preventiveScheduleSubtitle', 'توليد شيت إكسيل منظم يضم المهام، الساعات، التخصص، وتوزيع العمالة')}</p>
            </div>
            <button
              onClick={exportPreventiveScheduleToExcel}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{t('excel.engine.exportSchedule', 'تصدير الجدول إلى Excel')}</span>
            </button>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard className="p-5">
              <span className="text-xs text-slate-400 font-bold">{t('excel.engine.totalTasks', 'إجمالي مهام الصيانة')}</span>
              <p className="text-2xl font-black text-white mt-1">{machineTasks.length || 12}</p>
            </GlassCard>
            <GlassCard className="p-5">
              <span className="text-xs text-slate-400 font-bold">{t('excel.engine.weeklyHours', 'الساعات التقديرية الأسبوعية')}</span>
              <p className="text-2xl font-black text-white mt-1">48.5 {t('excel.engine.hours', 'ساعة')}</p>
            </GlassCard>
            <GlassCard className="p-5">
              <span className="text-xs text-slate-400 font-bold">{t('excel.engine.requiredSkills', 'التخصصات المطلوبة')}</span>
              <p className="text-xs font-bold text-blue-400 mt-2">MÉCANIQUE | HYDRAULIQUE | ÉLECTRIQUE</p>
            </GlassCard>
          </div>
        </div>
      )}

      {/* TAB 3: SMART IMPORTER */}
      {activeTab === 'import' && (
        <div className="flex flex-col gap-6">
          <GlassCard className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">{t('excel.engine.smartImportTitle', 'الاستيراد الذكي المعتمد لقطع الغيار والآلات')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {t('excel.engine.smartImportSubtitle', 'يفحص ملف Excel تلقائياً للتأكد من عدم خرق قانون الـ 999 مقعد وتطابق الأكواد الثلاثية (ROB-001) قبل حفظها')}
              </p>
            </div>

            <button
              onClick={downloadSampleImportTemplate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-300 border border-emerald-500/30 font-bold text-xs"
            >
              <Download className="w-4 h-4" />
              <span>{t('excel.engine.downloadTemplate', 'تحميل قالب Excel القياسي جاهز للتعبئة')}</span>
            </button>
          </GlassCard>

          {/* UPLOAD BOX */}
          <GlassCard className="p-8 border-2 border-dashed border-emerald-500/30 bg-emerald-950/10 flex flex-col items-center justify-center text-center">
            <Upload className="w-12 h-12 text-emerald-400 mb-3 animate-pulse" />
            <p className="text-sm font-bold text-white">{t('excel.engine.dragDrop', 'اسحب ملف Excel هنا أو اضغط للاختيار')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('excel.engine.supportedFormats', 'يدعم صيغ .xlsx, .xls, .csv')}</p>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="mt-4 text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
            />
          </GlassCard>

          {/* VALIDATION RESULTS */}
          {importValidation.rows.length > 0 && (
            <div className="flex flex-col gap-4">
              <GlassCard className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-emerald-400">{t('excel.engine.validRows', 'الصفوف الصالحة')}: {importValidation.validCount}</span>
                  <span className="text-rose-400">{t('excel.engine.invalidRows', 'الصفوف غير الصالحة')}: {importValidation.invalidCount}</span>
                </div>

                <button
                  onClick={commitValidImportRows}
                  disabled={importValidation.validCount === 0}
                  className="px-6 py-2 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-lg transition-all"
                >
                  {t('excel.engine.importValid', 'استيراد الصفوف الصالحة')} ({importValidation.validCount})
                </button>
              </GlassCard>

              <GlassCard className="overflow-hidden !p-0">
                <div className="overflow-x-auto">
                  <table dir="ltr" className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-slate-400 border-b border-white/10">
                      <tr>
                        <th className="p-3 font-bold">{t('excel.engine.rowNumber', 'رقم الصف')}</th>
                        <th className="p-3 font-bold">{t('excel.engine.partCode', 'رمز القطعة')}</th>
                        <th className="p-3 font-bold">{t('excel.engine.partName', 'اسم قطعة الغيار')}</th>
                        <th className="p-3 text-center font-bold">{t('excel.engine.checkStatus', 'حالة الفحص')}</th>
                        <th className="p-3 font-bold">{t('excel.engine.errors', 'الملاحظات والأخطاء')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {importValidation.rows.map((r) => (
                        <tr key={r.rowNumber} className={r.isValid ? 'bg-emerald-950/10' : 'bg-rose-950/20'}>
                          <td className="p-3 font-mono text-slate-400">#{r.rowNumber}</td>
                          <td className="p-3 font-mono font-bold text-white">{r.code || t('excel.engine.missing', 'مفقود')}</td>
                          <td className="p-3 text-slate-200">{r.name || t('excel.engine.missing', 'مفقود')}</td>
                          <td className="p-3 text-center">
                            {r.isValid ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">{t('excel.engine.accepted', 'مقبول')}</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">{t('excel.engine.rejected', 'مرفوض')}</span>
                            )}
                          </td>
                          <td className="p-3">
                            {r.isValid ? (
                              <span className="text-emerald-400">{t('excel.engine.slotsOk', 'متوافق مع قانون الـ 999 مقعد')}</span>
                            ) : (
                              <span className="text-rose-400">{r.errors.join(' | ')}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      )}
    </div>
    </div>
  );
}

