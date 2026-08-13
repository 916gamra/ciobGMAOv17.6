import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db';
import { AuditService } from '@/core/logging/AuditService';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType 
} from 'docx';
import { saveAs } from 'file-saver';
import { motion } from 'motion/react';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { GlassCard } from '@/shared/components/GlassCard';
import { useTranslation } from 'react-i18next';
import { 
  FileCode, 
  Download, 
  HelpCircle, 
  GitCommit, 
  Building, 
  ShieldAlert,
  CheckSquare,
  ListTodo,
  ClipboardList,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

export function WordEngineView({ user }: { user?: any }) {
  const { t } = useTranslation();
  const [activeTemplate, setActiveTemplate] = useState<'rca' | 'contract'>('rca');

  // Machines List from DB
  const machines = useLiveQuery(() => db.machines.toArray()) || [];

  // --- RCA FORM STATE ---
  const [rcaMachineCode, setRcaMachineCode] = useState('MAC-SAT-001');
  const [rcaIncidentTitle, setRcaIncidentTitle] = useState('توقف مفاجئ في الخط الرئيسي بسبب انحشار المحامل وانصهار مانع التسرب');
  const [downtimeHours, setDowntimeHours] = useState('6.5');
  const [financialLoss, setFinancialLoss] = useState('450,000 DZD');

  // 5 Whys State
  const [fiveWhys, setFiveWhys] = useState<string[]>([
    'لماذا توقفت الآلة؟ -> حدوث ارتفاع حراري مفاجئ وانحشار المحرك.',
    'لماذا ارتفعت الحرارة؟ -> جفاف التشحيم وتلف المحمل الكروي الرئيسي.',
    'لماذا جف التشحيم؟ -> انسداد أنبوب التغذية التلقائية بالرايش المعدني.',
    'لماذا انسد الأنبوب؟ -> انعدام الفحص الوقائي الدوري لمرشح الزيت الرئيسي.',
    'السبب الجذر الأعمق (Root Cause): عدم تطبيق جدول الصيانة الوقائية الأسبوعي للمرشح.'
  ]);

  // Ishikawa Factors State
  const [fishbone, setFishbone] = useState({
    Machine: 'تأكل المحامل، تلف مانع التسرب',
    Method: 'تأخير تنفيذ أمر العمل الوقائي',
    Manpower: 'نقص تدريب الفني على ضبط العزم',
    Material: 'نوعية زيت تشحيم منخفضة اللزوجة',
    Measurement: 'مستشعر الحرارة غير معاير',
    Environment: 'حرارة ورشة الإنتاج عالية (42°C)'
  });

  // --- CONTRACT FORM STATE ---
  const [vendorName, setVendorName] = useState('شركة سيمنس للصيانة الصناعية الشاملة (Siemens Algeria)');
  const [contractDuration, setContractDuration] = useState('12 شهر (2026-2027)');
  const [slaHours, setSlaHours] = useState('2 ساعة في الحالات الحرجة');
  const [contractValue, setContractValue] = useState('2,800,000 DZD');

  // --- DOCX GENERATOR 1: RCA REPORT ---
  const exportRcaToWordDocx = async () => {
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title Header
            new Paragraph({
              text: "ROOT CAUSE ANALYSIS REPORT (RCA)",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "GMAO BDR NEXUS v17.1 - ENGINEERING DIAGNOSTIC", bold: true, color: "1E293B", size: 20 })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),

            // Meta Table
            new Paragraph({
              text: "1. Incident Overview / ملخص الحادث الفني",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Machine Code / Target", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(rcaMachineCode)] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Incident Description", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(rcaIncidentTitle)] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Downtime Duration", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(`${downtimeHours} Hours`)] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Estimated Financial Impact", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(financialLoss)] })
                  ]
                })
              ]
            }),

            // 5 Whys Section
            new Paragraph({
              text: "2. 5-Whys Root Cause Investigation / التحليل الخماسي للأسباب",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 100 }
            }),
            ...fiveWhys.map((why, index) => (
              new Paragraph({
                children: [
                  new TextRun({ text: `Why #${index + 1}: `, bold: true, color: "2563EB" }),
                  new TextRun({ text: why })
                ],
                spacing: { after: 120 }
              })
            )),

            // Ishikawa Section
            new Paragraph({
              text: "3. Ishikawa Diagram Breakdown (Fishbone) / المخطط السببي إيشيكاوا",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 100 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Category", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Contributing Factors", bold: true })] })] })
                  ]
                }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Machine / الآلة")] }), new TableCell({ children: [new Paragraph(fishbone.Machine)] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Method / الطريقة")] }), new TableCell({ children: [new Paragraph(fishbone.Method)] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Manpower / الأفراد")] }), new TableCell({ children: [new Paragraph(fishbone.Manpower)] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Material / المواد")] }), new TableCell({ children: [new Paragraph(fishbone.Material)] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Measurement / القياس")] }), new TableCell({ children: [new Paragraph(fishbone.Measurement)] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Environment / بيئة العمل")] }), new TableCell({ children: [new Paragraph(fishbone.Environment)] })] })
              ]
            }),

            // Corrective Action Plan
            new Paragraph({
              text: "4. Corrective Action Plan & Preventative Controls / خطة العلاج الوقائي",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 100 }
            }),
            new Paragraph({ text: "• Mandate weekly oil filter cleaning in Preventive Maintenance Plan." }),
            new Paragraph({ text: "• Upgrade bearing lubrication to high-temp synthetic grease ISO VG 220." }),
            new Paragraph({ text: "• Recalibrate thermal sensors and test automatic alarm thresholds." }),

            // Signatures
            new Paragraph({
              text: "Approved by Lead Maintenance Engineer: _______________________",
              spacing: { before: 600 }
            })
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `RCA_Report_${rcaMachineCode}_${new Date().toISOString().slice(0, 10)}.docx`;
      saveAs(blob, fileName);

      AuditService.log(
        'DOCX_RCA_REPORT_EXPORTED',
        'RCA_REPORT',
        rcaMachineCode,
        `Exported Root Cause Analysis DOCX report for machine ${rcaMachineCode}`,
        user?.id || 'sys-admin',
        user?.name || 'System Admin',
        'INFO'
      );

      toast.success(`تم إنشاء وتصدير تقرير RCA صيغة Word DOCX بنجاح (${fileName})`);
    } catch (err: any) {
      toast.error(`خطأ أثناء إنشاء ملف Word: ${err.message}`);
    }
  };

  // --- DOCX GENERATOR 2: SUBCONTRACTOR CONTRACT ---
  const exportContractToWordDocx = async () => {
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "SUBCONTRACTOR MAINTENANCE & SERVICE AGREEMENT",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),
            new Paragraph({
              text: "عقد صيانة وإصلاح خارجي متخصص - BDR NEXUS GMAO v17.1",
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),

            new Paragraph({
              text: `This Agreement is entered into between BDR Industrial Plant and ${vendorName}.`,
              spacing: { after: 200 }
            }),

            new Paragraph({
              text: "1. Scope of Work / نطاق الخدمات الفنية",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 }
            }),
            new Paragraph({ text: "• Complete overhaul and diagnostic balancing of heavy gearboxes and hydraulic pumps." }),
            new Paragraph({ text: "• Supply of original OEM replacement spare parts with manufacturer warranty." }),
            new Paragraph({ text: "• On-site 24/7 technical emergency intervention." }),

            new Paragraph({
              text: "2. Key Terms & Service Level Agreement (SLA)",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 100 }
            }),
            new Paragraph({ text: `• Contract Duration: ${contractDuration}` }),
            new Paragraph({ text: `• Emergency SLA Response Time: ${slaHours}` }),
            new Paragraph({ text: `• Total Agreement Value: ${contractValue}` }),

            new Paragraph({
              text: "3. Signatures & Authorizations / التوقيعات الرسمية",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 }
            }),
            new Paragraph({ text: "Client Representative: _______________________      Vendor Director: _______________________" })
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `Maintenance_Contract_${vendorName.slice(0, 15).replace(/\s/g, '_')}.docx`;
      saveAs(blob, fileName);

      toast.success(`تم إنشاء وتصدير عقد الصيانة الخارجية بصيغة Word DOCX بنجاح!`);
    } catch (err: any) {
      toast.error(`خطأ أثناء إنشاء عقد Word: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0f] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl text-slate-800 dark:text-slate-200 font-sans pb-4 overflow-hidden overflow-y-auto custom-scrollbar dir-ltr" dir="ltr">
      {/* PAGE HEADER */}
      <div className="p-6 md:p-8 pb-0 shrink-0">
        <PageHeader
        title={t('word.engine.title', 'محرك مستندات وورد (Word Engine DOCX)')}
        subtitle={t('word.engine.subtitle', 'توليد تقارير التحقيق في الأعطال الكبرى (RCA)، المخطط السببي إيشيكاوا، وعقود الصيانة والخدمات الخارجية.')}
        icon={<FileCode className="w-7 h-7 text-blue-400" />}
        badgeText="v17.1 DOCX"
        badgeColor="blue"
        actions={
          <button
            onClick={activeTemplate === 'rca' ? exportRcaToWordDocx : exportContractToWordDocx}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>{t('word.engine.quickDownload', 'تصدير مستند Word (.docx)')}</span>
          </button>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderBentoCard
            title={t('word.engine.fiveWhysPhases', 'مراحل التحليل الخماسي')}
            subtitle="5-WHYS PHASES"
            value={`${fiveWhys.length} خطوات`}
            icon={<ListTodo className="w-3.5 h-3.5 text-blue-400" />}
            color="blue"
          />
          <HeaderBentoCard
            title={t('word.engine.ishikawaParameters', 'أبعاد مخطط إيشيكاوا')}
            subtitle="ISHIKAWA PARAMETERS"
            value="6 تصنيفات"
            icon={<ClipboardList className="w-3.5 h-3.5 text-blue-400" />}
            color="blue"
          />
          <HeaderBentoCard
            title={t('word.engine.downtimeHours', 'ساعات التوقف (RCA)')}
            subtitle="DOWNTIME TRACKED"
            value={`${downtimeHours} ساعة`}
            icon={<ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
            color="rose"
          />
          <HeaderBentoCard
            title={t('word.engine.externalAgreements', 'اتفاقيات الخدمة الخارجية')}
            subtitle="ACTIVE EXTERNAL SLA"
            value={slaHours}
            icon={<Building className="w-3.5 h-3.5 text-emerald-400" />}
            color="emerald"
          />
        </div>
      </PageHeader>
    </div>

      <div className="flex flex-col flex-1 px-6 md:px-8 mt-6 gap-6 min-h-0">
        {/* TEMPLATE NAVIGATION TABS */}
      <div className="flex items-center gap-2 bg-[#0a0a0f]/40 p-1.5 rounded-2xl border border-white/10 overflow-x-auto self-start">
        <button
          onClick={() => setActiveTemplate('rca')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTemplate === 'rca'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{t('word.engine.rcaDocx', 'تقرير التحقيق في الأعطال الكبرى (RCA & Fishbone)')}</span>
        </button>

        <button
          onClick={() => setActiveTemplate('contract')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTemplate === 'contract'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>{t('word.engine.maintenanceContracts', 'عقود الصيانة والخدمات الخارجية')}</span>
        </button>
      </div>

      {/* TEMPLATE 1: RCA BUILDER */}
      {activeTemplate === 'rca' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* RCA BUILDER FORM */}
          <GlassCard className="p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-3">{t('word.engine.configureRca', 'تكوين تقرير التحقيق التشخيصي (RCA)')}</h3>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t('word.engine.chooseMachine', 'اختر الآلة التي تعرضت للعطل')}</label>
              <select
                value={rcaMachineCode}
                onChange={e => setRcaMachineCode(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0a0a0f]/50 border border-white/10 text-xs text-white"
              >
                {machines.map(m => (
                  <option key={m.id} value={m.referenceCode}>{m.referenceCode}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t('word.engine.incidentTitle', 'وصف حادث التوقف')}</label>
              <textarea
                value={rcaIncidentTitle}
                onChange={e => setRcaIncidentTitle(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl bg-[#0a0a0f]/50 border border-white/10 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{t('word.engine.downtimeHours', 'ساعات التوقف')}</label>
                <input
                  type="text"
                  value={downtimeHours}
                  onChange={e => setDowntimeHours(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0a0a0f]/50 border border-white/10 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{t('word.engine.financialLoss', 'الخسارة التقديرية')}</label>
                <input
                  type="text"
                  value={financialLoss}
                  onChange={e => setFinancialLoss(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0a0a0f]/50 border border-white/10 text-xs text-white"
                />
              </div>
            </div>

            <button
              onClick={exportRcaToWordDocx}
              className="mt-2 w-full py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{t('word.engine.generateRca', 'تصدير تقرير RCA صيغة Word (.docx)')}</span>
            </button>
          </GlassCard>

          {/* 5-WHYS & ISHIKAWA INTERACTIVE CANVAS */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* 5 WHYS BUILDER */}
            <GlassCard className="p-6 flex flex-col gap-3">
              <h4 className="text-xs font-bold text-blue-400 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                {t('word.engine.editWhys', 'التحليل الخماسي للأسباب (5-Whys Analysis)')}
              </h4>

              <div className="space-y-2">
                {fiveWhys.map((whyText, index) => (
                  <div key={index} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0a0a0f]/40 border border-white/10 text-xs">
                    <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center flex-shrink-0">
                      #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={whyText}
                      onChange={e => {
                        const newWhys = [...fiveWhys];
                        newWhys[index] = e.target.value;
                        setFiveWhys(newWhys);
                      }}
                      className="w-full bg-transparent border-none text-slate-200 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* ISHIKAWA FISHBONE BUILDER */}
            <GlassCard className="p-6 flex flex-col gap-3">
              <h4 className="text-xs font-bold text-blue-400 flex items-center gap-2">
                <GitCommit className="w-4 h-4" />
                {t('word.engine.ishikawaTitle', 'المخطط السببي إيشيكاوا (Ishikawa Fishbone Diagram)')}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {Object.entries(fishbone).map(([category, val]) => (
                  <div key={category} className="p-3 rounded-xl bg-[#0a0a0f]/40 border border-white/10">
                    <span className="font-bold text-blue-300 block mb-1">{category}</span>
                    <input
                      type="text"
                      value={val}
                      onChange={e => setFishbone({ ...fishbone, [category]: e.target.value })}
                      className="w-full bg-transparent border-none text-slate-300 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* TEMPLATE 2: CONTRACT BUILDER */}
      {activeTemplate === 'contract' && (
        <GlassCard className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">{t('word.engine.contractsTitle', 'عقود الصيانة والخدمات الخارجية (Subcontractor Contracts)')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('word.engine.contractsSubtitle', 'توليد مستندات وورد قانونية وفنية متكاملة للموردين الخارجيين مع دمج مواصفات الآلات')}</p>
            </div>

            <button
              onClick={exportContractToWordDocx}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{t('word.engine.generateContract', 'توليد عقد Word (.docx)')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">{t('word.engine.providerName', 'اسم المورد / الشركة الخارجية')}</label>
              <input type="text" value={vendorName} onChange={e => setVendorName(e.target.value)} className="w-full p-2.5 bg-[#0a0a0f]/50 border border-white/10 rounded-xl text-white" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{t('word.engine.contractDuration', 'مدة العقد')}</label>
              <input type="text" value={contractDuration} onChange={e => setContractDuration(e.target.value)} className="w-full p-2.5 bg-[#0a0a0f]/50 border border-white/10 rounded-xl text-white" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{t('word.engine.slaEmergency', 'اتفاقية مستوى الخدمة (SLA Emergency Response)')}</label>
              <input type="text" value={slaHours} onChange={e => setSlaHours(e.target.value)} className="w-full p-2.5 bg-[#0a0a0f]/50 border border-white/10 rounded-xl text-white" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{t('word.engine.annualBudget', 'القيمة المالية الإجمالية للعقد')}</label>
              <input type="text" value={contractValue} onChange={e => setContractValue(e.target.value)} className="w-full p-2.5 bg-[#0a0a0f]/50 border border-white/10 rounded-xl text-white" />
            </div>
          </div>
        </GlassCard>
      )}
    </div>
    </div>
  );
}
