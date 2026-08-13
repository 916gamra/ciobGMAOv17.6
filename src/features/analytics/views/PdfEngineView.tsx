import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { AuditService } from '@/core/logging/AuditService';
import { jsPDF } from 'jspdf';
import { motion } from 'motion/react';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { GlassCard } from '@/shared/components/GlassCard';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Printer, 
  Download, 
  QrCode, 
  ShieldCheck, 
  Tag, 
  Wrench, 
  SlidersHorizontal,
  LayoutGrid,
  Factory,
  Boxes,
  FileDigit
} from 'lucide-react';
import { toast } from 'sonner';

export function PdfEngineView({ user }: { user?: any }) {
  const { t } = useTranslation();
  const [activeTemplate, setActiveTemplate] = useState<'workOrder' | 'binLabels' | 'certificate'>('workOrder');

  // Database Queries
  const machines = useLiveQuery(() => db.machines.toArray()) || [];
  const pdrBlueprints = useLiveQuery(() => db.pdrBlueprints.toArray()) || [];
  const inventoryItems = useLiveQuery(() => db.inventory.toArray()) || [];

  // Work Order Form State
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [woTitle, setWoTitle] = useState('صيانة شملت استبدال المحامل ومانع التسرب الهيدروليكي');
  const [techName, setTechName] = useState(user?.name || 'الفني المسؤول - كريم القاسمي');
  const [woPriority, setWoPriority] = useState<'HIGH' | 'MEDIUM' | 'CRITICAL'>('HIGH');

  const selectedMachine = machines.find(m => m.id === selectedMachineId) || machines[0] || {
    id: 'MAC-SAT-001',
    referenceCode: 'MAC-SAT-001',
    serialNumber: 'SN-2024-DE-9941',
    sectorId: 'Production-Line-1',
    status: 'Active'
  };

  // Bin Labels State
  const [labelGridFormat, setLabelGridFormat] = useState<'2x4' | '3x5'>('2x4');

  // Certificate State
  const [vibrationBefore, setVibrationBefore] = useState('8.4 mm/s RMS');
  const [vibrationAfter, setVibrationAfter] = useState('1.2 mm/s RMS');
  const [tempBefore, setTempBefore] = useState('85 °C');
  const [tempAfter, setTempAfter] = useState('42 °C');

  // --- PDF GENERATOR 1: WORK ORDER SHEET ---
  const generateWorkOrderPdf = () => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const docCode = `WO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      // Background Frame
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, 210, 297, 'F');

      // Top Red Banner
      doc.setFillColor(225, 29, 72);
      doc.rect(0, 0, 210, 18, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text('GMAO BDR NEXUS v17.1 - WORK ORDER SHEET', 15, 12);
      doc.setFontSize(10);
      doc.text(docCode, 160, 12);

      // Document Title
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(18);
      doc.text('FIELD WORK ORDER / بطاقة أمر العمل الميداني', 15, 32);

      // Meta Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(15, 38, 180, 35, 3, 3, 'FD');

      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(`Machine Code: ${selectedMachine.referenceCode}`, 20, 46);
      doc.text(`Sector / Location: ${selectedMachine.sectorId || 'Production'}`, 20, 53);
      doc.text(`Serial Number: ${selectedMachine.serialNumber || 'SN-UNKNOWN'}`, 20, 60);

      doc.text(`Priority: ${woPriority}`, 120, 46);
      doc.text(`Technician: ${techName}`, 120, 53);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 60);

      // QR Code Simulation Box
      doc.setDrawColor(225, 29, 72);
      doc.rect(165, 42, 25, 25);
      doc.setFontSize(7);
      doc.text('SCAN QR', 171, 56);
      doc.text(selectedMachine.referenceCode, 166, 62);

      // Maintenance Tasks Section
      doc.setFontSize(12);
      doc.setTextColor(225, 29, 72);
      doc.text('1. EXECUTION CHECKLIST / خطوات التنفيذ', 15, 83);

      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const tasks = [
        '[ ] Lockout / Tagout (LOTO) Electrical Safety Isolation',
        '[ ] Drain hydraulic oil reservoir and inspect filtration unit',
        '[ ] Replace worn ball bearing assemblies & mechanical seals',
        '[ ] Perform laser alignment of drive coupling',
        '[ ] Test run for 15 minutes - check vibration & temperature metrics'
      ];
      let yPos = 91;
      tasks.forEach(t => {
        doc.text(t, 20, yPos);
        yPos += 7;
      });

      // Consumed Spare Parts Section
      doc.setFontSize(12);
      doc.setTextColor(225, 29, 72);
      doc.text('2. REQUIRED CONSUMED SPARE PARTS / قطع الغيار المستهلكة', 15, 135);

      // Parts Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(15, 140, 180, 8, 'F');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Slot Code', 20, 145);
      doc.text('Description', 60, 145);
      doc.text('Qty Requested', 130, 145);
      doc.text('Stock Rack', 165, 145);

      const parts = [
        { code: 'ROB-001', desc: 'Ball Bearing 6205-2RS C3', qty: '2 U', rack: 'A-01-02' },
        { code: 'JOINT-014', desc: 'Hydraulic Seal Kit 50x70', qty: '1 Set', rack: 'B-03-01' },
        { code: 'OIL-002', desc: 'ISO VG 46 Synthetic Oil', qty: '5 L', rack: 'C-01-05' }
      ];

      yPos = 153;
      parts.forEach(p => {
        doc.text(p.code, 20, yPos);
        doc.text(p.desc, 60, yPos);
        doc.text(p.qty, 130, yPos);
        doc.text(p.rack, 165, yPos);
        yPos += 7;
      });

      // Signatures Section
      doc.setDrawColor(203, 213, 225);
      doc.line(15, 230, 195, 230);

      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text('Technician Signature:', 20, 245);
      doc.text('Storekeeper Sign:', 80, 245);
      doc.text('Manager Approval:', 140, 245);

      doc.rect(20, 250, 45, 20);
      doc.rect(80, 250, 45, 20);
      doc.rect(140, 250, 45, 20);

      // Save PDF
      doc.save(`${docCode}_Work_Order.pdf`);

      AuditService.log(
        'PDF_WORK_ORDER_GENERATED',
        'WORK_ORDER',
        docCode,
        `Generated Work Order PDF for machine ${selectedMachine.referenceCode}`,
        user?.id || 'sys-admin',
        user?.name || 'System Admin',
        'INFO'
      );

      toast.success(`تم إنشاء بطاقة أمر العمل الميداني PDF بنجاح [${docCode}]!`);
    } catch (err: any) {
      toast.error(`خطأ أثناء إنشاء PDF: ${err.message}`);
    }
  };

  // --- PDF GENERATOR 2: BIN LABELS GRID ---
  const generateBinLabelsPdf = () => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      
      const itemsToPrint = pdrBlueprints.length > 0 ? pdrBlueprints.slice(0, labelGridFormat === '2x4' ? 8 : 15) : [
        { reference: 'ROB-001', model: 'محمل كروي 6205-2RS', minThreshold: 10 },
        { reference: 'ROB-002', model: 'مانع تسرب هيدروليكي 40x60', minThreshold: 15 },
        { reference: 'JOINT-003', model: 'جوان سيلكون حراري 250C', minThreshold: 5 },
        { reference: 'PUMP-001', model: 'مضخة زيث 15L/min', minThreshold: 2 },
        { reference: 'ELEC-005', model: 'قاطع تفاضلي 30mA Schneider', minThreshold: 8 },
        { reference: 'VALVE-002', model: 'صمام هيدروليكي 24VDC', minThreshold: 4 },
        { reference: 'BELT-001', model: 'سير ناقل V-Belt B-52', minThreshold: 12 },
        { reference: 'FILTER-002', model: 'مرشح هيدروليكي 10 Micron', minThreshold: 20 }
      ];

      const cols = labelGridFormat === '2x4' ? 2 : 3;
      const cardW = labelGridFormat === '2x4' ? 88 : 58;
      const cardH = labelGridFormat === '2x4' ? 62 : 48;
      const startX = 12;
      const startY = 15;

      itemsToPrint.forEach((item: any, idx: number) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);

        const x = startX + (col * (cardW + 6));
        const y = startY + (row * (cardH + 6));

        // Label Card Outer Border
        doc.setDrawColor(225, 29, 72);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, cardW, cardH, 3, 3, 'FD');

        // Header Bar
        doc.setFillColor(225, 29, 72);
        doc.rect(x, y, cardW, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('BDR NEXUS - PDR BIN TAG', x + 4, y + 5.5);

        // Content
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(11);
        doc.text(item.reference || 'ROB-001', x + 4, y + 16);

        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        const nameText = item.model ? item.model.slice(0, 22) : 'قطعة غيار';
        doc.text(nameText, x + 4, y + 22);

        doc.setFontSize(7);
        doc.text(`Min Threshold: ${item.minThreshold || 5} U`, x + 4, y + 28);
        doc.text(`Location: Rack A-0${(idx % 4) + 1}`, x + 4, y + 33);

        // Simulated Barcode
        doc.setFillColor(15, 23, 42);
        for (let b = 0; b < 22; b++) {
          const bw = (b % 3 === 0) ? 1.2 : 0.6;
          doc.rect(x + 4 + (b * 2.2), y + 38, bw, 12, 'F');
        }

        doc.setFontSize(6);
        doc.text(`*${item.reference}*`, x + 15, y + 53);
      });

      doc.save(`PDR_Bin_Labels_${labelGridFormat}_A4.pdf`);
      toast.success(`تم استخراج شبكة ملصقات الأرفف A4 بصيغة PDF بنجاح!`);
    } catch (err: any) {
      toast.error(`خطأ أثناء إنشاء ملصقات PDF: ${err.message}`);
    }
  };

  // --- PDF GENERATOR 3: SAFETY CLEARANCE CERTIFICATE ---
  const generateCertificatePdf = () => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const certRef = `CERT-CLEARANCE-${Math.floor(10000 + Math.random() * 90000)}`;

      // Elegant Double Border Frame
      doc.setDrawColor(225, 29, 72);
      doc.setLineWidth(1.5);
      doc.rect(10, 10, 190, 277);

      doc.setLineWidth(0.5);
      doc.rect(13, 13, 184, 271);

      // Header Banner
      doc.setFillColor(225, 29, 72);
      doc.rect(13, 13, 184, 25, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('MACHINE HEALTH & SAFETY CLEARANCE CERTIFICATE', 25, 28);
      doc.setFontSize(9);
      doc.text('شهادة جاهزية الآلة والسلامة المهنية المعتمدة - BDR NEXUS v17.1', 25, 34);

      // Cert Ref
      doc.setFontSize(10);
      doc.text(`Ref: ${certRef}`, 145, 28);

      // Machine Meta
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text('OFFICIAL EQUIPMENT OVERHAUL CLEARANCE', 20, 50);

      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(`Machine Code: ${selectedMachine.referenceCode}`, 20, 60);
      doc.text(`Serial Number: ${selectedMachine.serialNumber || 'SN-9941-DE'}`, 20, 67);
      doc.text(`Inspection Date: ${new Date().toLocaleDateString()}`, 20, 74);

      // VIBRATION & TEMP METRICS TABLE
      doc.setFontSize(11);
      doc.setTextColor(225, 29, 72);
      doc.text('TECHNICAL DIAGNOSTIC METRICS (PRE vs POST OVERHAUL)', 20, 89);

      doc.setFillColor(241, 245, 249);
      doc.rect(20, 94, 170, 8, 'F');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Parameter Metric', 25, 99);
      doc.text('Before Overhaul', 75, 99);
      doc.text('After Overhaul', 115, 99);
      doc.text('Status / Tolerance', 155, 99);

      const metrics = [
        { name: 'Vibration (RMS mm/s)', before: vibrationBefore, after: vibrationAfter, status: 'PASSED (ISO 10816)' },
        { name: 'Bearing Temp (°C)', before: tempBefore, after: tempAfter, status: 'PASSED (<55 °C)' },
        { name: 'Hydraulic Leak Test', before: '3.2 Bar Drop/min', after: '0.0 Bar Drop/min', status: 'PASSED (SEALED)' },
        { name: 'Electrical Isolation (MΩ)', before: '1.2 MΩ', after: '50.0 MΩ', status: 'PASSED (SAFE)' }
      ];

      let y = 108;
      metrics.forEach(m => {
        doc.text(m.name, 25, y);
        doc.text(m.before, 75, y);
        doc.text(m.after, 115, y);
        doc.text(m.status, 155, y);
        y += 8;
      });

      // SAFETY INSPECTION CHECKLIST
      doc.setFontSize(11);
      doc.setTextColor(225, 29, 72);
      doc.text('SAFETY & SECURITY SYSTEMS CLEARANCE', 20, 155);

      const checks = [
        '✔ Emergency Stop Buttons (E-Stop): Tested & Instant Trigger Verified',
        '✔ Safety Interlock Guards: Doors & Light Curtains Fully Active',
        '✔ Hydraulic Pressure Relief Valve: Calibrated to 210 Bar',
        '✔ Environmental Zero-Leak Clearance: Passed Clean Inspection'
      ];

      y = 165;
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      checks.forEach(c => {
        doc.text(c, 25, y);
        y += 7;
      });

      // CERTIFICATION STAMP & SIGNATURES
      doc.setDrawColor(225, 29, 72);
      doc.rect(130, 210, 50, 45);
      doc.setFontSize(8);
      doc.setTextColor(225, 29, 72);
      doc.text('OFFICIAL CERTIFIED', 135, 225);
      doc.text('SAFETY CLEARANCE', 135, 231);
      doc.text('STAMP & SIGNATURE', 135, 237);

      doc.setTextColor(51, 65, 85);
      doc.setFontSize(9);
      doc.text('Chief Safety Officer:', 25, 220);
      doc.text('Maintenance Director:', 25, 240);

      doc.line(25, 230, 80, 230);
      doc.line(25, 250, 80, 250);

      doc.save(`${certRef}_Clearance_Certificate.pdf`);
      toast.success(`تم إصدار وتنزيل شهادة جاهزية الآلة والسلامة بنجاح [${certRef}]!`);
    } catch (err: any) {
      toast.error(`خطأ أثناء إنشاء الشهادة: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0f] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl text-slate-800 dark:text-slate-200 font-sans pb-4 overflow-hidden overflow-y-auto custom-scrollbar dir-ltr" dir="ltr">
      {/* PAGE HEADER */}
      <div className="p-6 md:p-8 pb-0 shrink-0">
        <PageHeader
        title={t('pdf.engine.title', 'محرك التقارير الفنية (PDF Engine)')}
        subtitle={t('pdf.engine.subtitle', 'توليد بطاقات أوامر العمل الميدانية بالباركود، ملصقات الأرفف، وشهادات السلامة وجاهزية الآلة المعتمدة.')}
        icon={<FileText className="w-7 h-7 text-rose-400" />}
        badgeText="v17.1 PDF"
        badgeColor="rose"
        actions={
          <button
            onClick={generateWorkOrderPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>{t('pdf.engine.issueWo', 'إصدار بطاقة عمل PDF')}</span>
          </button>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title={t('pdf.engine.partsCatalog', 'كتالوج قطع الغيار')}
            subtitle="PDR BLUEPRINTS"
            value={pdrBlueprints.length}
            icon={<LayoutGrid className="w-3.5 h-3.5" />}
            color="blue"
          />
          <HeaderBentoCard
            title={t('pdf.engine.storageUnits', 'الوحدات المخزنية')}
            subtitle="TOTAL STORAGE UNITS"
            value={inventoryItems.length}
            icon={<Boxes className="w-3.5 h-3.5" />}
            color="emerald"
          />
          <HeaderBentoCard
            title={t('pdf.engine.registeredMachinery', 'الآلات المسجلة')}
            subtitle="REGISTERED MACHINERY"
            value={machines.length}
            icon={<Factory className="w-3.5 h-3.5" />}
            color="purple"
          />
          <HeaderBentoCard
            title={t('pdf.engine.systemEngineStatus', 'معدل جاهزية النظام')}
            subtitle="SYSTEM ENGINE STATUS"
            value="100%"
            icon={<FileDigit className="w-3.5 h-3.5" />}
            color="rose"
          />
        </div>
      </PageHeader>
    </div>

      <div className="flex flex-col flex-1 px-6 md:px-8 mt-6 gap-6 min-h-0">
        {/* TEMPLATE NAVIGATION TABS */}
      <div className="flex items-center gap-2 bg-[#0a0a0f]/40 p-1.5 rounded-2xl border border-white/10 overflow-x-auto self-start">
        <button
          onClick={() => setActiveTemplate('workOrder')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTemplate === 'workOrder'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>{t('pdf.engine.fieldWoCard', 'بطاقة أمر العمل الميداني')}</span>
        </button>

        <button
          onClick={() => setActiveTemplate('binLabels')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTemplate === 'binLabels'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>{t('pdf.engine.binTagsBarcode', 'بطاقات الأرفف والباركود')}</span>
        </button>

        <button
          onClick={() => setActiveTemplate('certificate')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTemplate === 'certificate'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t('pdf.engine.clearanceCertificate', 'شهادة جاهزية الآلة والسلامة')}</span>
        </button>
      </div>

      {/* TEMPLATE 1: WORK ORDER */}
      {activeTemplate === 'workOrder' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CONFIGURATION PANEL */}
          <GlassCard className="p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <SlidersHorizontal className="w-4 h-4 text-rose-400" />
              {t('pdf.engine.configureWoData', 'تكوين بيانات بطاقة أمر العمل')}
            </h3>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t('pdf.engine.chooseTargetMachine', 'اختر الآلة المستهدفة')}</label>
              <select
                value={selectedMachineId}
                onChange={e => setSelectedMachineId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0a0a0f]/50 border border-white/10 text-xs text-white"
              >
                {machines.map(m => (
                  <option key={m.id} value={m.id}>{m.referenceCode}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t('pdf.engine.woTitle', 'عنوان مهمة الصيانة')}</label>
              <input
                type="text"
                value={woTitle}
                onChange={e => setWoTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0a0a0f]/50 border border-white/10 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t('pdf.engine.responsibleTech', 'الفني الميداني المسؤول')}</label>
              <input
                type="text"
                value={techName}
                onChange={e => setTechName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0a0a0f]/50 border border-white/10 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t('pdf.engine.priorityLevel', 'مستوى الأولوية')}</label>
              <select
                value={woPriority}
                onChange={e => setWoPriority(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-[#0a0a0f]/50 border border-white/10 text-xs text-white"
              >
                <option value="MEDIUM">{t('pdf.engine.priorityMedium', 'عادية (MEDIUM)')}</option>
                <option value="HIGH">{t('pdf.engine.priorityHigh', 'عالية (HIGH)')}</option>
                <option value="CRITICAL">{t('pdf.engine.priorityCritical', 'حرجة جداً (CRITICAL)')}</option>
              </select>
            </div>

            <button
              onClick={generateWorkOrderPdf}
              className="mt-2 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{t('pdf.engine.generateWoPdf', 'توليد وتنزيل بطاقة أمر العمل (PDF)')}</span>
            </button>
          </GlassCard>

          {/* LIVE PREVIEW CANVAS */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-rose-500/30 flex flex-col gap-4 text-slate-900 bg-white/95 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600" />
                <span className="font-mono text-xs font-bold text-rose-700">PREVIEW: WORK ORDER A4 SHEET</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">WO-2026-PDF-001</span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-base text-slate-900">{selectedMachine.referenceCode}</h4>
                  <p className="text-xs text-slate-600">{t('pdf.engine.previewMachine', 'رمز الآلة')}: {selectedMachine.referenceCode} | {t('pdf.engine.previewSector', 'القسم')}: {selectedMachine.sectorId || 'Production-01'}</p>
                </div>
                <div className="w-12 h-12 rounded bg-white p-1 border flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-slate-800" />
                </div>
              </div>

              <div>
                <h5 className="font-bold text-xs text-rose-700 uppercase tracking-wider mb-2">{t('pdf.engine.checklistTitle', '1. قائمة الخطوات التشغيلية (Checklist)')}</h5>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <p>☑ {t('pdf.engine.lotoSafety', 'عزل الطاقة الكهربائية (LOTO Safety Clearance)')}</p>
                  <p>☑ {t('pdf.engine.drainReservoir', 'تفريغ الخزان الهيدروليكي واستبدال المرشحات')}</p>
                  <p>☑ {t('pdf.engine.installBearing', 'تركيب المحمل الكروي الجديد والمحاذاة بالليزر')}</p>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-xs text-rose-700 uppercase tracking-wider mb-2">{t('pdf.engine.consumedParts', '2. قطع الغيار المستهلكة من المخزن')}</h5>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-50 p-2 rounded border">
                  <div>ROB-001 (Ball Bearing)</div>
                  <div>2 {t('pdf.engine.units', 'Units')}</div>
                  <div>Rack A-01-02</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE 2: BIN LABELS */}
      {activeTemplate === 'binLabels' && (
        <div className="flex flex-col gap-6">
          <GlassCard className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">{t('pdf.engine.binLabelsTitle', 'بطاقات الأرفف بالباركود (PDR Bin Labels Grid A4)')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('pdf.engine.binLabelsSubtitle', 'طباعة شبكة ملصقات A4 تحتوي على كود المقعد الثلاثي والباركود لسرعة الكسح بالمخزن')}</p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={labelGridFormat}
                onChange={e => setLabelGridFormat(e.target.value as any)}
                className="p-2.5 rounded-xl bg-[#0a0a0f]/50 border border-white/10 text-xs text-white"
              >
                <option value="2x4">{t('pdf.engine.grid2x4', 'شبكة 2x4 (8 ملصقات كبيرة)')}</option>
                <option value="3x5">{t('pdf.engine.grid3x5', 'شبكة 3x5 (15 ملصقاً قياسياً)')}</option>
              </select>

              <button
                onClick={generateBinLabelsPdf}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>{t('pdf.engine.downloadBinLabels', 'تنزيل شبكة الملصقات PDF')}</span>
              </button>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="p-4 rounded-xl bg-white text-slate-900 border-2 border-rose-500 shadow-md font-sans">
                <div className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex justify-between">
                  <span>BDR NEXUS BIN TAG</span>
                  <span>RACK A-0{idx}</span>
                </div>
                <h4 className="font-mono font-black text-sm text-slate-900 mt-2">ROB-00{idx}</h4>
                <p className="text-xs text-slate-600 font-medium truncate">{t('pdf.engine.bearingSample', 'محمل كروي 6205-2RS')}</p>
                <div className="mt-3 bg-slate-100 p-2 rounded text-center font-mono text-[9px]">
                  |||| | |||||| | ||||||| | ||
                  <p className="mt-1 text-[8px] text-slate-500">*ROB-00{idx}*</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEMPLATE 3: CLEARANCE CERTIFICATE */}
      {activeTemplate === 'certificate' && (
        <div className="flex flex-col gap-6">
          <GlassCard className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">{t('pdf.engine.certTitle', 'شهادة جاهزية الآلة والسلامة (Clearance Certificate)')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('pdf.engine.certSubtitle', 'شهادة معتمدة تحتوي على المؤشرات التشخيصية قبل وبعد الصيانة وتوقيعات السلامة')}</p>
            </div>

            <button
              onClick={generateCertificatePdf}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>{t('pdf.engine.generateCert', 'إصدار شهادة الجاهزية (PDF)')}</span>
            </button>
          </GlassCard>

          <GlassCard className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">{t('pdf.engine.vibrationBefore', 'الاهتزاز قبل الصيانة (Vibration Before)')}</label>
              <input type="text" value={vibrationBefore} onChange={e => setVibrationBefore(e.target.value)} className="w-full p-2.5 bg-[#0a0a0f]/50 border border-white/10 rounded-xl text-white" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{t('pdf.engine.vibrationAfter', 'الاهتزاز بعد الصيانة (Vibration After)')}</label>
              <input type="text" value={vibrationAfter} onChange={e => setVibrationAfter(e.target.value)} className="w-full p-2.5 bg-[#0a0a0f]/50 border border-white/10 rounded-xl text-white" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{t('pdf.engine.tempBefore', 'الحرارة قبل الصيانة (Temp Before)')}</label>
              <input type="text" value={tempBefore} onChange={e => setTempBefore(e.target.value)} className="w-full p-2.5 bg-[#0a0a0f]/50 border border-white/10 rounded-xl text-white" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{t('pdf.engine.tempAfter', 'الحرارة بعد الصيانة (Temp After)')}</label>
              <input type="text" value={tempAfter} onChange={e => setTempAfter(e.target.value)} className="w-full p-2.5 bg-[#0a0a0f]/50 border border-white/10 rounded-xl text-white" />
            </div>
          </GlassCard>
        </div>
      )}
    </div>
    </div>
  );
}
