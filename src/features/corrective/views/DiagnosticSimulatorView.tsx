import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Zap,
  Droplets,
  Wrench,
  Cpu,
  Wind,
  Info,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Thermometer,
  Radio
} from 'lucide-react';
import { useFailureCatalog } from '../hooks/useFailureCatalog';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { GlassCard } from '@/shared/components/GlassCard';
import { cn } from '@/shared/utils';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { motion, AnimatePresence } from 'motion/react';
import { useTabStore } from '@/app/store';
import { LabHierarchicalSidebar, HierarchyFamilyNode } from '@/shared/components/LabHierarchicalSidebar';

export function DiagnosticSimulatorView() {
  const { t } = useTranslation();
  const { openTab } = useTabStore();
  const { categories, templates, seedDefaultCategories } = useFailureCatalog();
  const { showSuccess } = useNotifications();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Interactive Simulator State
  const [diagnosticStep, setDiagnosticStep] = useState<number | string>(1);
  const [diagnosticOutput, setDiagnosticOutput] = useState<any>(null);

  // Seed default categories on mount once
  useEffect(() => {
    seedDefaultCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set default category once categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories.length, selectedCategoryId]);

  // Transform failure categories and templates for LabHierarchicalSidebar
  const hierarchicalFamilies: HierarchyFamilyNode[] = useMemo(() => {
    return categories.map(cat => {
      const lower = (cat.name || '').toLowerCase();
      let discipline: 'mechanical' | 'electrical' | 'hydraulic' | 'pneumatic' | 'electronic' | 'general' = 'general';
      let defaultCode = 'CAT';
      
      if (lower.includes('méc') || lower.includes('ميكانيك') || lower.includes('mechanical')) {
        discipline = 'mechanical';
        defaultCode = 'MEC';
      } else if (lower.includes('élec') || lower.includes('كهرباء') || lower.includes('electric')) {
        discipline = 'electrical';
        defaultCode = 'ELE';
      } else if (lower.includes('hydr') || lower.includes('هيدروليك') || lower.includes('hydraulic')) {
        discipline = 'hydraulic';
        defaultCode = 'HYD';
      } else if (lower.includes('pneu') || lower.includes('نيوماتيك') || lower.includes('pneumatic')) {
        discipline = 'pneumatic';
        defaultCode = 'PNU';
      } else if (lower.includes('électron') || lower.includes('إلكترونيك') || lower.includes('electronic')) {
        discipline = 'electronic';
        defaultCode = 'ELC';
      } else {
        defaultCode = (cat.name.substring(0, 3) || 'CAT').toUpperCase();
      }

      const catTemplates = templates.filter(t => t.categoryId === cat.id);

      return {
        id: cat.id,
        code: defaultCode,
        name: cat.name,
        subtitle: cat.description,
        discipline,
        count: catTemplates.length,
        templates: catTemplates.map(tpl => ({
          id: tpl.id,
          code: (tpl.severity || 'MED').toUpperCase().substring(0, 3),
          name: tpl.name,
          subtitle: tpl.description || undefined,
          raw: tpl
        })),
        raw: cat
      };
    });
  }, [categories, templates]);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const filteredTemplates = useMemo(() => {
    let list = templates;
    if (selectedCategoryId) {
      list = list.filter(t => t.categoryId === selectedCategoryId);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(t => 
        t.name.toLowerCase().includes(term) || 
        (t.description && t.description.toLowerCase().includes(term)) ||
        t.id.toLowerCase().includes(term)
      );
    }
    return list;
  }, [templates, selectedCategoryId, searchTerm]);

  // Set default template
  useEffect(() => {
    if (filteredTemplates.length > 0) {
      if (!selectedTemplateId || !filteredTemplates.some(t => t.id === selectedTemplateId)) {
        setSelectedTemplateId(filteredTemplates[0].id);
      }
    } else if (selectedTemplateId) {
      setSelectedTemplateId(null);
    }
  }, [filteredTemplates.length, selectedCategoryId]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Dynamic diagnostic matrix based on the active failure template
  const activeDiagnosticConfig = useMemo(() => {
    if (!selectedTemplate) return null;
    const name = selectedTemplate.name.toLowerCase();
    
    if (name.includes('fuite') || name.includes('تسرب') || name.includes('leak') || name.includes('mecanique') || name.includes('ميكانيك')) {
      return {
        symptom: 'تسرّب هيدروليكي مرئي أو انخفاض في رصيد خزان تزييت المحور الميكانيكي الرئيسي.',
        instruments: [
          { name: 'مقياس ضغط (Manometer)', icon: <Droplets className="w-3 h-3 text-cyan-400" /> },
          { name: 'ملتيميتر قياس (Multimeter)', icon: <Zap className="w-3 h-3 text-amber-400" /> },
          { name: 'مفتاح عزم الربط (Torque Wrench)', icon: <Wrench className="w-3 h-3 text-orange-400" /> }
        ],
        steps: [
          {
            id: 'step1',
            question: 'ما هي طبيعة ولون الزيت المتسرب وسرعة تدفقه الملاحظة؟',
            options: [
              { label: 'زيت داكن لزج مع تدفق مستمر تحت الضغط', next: 'leak_active' },
              { label: 'قطرات زيت خفيفة متقطعة عند توقف الآلة فقط', next: 'leak_static' }
            ]
          },
          {
            id: 'leak_active',
            question: 'هل يسجل مقياس الضغط الهيدروليكي انخفاضاً حاداً؟',
            options: [
              { label: 'نعم، الضغط ينخفض لأقل من 120 بار (الحد المسموح)', value: 'CRITICAL_LEAK' },
              { label: 'لا، الضغط مستقر عند مستواه الطبيعي', value: 'VALVE_SEAL_WEAR' }
            ]
          },
          {
            id: 'leak_static',
            question: 'هل قمت بفحص جلبة عمود الإدارة الرئيسي؟',
            options: [
              { label: 'نعم، تظهر عليها علامات تشقق وجفاف مادي', value: 'SHAFT_SEAL_REPLACE' },
              { label: 'لا، تظهر سليمة والترشيح جانبي من البراغي', value: 'BOLT_LOOSENING_ADJUST' }
            ]
          }
        ],
        results: {
          CRITICAL_LEAK: {
            title: 'عطل حرج في مانع التسرب المكبسي النشط',
            cause: 'تآكل كلي لمانع تسرب المكبس الرئيسي تحت الضغط العالي بسبب التعب المادي للقطعة.',
            action: 'إيقاف خط الإنتاج فوراً، إفراغ ضغط المجمع الهيدروليكي، استبدال طقم موانع التسرب وإضافة زيت هيدروليكي للتعويض.',
            parts: ['مانع تسرب هيدروليكي معتمد (JNT-005)', 'زيت هيدروليكي ناقل 46 (OIL-H46)']
          },
          VALVE_SEAL_WEAR: {
            title: 'تآكل مانع تسرب الصمام الجانبي',
            cause: 'تآكل ميكانيكي تدريجي في حلقة إحكام الصمامات الجانبية للموزع.',
            action: 'جدولة استبدال الحلقة عند التوقف المبرمج القادم، ومراقبة معدل النقص اليومي للزيت.',
            parts: ['حلقة مانعة للتسرب قياس 12مم (JNT-012)']
          },
          SHAFT_SEAL_REPLACE: {
            title: 'تلف مانع التسرب الدوار لعمود المحرك',
            cause: 'الاحتكاك المباشر الطويل للسرعات العالية وجفاف مادة الإيلاستومر.',
            action: 'فك العمود الرئيسي واستبدال جلبة الإحكام الدائرية للعمود لمنع زيادة التسرب للملفات الكهربائية.',
            parts: ['جلبة إحكام دائرية دوارة (JNT-088)']
          },
          BOLT_LOOSENING_ADJUST: {
            title: 'ارتخاء مسامير تثبيت الغطاء الجانبي',
            cause: 'الاهتزازات التشغيلية المستمرة تسببت في ارتخاء عزم الربط.',
            action: 'إعادة إحكام ربط المسامير بمفتاح العزم المعتمد وتوثيق الإجراء.',
            parts: []
          }
        }
      };
    }

    if (name.includes('temp') || name.includes('حرار') || name.includes('surchauffe') || name.includes('electrique') || name.includes('كهربا')) {
      return {
        symptom: 'ارتفاع غير معتاد في درجة حرارة الملفات أو علبة التروس (تتجاوز 85 درجة مئوية).',
        instruments: [
          { name: 'كاميرا حرارية (Thermal Camera)', icon: <Thermometer className="w-3 h-3 text-rose-400" /> },
          { name: 'ملتيميتر قياس (Multimeter)', icon: <Zap className="w-3 h-3 text-amber-400" /> },
          { name: 'جهاز قياس الاهتزاز (Vibrometer)', icon: <Activity className="w-3 h-3 text-orange-400" /> }
        ],
        steps: [
          {
            id: 'step1',
            question: 'أين تتركز البقعة الحرارية الأكثر سخونة عند الفحص بالكاميرا الحرارية؟',
            options: [
              { label: 'متركزة في قلب المحرك الكهربائي وصندوق الروابط', next: 'motor_coil' },
              { label: 'متركزة عند كرسي التحميل أو مخفض السرعة', next: 'gearbox_bearing' }
            ]
          },
          {
            id: 'motor_coil',
            question: 'هل تسجل شدة التيار الكهربائي المسحوب اختلالاً بين الأطوار الثلاثة؟',
            options: [
              { label: 'نعم، هناك عدم توازن يتجاوز 15% في أحد الأطوار', value: 'PHASE_UNBALANCE_SHORT' },
              { label: 'لا، التيار متوازن لكن الحمل الإجمالي زائد عن المقنن', value: 'OVERLOAD_VENTILATION' }
            ]
          },
          {
            id: 'gearbox_bearing',
            question: 'هل يرافق ارتفاع الحرارة ضجيج واهتزازات حركية؟',
            options: [
              { label: 'نعم، اهتزازات حادة عالية التردد مع صرير معدني', value: 'BEARING_DAMAGE_CRITICAL' },
              { label: 'لا، اهتزاز عادي لكن رصيد الشحم جاف تماماً', value: 'LUBRICATION_DEPLETED' }
            ]
          }
        ],
        results: {
          PHASE_UNBALANCE_SHORT: {
            title: 'انهيار عزل الملفات الكهربائية للمحرك',
            cause: 'تلف جزئي في عزل الورنيش للملفات نتيجة تسرب رطوبة أو إجهاد كهربائي متكرر.',
            action: 'فصل التغذية، إجراء قياس عزل الملفات، واستبدال المحرك أو القاطع التفاضلي.',
            parts: ['محرك كهربائي قياسي 5.5kW (MOT-014)', 'قاطع تفاضلي حماية (DIS-003)']
          },
          OVERLOAD_VENTILATION: {
            title: 'انسداد مروحة التبريد الذاتية وزيادة الحمل',
            cause: 'تراكم الأتربة الصناعية على زعانف التبريد الخارجية وإجهاد ميكانيكي على المحور.',
            action: 'تنظيف الزعانف، فحص ريش المروحة الخلفية واستبدالها إذا كانت مكسورة.',
            parts: ['مروحة تبريد خلفية لمحرك (FAN-002)']
          },
          BEARING_DAMAGE_CRITICAL: {
            title: 'تلف مسار دحرجة المحمل الكروي',
            cause: 'انتهاء العمر الافتراضي لكريات التحميل وجفاف الشحم التشغيلي تحت السرعة.',
            action: 'إيقاف فوري، سحب المحمل التالف بواسطة الزرجينة الميكانيكية، وتركيب محمل كروي جديد مشحم.',
            parts: ['محمل كروي معتمد SKF (ROB-001)', 'شحم حراري مخصص للسرعات (GRS-004)']
          },
          LUBRICATION_DEPLETED: {
            title: 'جفاف شحم التزييت الحراري',
            cause: 'تبخر قاعدة الزيت في الشحم بسبب تجاوز ساعات العمل المبرمجة دون تزييت وقائي.',
            action: 'حقن الشحم المعتمد عبر مشحمة الضغط اليدوي ومراقبة انخفاض الحرارة تدريجياً.',
            parts: ['شحم حراري مخصص (GRS-004)']
          }
        }
      };
    }

    // Default Generic Matrix for Other Faults
    return {
      symptom: 'عَرَض تشغيلي واهتزاز غير منتظم في منظومة الحركة الميكانيكية والكهربائية.',
      instruments: [
        { name: 'ملتيميتر قياس (Multimeter)', icon: <Zap className="w-3 h-3 text-amber-400" /> },
        { name: 'جهاز قياس الاهتزاز (Vibrometer)', icon: <Activity className="w-3 h-3 text-orange-400" /> },
        { name: 'تاكوميتر قياس السرعة الليزري', icon: <Radio className="w-3 h-3 text-cyan-400" /> }
      ],
      steps: [
        {
          id: 'step1',
          question: 'هل يظهر العطل أثناء بدء التشغيل والإقلاع أم بعد استقرار سرعة الدوران؟',
          options: [
            { label: 'يحدث فوراً عند الإقلاع وبدء الحركة', next: 'startup_issue' },
            { label: 'يحدث بعد فترة من التشغيل المستمر تحت الحمل', next: 'running_issue' }
          ]
        },
        {
          id: 'startup_issue',
          question: 'هل يدور المحور الميكانيكي بحرية وسلاسة عند فصل الكهرباء يدوياً؟',
          options: [
            { label: 'لا، المحور عالق ومقفل ميكانيكياً', value: 'MECHANICAL_JAM' },
            { label: 'نعم، يدور بسلاسة بدون أي مقاومة', value: 'ELECTRICAL_CONTROL_FAULT' }
          ]
        },
        {
          id: 'running_issue',
          question: 'هل تسجل حساسات الاهتزاز قيمة تتجاوز الحد القياسي المسموح؟',
          options: [
            { label: 'نعم، اهتزازات دورانية حادة مع عدم اتزان', value: 'MISALIGNMENT_UNBALANCE' },
            { label: 'لا، الاهتزاز ضمن المعدل المسموح', value: 'PROCESS_LOAD_FLUCTUATION' }
          ]
        }
      ],
      results: {
        MECHANICAL_JAM: {
          title: 'انحشار ميكانيكي وتلف وصلة نقل الحركة',
          cause: 'انكسار في أسنان المسنن أو تلف كلي للمحمل الداخلي أدى إلى غلق المحور.',
          action: 'تفكيك علبة التروس، فحص الوصلة المرنة واستبدال المحامل المكسورة.',
          parts: ['محمل كروي صناعي (ROB-001)', 'وصلة نقل حركة مرنة (CPG-002)']
        },
        ELECTRICAL_CONTROL_FAULT: {
          title: 'خلل في دائرة التحكم أو إشارة التمكين',
          cause: 'احتراق فيوز الحماية أو عطل في ريليه التشغيل التلامسي.',
          action: 'فحص خطوط التغذية واستبدال الفيوز أو الكونتاكتور التالف.',
          parts: ['ريليه تحكم تلامسي 24V (RLY-001)', 'طقم فيوزات حماية سريعة (FUS-010)']
        },
        MISALIGNMENT_UNBALANCE: {
          title: 'انحراف المحاذاة الميكانيكية للمحاور',
          cause: 'عدم تطابق محاور المحرك مع المضخة أو المخفض مما يولد إجهاداً على القارنات.',
          action: 'إجراء محاذاة ليزرية للمحاور وتثبيت قواعد المحرك برقائق الضبط.',
          parts: ['وصلة قارنة مرنة (CPG-002)', 'طقم رقائق ضبط المحاذاة (SHM-001)']
        },
        PROCESS_LOAD_FLUCTUATION: {
          title: 'تذبذب في حمل المواد الإنتاجية',
          cause: 'تغير في كثافة أو حجم المواد المدخلة في خط الإنتاج يسبب ضغطاً مؤقتاً.',
          action: 'معايرة سرعة التغذية ومراقبة ثبات الحمل مع قسم التشغيل.',
          parts: []
        }
      }
    };
  }, [selectedTemplate]);

  const currentStepData = useMemo(() => {
    if (!activeDiagnosticConfig) return null;
    if (diagnosticStep === 1) return activeDiagnosticConfig.steps[0];
    return activeDiagnosticConfig.steps.find(s => s.id === diagnosticStep);
  }, [activeDiagnosticConfig, diagnosticStep]);

  const handleDiagnosticOption = (nextStep?: string, resultValue?: string) => {
    if (resultValue && activeDiagnosticConfig) {
      setDiagnosticOutput(activeDiagnosticConfig.results[resultValue]);
      setDiagnosticStep(4); // Finished Step
    } else if (nextStep) {
      setDiagnosticStep(nextStep);
    }
  };

  const resetDiagnosticSimulator = () => {
    setDiagnosticStep(1);
    setDiagnosticOutput(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#08080c] text-slate-100 custom-scrollbar overflow-y-auto">
      {/* Page Header */}
      <div className="px-6 md:px-8 pt-6">
        <PageHeader
          title={t('corrective.diagnosticSimulator.title', 'شجرة التشخيص الميداني')}
          subtitle={t('corrective.diagnosticSimulator.subtitle', 'محاكاة الفحص والقياس الميداني خطوة بخطوة لتحديد الأسباب الجذرية الحركية وتحديد قطع الغيار المطلوبة.')}
          icon={<Activity className="w-7 h-7 text-orange-400" />}
          badgeText={t('corrective.diagnosticSimulator.badge', 'المحاكي الميداني v17.1')}
          badgeColor="orange"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('corrective.diagnosticSimulator.statSectors', 'القطاعات الصناعية')}
              subtitle="SECTORS"
              value={categories.length}
              valueUnit={t('unit.family', 'قطاع')}
              icon={<Layers className="w-3.5 h-3.5" />}
              color="orange"
            />
            <HeaderBentoCard
              title={t('corrective.diagnosticSimulator.statMatrices', 'مصفوفات الأعطال')}
              subtitle="MATRICES"
              value={templates.length}
              valueUnit={t('unit.type', 'مصفوفة')}
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              color="amber"
            />
            <HeaderBentoCard
              title={t('corrective.diagnosticSimulator.statAccuracy', 'دقة التشخيص')}
              subtitle="ACCURACY"
              value="98.5%"
              valueUnit="ISO"
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              color="emerald"
            />
            <HeaderBentoCard
              title={t('corrective.diagnosticSimulator.statStatus', 'حالة المحاكي')}
              subtitle="STATUS"
              value="ONLINE"
              valueUnit="v17.1"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              color="blue"
            />
          </div>
        </PageHeader>
      </div>

      {/* Main Workspace Area: Split-Pane Twin Panels */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 p-6 md:p-8 pt-0 overflow-hidden min-h-0">
        
        {/* Left Navigation Panel: Categories & Faults Tree (Golden Master Lab Standard) */}
        <div className="w-full md:w-96 shrink-0 h-[650px] md:h-auto min-h-0">
          <LabHierarchicalSidebar
            title={t('corrective.failureCatalog.familiesAndSectors', 'العائلات والقطاعات')}
            subtitle="CATEGORIES & SECTORS"
            families={hierarchicalFamilies}
            selectedFamilyId={selectedCategoryId}
            selectedTemplateId={selectedTemplateId}
            onSelectFamily={(fam) => {
              setSelectedCategoryId(fam ? fam.id : null);
              setSelectedTemplateId(null);
              resetDiagnosticSimulator();
            }}
            onSelectTemplate={(tmpl, fam) => {
              if (fam) setSelectedCategoryId(fam.id);
              setSelectedTemplateId(tmpl ? tmpl.id : null);
              resetDiagnosticSimulator();
            }}
            onPrimaryAction={() => openTab({ id: 'failure-catalog', portalId: 'CORRECTIVE', title: 'كتالوج الأعطال', component: 'failure-catalog' })}
            primaryActionLabel={t('corrective.failureCatalog.openCatalogBtn', 'إدارة وتعديل كتالوج الأعطال')}
            onResetSelection={() => {
              setSelectedCategoryId(null);
              setSelectedTemplateId(null);
              resetDiagnosticSimulator();
            }}
            resetLabel={t('corrective.diagnosticSimulator.allMatrices', 'عرض جميع مصفوفات التشخيص')}
            engineTheme="orange"
          />
        </div>

        {/* Right Main Workspace Canvas (Exact parity with EngineeringLabView design) */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <GlassCard className="flex flex-col flex-1 !p-0 border-white/10 overflow-hidden shadow-2xl bg-[#0a0b10]/95 backdrop-blur-xl relative w-full h-full min-h-0">
            
            {/* Engine Accent Line */}
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent pointer-events-none z-20" />

            {/* Ambient Glows */}
            <div className="absolute -top-12 -right-12 sm:-top-20 sm:-right-20 w-64 h-64 sm:w-80 sm:h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none z-0" />
            <div className="absolute -bottom-12 -left-12 sm:-bottom-20 sm:-left-20 w-64 h-64 sm:w-80 sm:h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none z-0" />

            {/* Foreground Content */}
            <div className="relative z-10 flex flex-col flex-1 min-h-0 w-full h-full">
              
              {selectedTemplate && activeDiagnosticConfig ? (
                <div className="flex flex-col h-full min-h-0 p-6 md:p-8">
                  
                  {/* Top Header Row (Matching EngineeringLabView standard) */}
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b border-white/10 pb-6 mb-6 gap-4 text-start">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-inner shrink-0 text-orange-400">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div className="text-start">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold bg-white/10 text-white px-2 py-0.5 rounded border border-white/15">
                            {filteredTemplates.length} {t('corrective.failureCatalog.activeFailuresCount', 'عطل')}
                          </span>
                          <h3 className="text-lg font-bold text-white tracking-tight">
                            {t('corrective.diagnosticSimulator.simulatorTitle', 'محاكي شجرة التشخيص الميداني')}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                          {selectedCategory?.name} / {selectedTemplate.name}
                        </p>
                      </div>
                    </div>

                    {/* Header Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={resetDiagnosticSimulator}
                        className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-950" />
                        <span>{t('corrective.diagnosticSimulator.resetSimulator', 'تهيئة المحاكي')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openTab({ id: 'failure-catalog', portalId: 'CORRECTIVE', title: 'كتالوج الأعطال', component: 'failure-catalog' })}
                        className="bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 font-bold rounded-xl px-4 py-2.5 text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5 text-orange-400" />
                        <span>{t('corrective.failureCatalog.catalog', 'الكتالوج')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-bar: Faults Carousel and Search Input with Clear Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5 shrink-0">
                    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0 flex-1">
                      <span className="text-xs font-bold text-slate-300 shrink-0">
                        {t('corrective.diagnosticSimulator.selectFaultForTree', 'حدد العطل:')}
                      </span>
                      {filteredTemplates.map(tItem => {
                        const isTarget = selectedTemplateId === tItem.id;
                        return (
                          <button
                            key={tItem.id}
                            type="button"
                            onClick={() => {
                              setSelectedTemplateId(tItem.id);
                              resetDiagnosticSimulator();
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1.5",
                              isTarget 
                                ? "bg-white text-slate-950 border-white shadow-md font-extrabold" 
                                : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:text-white"
                            )}
                          >
                            <span>{tItem.name}</span>
                            <span className={cn(
                              "text-[9px] font-mono px-1.5 py-0.2 rounded",
                              isTarget ? "bg-slate-900 text-white" : "bg-white/10 text-slate-400"
                            )}>
                              {tItem.id.length > 8 ? `TR-${tItem.id.slice(-4).toUpperCase()}` : tItem.id}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Search Input Bar with Clear Button */}
                    <div className="relative w-full sm:w-64 shrink-0">
                      <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      <input 
                        type="text" 
                        placeholder={t('corrective.failureCatalog.searchPlaceholder', 'بحث باسم العطل أو الأعراض...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#111218] border border-white/10 rounded-xl py-2 pl-9 pr-8 rtl:pr-9 rtl:pl-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-colors shadow-inner text-start"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-[10px] cursor-pointer transition-colors"
                          title={t('common.clear', 'مسح')}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Simulation Workspace Body */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                    
                    {/* Active Target Banner */}
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 relative overflow-hidden text-start">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded">
                              {selectedTemplate.id.length > 8 ? `TR-${selectedTemplate.id.slice(-4).toUpperCase()}` : selectedTemplate.id}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-slate-300 px-2 py-0.5 rounded">
                              ISO 14224
                            </span>
                            <h4 className="text-base font-extrabold text-white tracking-tight">{selectedTemplate.name}</h4>
                          </div>
                          {selectedTemplate.description && (
                            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                              {selectedTemplate.description}
                            </p>
                          )}
                        </div>

                        {/* Measuring Instruments */}
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {t('corrective.diagnosticSimulator.recommendedInstruments', 'أجهزة الفحص الموصى بها:')}
                          </span>
                          {activeDiagnosticConfig.instruments.map((inst, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 text-[11px] flex items-center gap-1.5 font-mono">
                              {inst.icon}
                              <span>{inst.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Step Wizard Container */}
                    <div className="bg-[#08080c]/90 rounded-3xl border border-white/10 p-6 md:p-8 min-h-[360px] flex flex-col justify-between relative overflow-hidden shadow-2xl">
                      
                      {/* Observed Symptom Box */}
                      {diagnosticStep === 1 && (
                        <div className="mb-6 bg-white/[0.03] border border-white/10 p-4 rounded-2xl flex items-start gap-3 text-start">
                          <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                              {t('corrective.diagnosticSimulator.observedSymptom', 'العَرَض الملاحظ في ساحة العمل:')}
                            </span>
                            <p className="text-sm text-slate-200 font-bold leading-relaxed mt-1">
                              {activeDiagnosticConfig.symptom}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Active Step Question */}
                      {diagnosticStep !== 4 && currentStepData ? (
                        <div className="flex-1 flex flex-col justify-center py-6 text-center">
                          <span className="text-[10px] font-mono text-white bg-white/10 px-3 py-1 rounded-full border border-white/15 uppercase tracking-widest mb-4 inline-block mx-auto font-black">
                            {t('corrective.diagnosticSimulator.measurementStep', 'مرحلة البحث والقياس الميداني')} - {diagnosticStep === 1 ? t('corrective.diagnosticSimulator.stepOne', 'الخطوة الأولى') : t('corrective.diagnosticSimulator.stepTwo', 'الخطوة الثانية')}
                          </span>
                          <h3 className="text-lg sm:text-xl font-extrabold text-white max-w-2xl mx-auto leading-relaxed mb-8">
                            {currentStepData.question}
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
                            {currentStepData.options.map((opt, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleDiagnosticOption(opt.next, opt.value)}
                                className="p-4 rounded-2xl border border-white/10 hover:border-orange-500/50 bg-white/[0.03] hover:bg-white/[0.08] text-slate-200 hover:text-white text-xs font-extrabold leading-relaxed transition-all duration-200 cursor-pointer active:scale-95 text-center shadow-lg group flex flex-col items-center justify-center gap-2"
                              >
                                <span className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-orange-500/20 text-slate-400 group-hover:text-orange-300 flex items-center justify-center text-[10px] font-mono">
                                  {i + 1}
                                </span>
                                <span>{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Final Diagnostic Output */}
                      {diagnosticStep === 4 && diagnosticOutput && (
                        <div className="flex-1 space-y-6 py-4">
                          <div className="text-center mb-6">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider mb-2">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {t('corrective.diagnosticSimulator.diagnosticComplete', 'اكتمل التشخيص الهندسي بنجاح')}
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black text-white">{diagnosticOutput.title}</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-rose-500/10 p-5 rounded-2xl border border-rose-500/20 space-y-2 text-start">
                              <span className="text-xs text-rose-300 font-bold block">{t('corrective.diagnosticSimulator.rootCause', 'السبب المادي الحركي:')}</span>
                              <p className="text-xs text-slate-200 leading-relaxed font-semibold">{diagnosticOutput.cause}</p>
                            </div>

                            <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 space-y-2 text-start">
                              <span className="text-xs text-emerald-300 font-bold block">{t('corrective.diagnosticSimulator.correctiveAction', 'الإجراء العلاجي المقترح:')}</span>
                              <p className="text-xs text-slate-200 leading-relaxed font-semibold">{diagnosticOutput.action}</p>
                            </div>
                          </div>

                          {/* Required Spare Parts */}
                          {diagnosticOutput.parts && diagnosticOutput.parts.length > 0 && (
                            <div className="bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-start">
                              <span className="text-xs text-white font-bold block mb-3">{t('corrective.diagnosticSimulator.requiredPdr', 'قطع الغيار المطلوب سحبها من المخزن فوراً:')}</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {diagnosticOutput.parts.map((p: string, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-white/10">
                                    <span className="text-xs text-slate-200 font-bold">{p}</span>
                                    <span className="text-[10px] font-mono bg-white/10 text-white border border-white/15 px-2 py-0.5 rounded">
                                      {p.match(/\(([^)]+)\)/)?.[1] || 'PDR-REF'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-center gap-3 pt-4 border-t border-white/5 flex-wrap">
                            <button
                              type="button"
                              onClick={resetDiagnosticSimulator}
                              className="px-6 py-2.5 bg-white text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                            >
                              <RefreshCw className="w-4 h-4 text-slate-950" />
                              <span>{t('corrective.diagnosticSimulator.checkAnotherFault', 'فحص عَرَض آخر للآلة')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => showSuccess(t('corrective.diagnosticSimulator.reportApprovedSuccess', 'تم توثيق بروتوكول التشخيص وربطه بأمر الصيانة'))}
                              className="px-5 py-2.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-500/40 font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4 text-orange-400" />
                              <span>{t('corrective.diagnosticSimulator.approveReport', 'اعتماد التقرير الميداني')}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Progress Indicators */}
                      {diagnosticStep !== 4 && (
                        <div className="mt-8 border-t border-white/5 pt-4 flex items-center justify-between text-xs text-slate-500">
                          <span className="text-[10px] font-mono">ISO 14224 DECISION BRANCH</span>
                          <div className="flex gap-1.5">
                            <div className={cn("w-6 h-1.5 rounded-full", diagnosticStep === 1 || typeof diagnosticStep === 'string' ? "bg-white" : "bg-white/10")} />
                            <div className={cn("w-6 h-1.5 rounded-full", diagnosticStep === 'motor_coil' || diagnosticStep === 'gearbox_bearing' || diagnosticStep === 'leak_active' || diagnosticStep === 'leak_static' ? "bg-white" : "bg-white/10")} />
                            <div className={cn("w-6 h-1.5 rounded-full animate-pulse", diagnosticStep === 4 ? "bg-white" : "bg-white/10")} />
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              ) : (
                /* Welcome Explorer Empty State */
                <motion.div
                  key="default-welcome"
                  initial={{ opacity: 0, scale: 0.98, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 text-center w-full space-y-6 relative z-10 overflow-y-auto custom-scrollbar min-h-0 box-border"
                >
                  {/* Glowing Engine Icon Container */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400 shadow-[0_0_40px_rgba(249,115,22,0.25)]">
                      <Activity className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900 border border-orange-500/40 flex items-center justify-center text-orange-300 shadow-md">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-w-xl">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                      {t('corrective.diagnosticSimulator.welcomeTitle', 'محاكي شجرة التشخيص الميداني')}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                      {t('corrective.diagnosticSimulator.welcomeDesc', 'منظومة تحليل الفشل الميداني المتقدمة المعتمدة على معيار ISO 14224 لتوجيه الفنيين نحو السبب الجذري الدقيق.')}
                    </p>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-3 flex-wrap justify-center shrink-0">
                    <button
                      type="button"
                      onClick={() => openTab({ id: 'failure-catalog', portalId: 'CORRECTIVE', title: 'كتالوج الأعطال', component: 'failure-catalog' })}
                      className="px-5 py-2.5 sm:px-6 sm:py-3 bg-white text-slate-950 font-extrabold rounded-2xl shadow-xl hover:bg-slate-200 transition-all flex items-center gap-2 text-xs cursor-pointer active:scale-95"
                    >
                      <Wrench className="w-4 h-4 text-slate-950" />
                      <span>{t('corrective.failureCatalog.openCatalogBtn', 'إدارة وتعديل كتالوج الأعطال')}</span>
                    </button>
                  </div>

                  {/* Bento Grid Feature Highlight Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl text-start pt-2">
                    <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-orange-500/30 transition-all duration-300 space-y-2 group backdrop-blur-md">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Activity className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-orange-300 transition-colors">
                        {t('corrective.diagnosticSimulator.guidanceIsoTitle', 'معيار التحليل السببي')}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                        {t('corrective.diagnosticSimulator.guidanceIsoDesc', 'شجرة قرار هندسية متسلسلة تعتمد على اختبارات القياس الفيزيائية والكهربائية لاستبعاد الفرضيات الخاطئة.')}
                      </p>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-orange-500/30 transition-all duration-300 space-y-2 group backdrop-blur-md">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {t('corrective.diagnosticSimulator.guidanceDirectPdrTitle', 'التكامل مع بونات الصرف')}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                        {t('corrective.diagnosticSimulator.guidanceDirectPdrDesc', 'تحويل نتائج التشخيص فورا إلى مراجع قطع غيار معتمدة لإنشاء طلبات الصرف دون تأخير.')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
