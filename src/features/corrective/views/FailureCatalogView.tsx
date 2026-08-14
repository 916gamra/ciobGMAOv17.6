import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, Settings2, Plus, Search,
  Wrench, Zap, Droplets, Wind, Cpu, ShieldAlert,
  ChevronRight, Activity, Filter, CheckCircle2, FolderTree,
  Trash2, HelpCircle, Sparkles, RefreshCw, Info, LayoutGrid, Eye,
  Clock, ArrowRight
} from 'lucide-react';
import { useFailureCatalog } from '../hooks/useFailureCatalog';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeaderBentoCard } from '@/shared/components/HeaderBentoCard';
import { cn } from '@/shared/utils';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/shared/components/GlassCard';

export function FailureCatalogView() {
  const { t } = useTranslation();
  const { categories, templates, seedDefaultCategories, addCategory, addTemplate, deleteCategory, deleteTemplate } = useFailureCatalog();
  const { showSuccess, showError } = useNotifications();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateSeverity, setNewTemplateSeverity] = useState<'low'|'medium'|'high'|'critical'>('medium');

  // Lab View Layout & Display Mode States (Table vs Cards)
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>('table');
  const [activeTab, setActiveTab] = useState<'catalog' | 'diagnostic'>('catalog');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Diagnostic simulator states
  const [diagnosticStep, setDiagnosticStep] = useState<number | string>(1);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, string>>({});
  const [diagnosticOutput, setDiagnosticOutput] = useState<any | null>(null);

  // Seed defaults on mount
  useEffect(() => {
    seedDefaultCategories();
  }, []);

  // Select first category by default if none selected
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const id = await addCategory(newCategoryName, '', 'slate-500');
      setNewCategoryName('');
      setIsAddingCategory(false);
      setSelectedCategoryId(id);
      showSuccess('تم إضافة العائلة بنجاح');
    } catch (err) {
      showError('فشل إضافة العائلة');
    }
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim() || !selectedCategoryId) return;
    try {
      const id = await addTemplate(selectedCategoryId, newTemplateName, newTemplateDesc, newTemplateSeverity);
      setNewTemplateName('');
      setNewTemplateDesc('');
      setNewTemplateSeverity('medium');
      setIsAddingTemplate(false);
      setSelectedTemplateId(id);
      showSuccess('تم تسجيل العطل بنجاح في الكتالوج');
    } catch (err) {
      showError('فشل تسجيل العطل');
    }
  };

  const filteredTemplates = useMemo(() => {
    if (!selectedCategoryId) return [];
    let list = templates.filter(t => t.categoryId === selectedCategoryId);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(term) || t.description?.toLowerCase().includes(term));
    }
    return list;
  }, [templates, selectedCategoryId, searchTerm]);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  // Automatically select first template when switching tabs/categories to ensure diagnostic labs are loaded
  useEffect(() => {
    if (filteredTemplates.length > 0) {
      if (!selectedTemplateId || !filteredTemplates.some(t => t.id === selectedTemplateId)) {
        setSelectedTemplateId(filteredTemplates[0].id);
      }
    } else {
      setSelectedTemplateId(null);
    }
  }, [filteredTemplates, selectedCategoryId]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Dynamic content based on active template for the "Diagnostic Simulator"
  const activeDiagnosticConfig = useMemo(() => {
    if (!selectedTemplate) return null;
    const name = selectedTemplate.name.toLowerCase();
    
    if (name.includes('fuite') || name.includes('تسرب') || name.includes('leak') || name.includes('mecanique') || name.includes('ميكانيك')) {
      return {
        symptom: 'تسرّب هيدروليكي مرئي أو انخفاض في رصيد خزان تزييت المحور الميكانيكي الرئيسي.',
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
            question: 'هل يسجل مقياس الضغط الهيدروليكي (Pressure Gauge) انخفاضاً حاداً؟',
            options: [
              { label: 'نعم، الضغط ينخفض لأقل من 120 بار (الحد المسموح)', value: 'CRITICAL_LEAK', parts: ['JNT-005', 'OIL-H46'] },
              { label: 'لا، الضغط مستقر عند مستواه الطبيعي', value: 'VALVE_SEAL_WEAR', parts: ['JNT-012'] }
            ]
          },
          {
            id: 'leak_static',
            question: 'هل قمت بفحص جلبة عمود الإدارة الرئيسي (Gasket / Shaft Lip Seal)؟',
            options: [
              { label: 'نعم، تظهر عليها علامات تشقق وجفاف مادي', value: 'SHAFT_SEAL_REPLACE', parts: ['JNT-088'] },
              { label: 'لا، تظهر سليمة والترشيح جانبي من البراغي', value: 'BOLT_LOOSENING_ADJUST', parts: [] }
            ]
          }
        ],
        results: {
          CRITICAL_LEAK: {
            title: 'عطل حرج في مانع التسرب المكبسي النشط',
            cause: 'تآكل كلي لمانع تسرب المكبس الرئيسي تحت الضغط العالي بسبب التعب المادي للقطعة (Fatigue).',
            action: 'إيقاف خط الإنتاج فوراً، إفراغ ضغط الـ Accumulator، استبدال طقم موانع التسرب وإضافة زيت هيدروليكي للتعويض.',
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
            cause: 'الاحتكاك المباشر الطويل للسرعات العالية وجفاف مادة الـ Elastomer.',
            action: 'فك العمود الرئيسي واستبدال جلبة الإحكام الدائرية للعمود لمنع زيادة التسرب للملفات الكهربائية.',
            parts: ['جلبة إحكام العمود الدوار (JNT-088)']
          },
          BOLT_LOOSENING_ADJUST: {
            title: 'ارتخاء براغي التثبيت وغطاء الخزان',
            cause: 'الاهتزازات الدائمة للماكينة أدت لخلخلة براغي شد الغطاء الجانبي.',
            action: 'شد البراغي وفقاً لعزم الدوران القياسي (Torque Table) وتنظيف جسم الماكينة ومتابعة الترشيح.',
            parts: []
          }
        }
      };
    }

    if (name.includes('temp') || name.includes('حرار') || name.includes('surchauffe') || name.includes('electrique') || name.includes('كهربا')) {
      return {
        symptom: 'ارتفاع غير معتاد في درجة حرارة الملفات أو علبة التروس (تتجاوز 85 درجة مئوية).',
        steps: [
          {
            id: 'step1',
            question: 'ما هو مصدر الحرارة الرئيسي الذي تم رصده بالحساس الحراري؟',
            options: [
              { label: 'الملفات النحاسية وصندوق التوصيلات الكهربائية للمحرك', next: 'motor_coil' },
              { label: 'علبة التروس الميكانيكية ونقاط كراسي التحميل (Bearings)', next: 'gearbox_bearing' }
            ]
          },
          {
            id: 'motor_coil',
            question: 'عند قياس شدة التيار بالأمبيرمتر، هل هناك عدم توازن في الأطوار (Phase Unbalance)؟',
            options: [
              { label: 'نعم، طور واحد يسحب تياراً أعلى بـ 15% من البقية', value: 'PHASE_UNBALANCE_CRITICAL', parts: ['CON-SCH09', 'RLY-OVR12'] },
              { label: 'لا، شدة التيار طبيعية في الأطوار الثلاثة', value: 'MOTOR_FAN_CLOGGED', parts: [] }
            ]
          },
          {
            id: 'gearbox_bearing',
            question: 'هل يصدر صوت صفير أو ضوضاء حادة من كرسي التحميل الدوار؟',
            options: [
              { label: 'نعم، صوت احتكاك معدني واضح وجاف', value: 'BEARING_DESTRUCTION_RISK', parts: ['ROB-001'] },
              { label: 'لا، الصوت طبيعي ولكن درجة الزيت متدنية جداً', value: 'OIL_LACK_GREASE', parts: ['GRS-M2'] }
            ]
          }
        ],
        results: {
          PHASE_UNBALANCE_CRITICAL: {
            title: 'عدم اتزان أطوار التيار وحمل زائد ميكانيكي',
            cause: 'ضعف عزل أحد الملفات أو ارتخاء في تلامسات الموصل المغناطيسي (Contactor).',
            action: 'فحص ملامسات الكونتاكتور واستبداله، وضبط ريليه الحماية الحرارية لدرء تلف المحرك الكلي.',
            parts: ['موصل مغناطيسي شنايدر 9 أمبير (CON-SCH09)', 'مرحل حماية حرارية زائدة (RLY-OVR12)']
          },
          MOTOR_FAN_CLOGGED: {
            title: 'انسداد ممرات التهوية أو مروحة التبريد للخلفية',
            cause: 'تراكم الغبار الصناعي والزيوت على شبكة التبريد الخلفية للمحرك مما يعيق التبادل الحراري.',
            action: 'إيقاف المحرك، تنظيف الشفرات وضمان تدفق الهواء الطبيعي حول جسم المبدد الحراري.',
            parts: []
          },
          BEARING_DESTRUCTION_RISK: {
            title: 'تلف داخلي في كريات كرسي التحميل الميكانيكي',
            cause: 'انتهاء العمر الافتراضي أو تشوه المسارات الداخلية لكريات التحميل مسبباً احتكاكاً هائلاً.',
            action: 'استبدال المحمل الكروي التالف بالكامل لتفادي تدمير العمود الدوار (Shaft Axis).',
            parts: ['محمل كروي معتمد ذو صف دبل (ROB-001)']
          },
          OIL_LACK_GREASE: {
            title: 'نقص التزييت وجفاف الشحوم التشغيلية',
            cause: 'تبخر الشحوم القديمة أو تسرب الزيت الملين لعلبة التروس.',
            action: 'إعادة حقن الشحوم المخصصة للسرعات العالية ومراجعة مستويات الزيت بانتظام.',
            parts: ['شحم صناعي مخصص للحرارة والسرعة (GRS-M2)']
          }
        }
      };
    }

    // Default Fallback Scenario for custom created items
    return {
      symptom: 'فشل تشغيلي مفاجئ يتسبب في توقف أو تراجع كفاءة الماكنة مجهول السبب.',
      steps: [
        {
          id: 'step1',
          question: 'ما هي الاستجابة الأولى للآلة عند الضغط على زر التشغيل الرئيسي؟',
          options: [
            { label: 'لا توجد استجابة تامة، والشاشة مطفأة ولا توجد أصوات', next: 'power_lost' },
            { label: 'يصدر صوت محاولة إقلاع ثم تفصل لوحة الحماية فوراً', next: 'overload_trip' }
          ]
        },
        {
          id: 'power_lost',
          question: 'هل قمت بفحص وجود الجهد (380V/220V) في مدخل قاطع اللوحة الرئيسي؟',
          options: [
            { label: 'نعم، الجهد مفقود بالكامل من المصدر الخارجي', value: 'GRID_POWER_FAULT', parts: [] },
            { label: 'نعم الجهد موجود، ومصهر التحكم (Control Fuse) تالف', value: 'FUSE_BLOWN_REPLACE', parts: ['FUS-02A'] }
          ]
        },
        {
          id: 'overload_trip',
          question: 'عند تدوير عمود الماكنة يدوياً (والكهرباء مفصولة)، هل يدور بسلاسة؟',
          options: [
            { label: 'لا، العمود مصلد ومستعصي تماماً عن الدوران (Grippage)', value: 'MECHANICAL_JAM_BLOCK', parts: [] },
            { label: 'نعم يدور بسلاسة، ولكن ريليه زيادة الحمل مضبوط بشكل منخفض للغاية', value: 'RELAY_ADJUSTMENT_FAULT', parts: [] }
          ]
        }
      ],
      results: {
        GRID_POWER_FAULT: {
          title: 'انقطاع تيار الشبكة الصناعية الرئيسي',
          cause: 'خلل في خط التغذية الفرعي للمصنع أو فصل القاطع العمومي في غرفة المحولات.',
          action: 'الاتصال بفنيي الكهرباء بقسم البنية التحتية لفحص القواطع الكبرى واستعادة التغذية.',
          parts: []
        },
        FUSE_BLOWN_REPLACE: {
          title: 'تلف مصهر حماية دائرة التحكم والمنطق',
          cause: 'حدوث دائرة قصر مؤقتة (Short Circuit) في صمام مغناطيسي أو سلك تحكم ملامس للهيكل.',
          action: 'البحث عن سلك التماس وعزله، ثم استبدال الفتيل التالف بآخر معتمد بنفس السعة.',
          parts: ['مصهر زجاجي سريع الفصل 2 أمبير (FUS-02A)']
        },
        MECHANICAL_JAM_BLOCK: {
          title: 'استعصاء ميكانيكي حاد في الآليات المتحركة',
          cause: 'دخول جسم غريب أو كسر جزء داخلي (ترس أو ذراع ميكانيكي) مما قفل حركة العمود.',
          action: 'تفكيك الغطاء الواقي، الكشف عن سبب الانحشار وإصلاح الأجزاء المكسورة وتنظيف المسار.',
          parts: []
        },
        RELAY_ADJUSTMENT_FAULT: {
          title: 'خطأ في معيرة تيار الحماية ضد زيادة الحمل',
          cause: 'تعديل غير دقيق لتدريج الأمبير في ريليه الأوفرلود مما يجعله يتحسس لتيار بدء الإقلاع الطبيعي.',
          action: 'إعادة ضبط ريليه الأوفرلود وفقاً لبطاقة المحرك الاسمية ونسبة 1.1 من تيار الخدمة.',
          parts: []
        }
      }
    };
  }, [selectedTemplate]);

  // Handle Diagnostic Navigation
  const currentStepData = useMemo(() => {
    if (!activeDiagnosticConfig) return null;
    return activeDiagnosticConfig.steps.find(s => s.id === (diagnosticStep === 1 ? 'step1' : diagnosticStep));
  }, [activeDiagnosticConfig, diagnosticStep]);

  const handleDiagnosticOption = (next: string | undefined, finalValue?: string) => {
    if (finalValue && activeDiagnosticConfig) {
      setDiagnosticOutput(activeDiagnosticConfig.results[finalValue]);
      setDiagnosticStep(4); // Final Output step
    } else if (next) {
      setDiagnosticStep(next as any);
    }
  };

  const resetDiagnosticSimulator = () => {
    setDiagnosticStep(1);
    setDiagnosticAnswers({});
    setDiagnosticOutput(null);
  };


  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] rounded-3xl border border-white/5 shadow-2xl text-slate-200 font-sans pb-4 overflow-hidden">
      {/* Header Cockpit */}
      <div className="p-6 md:p-8 pb-0">
        <PageHeader
          title={t('corrective.failureCatalog.title', 'مختبر الأعطال والشجرة التشخيصية')}
          subtitle={t('corrective.failureCatalog.subtitle', 'الانتقال من التوثيق الجاف إلى التحليل المتقدم وهندسة الموثوقية الصناعية (RAMS & FMEA) لأصول المصنع.')}
          icon={<AlertTriangle className="w-7 h-7 text-orange-400" />}
          badgeText={t('corrective.failureCatalog.badge', 'مختبر الأعطال والتشخيص v17.1')}
          badgeColor="orange"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title={t('corrective.failureCatalog.statFamilies', 'العائلات الصناعية')}
              subtitle="CATEGORIES"
              value={categories.length}
              valueUnit={t('unit.family', 'عائلة')}
              icon={<FolderTree className="w-3.5 h-3.5" />}
              color="orange"
            />
            <HeaderBentoCard
              title={t('corrective.failureCatalog.statFailures', 'أنواع الأعطال')}
              subtitle="FAILURES"
              value={templates.length}
              valueUnit={t('unit.type', 'نوع')}
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              color="amber"
            />
            <HeaderBentoCard
              title={t('corrective.failureCatalog.statReliability', 'مستوى الموثوقية')}
              subtitle="RELIABILITY"
              value="94.2%"
              valueUnit={t('unit.excellent', 'ممتاز')}
              icon={<Activity className="w-3.5 h-3.5" />}
              color="emerald"
            />
            <HeaderBentoCard
              title={t('corrective.failureCatalog.statTreeStatus', 'حالة شجرة التشخيص')}
              subtitle="DIAGNOSTIC STATUS"
              value="100%"
              valueUnit={t('unit.ready', 'جاهزة')}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              color="blue"
            />
          </div>
        </PageHeader>
      </div>

      {/* Core Workspace Area: Twin Cards Architecture (Left Sidebar + Right Workspace Pane) */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 p-6 md:p-8 pt-0 overflow-hidden min-h-0">
        
        {/* Left Navigation Card (RTL): Categories & Target Failure Sub-selector */}
        <div className="w-full md:w-80 bg-gradient-to-b from-orange-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl overflow-y-auto custom-scrollbar shrink-0 p-5 flex flex-col justify-between relative">
          
          {/* Background ambient engine accent glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-5">
            {/* Header Title & Subtitle */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">{t('corrective.failureCatalog.familiesAndSectors', 'العائلات والقطاعات')}</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5">CATEGORIES & SECTORS</span>
              </div>
              <span className="text-[10px] bg-white/10 text-white font-mono px-2.5 py-1 rounded-full border border-white/15 font-bold">
                {categories.length} Cat
              </span>
            </div>

            {/* Prominent Action Button */}
            <button 
              type="button"
              onClick={() => setIsAddingCategory(true)}
              className="w-full bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-3 py-2.5 text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>{t('corrective.failureCatalog.newFamilyBtn', 'إضافة عائلة أعطال جديدة')}</span>
            </button>
            
            {/* Categories List */}
            <div className="space-y-2 pt-1">
              {categories.map(cat => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      resetDiagnosticSimulator();
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-xs font-bold cursor-pointer text-start",
                      isSelected 
                        ? "bg-white/10 border-white/20 text-white font-extrabold shadow-md"
                        : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg border transition-colors",
                        isSelected 
                          ? "bg-white/15 border-white/25 text-white" 
                          : "bg-white/5 border-white/10 text-slate-300"
                      )}>
                        {cat.name.includes('Mécanique') || cat.name.includes('ميكانيك') ? <Wrench className="w-4 h-4" /> :
                         cat.name.includes('Électrique') || cat.name.includes('كهرباء') ? <Zap className="w-4 h-4" /> :
                         cat.name.includes('Hydraulique') || cat.name.includes('هيدروليك') ? <Droplets className="w-4 h-4" /> :
                         cat.name.includes('Pneumatique') || cat.name.includes('نيوماتيك') ? <Wind className="w-4 h-4" /> :
                         cat.name.includes('Électronique') || cat.name.includes('إلكترونيك') ? <Cpu className="w-4 h-4" /> :
                         <Settings2 className="w-4 h-4" />}
                      </div>
                      <span>{cat.name}</span>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform rtl:rotate-180",
                      isSelected ? "opacity-100 text-white" : "opacity-40 text-slate-500"
                    )} />
                  </button>
                );
              })}
            </div>

            {/* Sub-Selector for Failure Templates */}
            {selectedCategory && (
              <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider text-start">العطل المستهدف للدراسة</h3>
                  <span className="text-[10px] font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15">
                    {filteredTemplates.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {filteredTemplates.map(tmpl => {
                    const isSelected = selectedTemplateId === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplateId(tmpl.id);
                          resetDiagnosticSimulator();
                        }}
                        className={cn(
                          "w-full text-start p-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer",
                          isSelected
                            ? "bg-white text-slate-950 border-white shadow-md font-extrabold"
                            : "bg-white/[0.03] text-slate-300 border-white/10 hover:text-white hover:bg-white/[0.06]"
                        )}
                      >
                        <span className="truncate">{tmpl.name}</span>
                        <span className={cn(
                          "w-2.5 h-2.5 rounded-full shrink-0 mr-2 border border-black/20",
                          tmpl.severity === 'critical' ? 'bg-rose-500' :
                          tmpl.severity === 'high' ? 'bg-orange-500' :
                          tmpl.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        )} />
                      </button>
                    );
                  })}
                  {filteredTemplates.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4 font-medium">يرجى تسجيل عطل أولاً</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Workspace Pane (RTL): Black Crystal Glass Shell Container */}
        <div className="flex-1 bg-[#0a0b10]/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden relative z-10 flex flex-col min-h-0">
          
          {/* Ambient Engine Accent Rays & Glows */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Fixed Glass Workspace Header */}
          {selectedCategory ? (
            <div className="p-6 border-b border-white/10 bg-white/[0.02] space-y-4 shrink-0 relative z-10">
              {/* Category Info Header Banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-white/10 pb-5 gap-4 text-start">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center shrink-0 text-orange-400 shadow-inner">
                    {selectedCategory.name.includes('Mécanique') || selectedCategory.name.includes('ميكانيك') ? <Wrench className="w-6 h-6" /> :
                     selectedCategory.name.includes('Électrique') || selectedCategory.name.includes('كهرباء') ? <Zap className="w-6 h-6" /> :
                     selectedCategory.name.includes('Hydraulique') || selectedCategory.name.includes('هيدروليك') ? <Droplets className="w-6 h-6" /> :
                     selectedCategory.name.includes('Pneumatique') || selectedCategory.name.includes('نيوماتيك') ? <Wind className="w-6 h-6" /> :
                     selectedCategory.name.includes('Électronique') || selectedCategory.name.includes('إلكترونيك') ? <Cpu className="w-6 h-6" /> :
                     <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <div className="text-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-white/10 text-white px-2 py-0.5 rounded border border-white/15">
                        {selectedCategory.id.substring(0, 4).toUpperCase()}
                      </span>
                      <h3 className="text-lg font-extrabold text-white tracking-tight">
                        {selectedCategory.name}
                      </h3>
                      <span className="text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">
                        {filteredTemplates.length} عطل مسجل
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                      {selectedTemplate 
                        ? `العطل النشط: ${selectedTemplate.name} (TR-${(selectedTemplate.id.substring(0,4)).toUpperCase()})` 
                        : 'كتالوج الأعطال ومصفوفات التشخيص الحركي الميداني'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
                  {/* Primary Add Fault Action */}
                  <button 
                    type="button"
                    onClick={() => setIsAddingTemplate(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-200 text-slate-950 font-extrabold rounded-xl transition-all shadow-lg text-xs cursor-pointer active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>تسجيل عطل جديد</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs Bar */}
              <div className="flex items-center gap-6 mt-6 border-b border-white/10 w-full overflow-x-auto custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className={cn(
                    "pb-3 text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer border-b-2 relative",
                    activeTab === 'catalog' 
                      ? "text-white border-orange-500" 
                      : "text-slate-500 border-transparent hover:text-slate-300 hover:border-white/20"
                  )}
                >
                  <FolderTree className={cn("w-4 h-4", activeTab === 'catalog' ? "text-orange-400" : "text-slate-500")} />
                  <span>كتالوج الأعطال</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-mono border",
                    activeTab === 'catalog' ? "bg-orange-500/20 border-orange-500/30 text-orange-300" : "bg-white/5 border-white/10 text-slate-500"
                  )}>
                    {filteredTemplates.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('diagnostic')}
                  className={cn(
                    "pb-3 text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer border-b-2 relative",
                    activeTab === 'diagnostic' 
                      ? "text-white border-orange-500" 
                      : "text-slate-500 border-transparent hover:text-slate-300 hover:border-white/20"
                  )}
                >
                  <Activity className={cn("w-4 h-4", activeTab === 'diagnostic' ? "text-orange-400" : "text-slate-500")} />
                  <span>شجرة التشخيص الميداني</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Workspace Body Content (Scrollable) */}
          <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar relative z-10 flex flex-col min-h-0">
            <AnimatePresence mode="wait">

            {/* WELCOME / EMPTY SELECTION EXPLORER STATE */}
            {!selectedCategory ? (
              <motion.div
                key="welcome-explorer"
                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-10 md:py-16 text-center max-w-4xl mx-auto space-y-8"
              >
                {/* Glowing Engine Icon Container */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-orange-400 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
                    <ShieldAlert className="w-10 h-10" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-slate-900 border border-orange-500/40 flex items-center justify-center text-orange-300 shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-3 max-w-2xl">
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    مستكشف الأعطال والشجرة التشخيصية
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    المركز الهندسي الذكي لكتالوج الأعطال، ومصفوفات التشخيص الحركي الميداني.
                  </p>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="px-6 py-3 bg-white text-slate-950 font-extrabold rounded-2xl shadow-xl hover:bg-slate-200 transition-all flex items-center gap-2 text-xs cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة عائلة أعطال جديدة</span>
                  </button>

                  <button
                    type="button"
                    onClick={seedDefaultCategories}
                    className="px-6 py-3 bg-white/[0.05] hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-orange-400" />
                    <span>تحديث واستعادة الكتالوج القياسي</span>
                  </button>
                </div>

                {/* Bento Grid Feature Highlight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-start pt-6">
                  
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-orange-500/30 transition-all duration-300 space-y-2 group">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                      <FolderTree className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors">1. الكتالوج والتصنيف الصناعي</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      تصنيف الأعطال حسب القطاعات الهندسية (ميكانيك، كهرباء، هيدروليك، نيوماتيك) مع كود معايرة معتمد ومستوى خطورة لكل عَرَض.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-orange-500/30 transition-all duration-300 space-y-2 group">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors">2. الشجرة التشخيصية التفاعلية</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      محاكاة خطوة بخطوة للفحص الميداني واختبارات القياس، لتحديد السبب الحركي المادي والقطع الواجب سحبها من المخزن.
                    </p>
                  </div>

                </div>
              </motion.div>
            ) : null}
            
            {/* VIEWMODE 1: CLASSIC FAILURE CATALOG (Table or Cards View) */}
            {selectedCategory && activeTab === 'catalog' && (
              <motion.div
                key="catalog"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col min-h-0 space-y-4 text-start"
              >
                {/* Crystal Container Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0a0a0f]/90 p-3 rounded-2xl border border-white/10 shadow-xl">
                  
                  {/* Right Side (RTL): Count Text */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-slate-200 bg-white/[0.04] px-4 py-2 rounded-xl border border-white/10">
                      {filteredTemplates.length} أعطال ضمن <strong className="text-white font-black">{selectedCategory.name}</strong>
                    </span>
                  </div>

                  {/* Center: Search filter for failures */}
                  <div className="flex-1 max-w-md w-full">
                    <div className="relative w-full">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="البحث في الأعطال..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#161821] hover:bg-[#1a1c26] border border-white/10 hover:border-white/20 rounded-xl py-2 pr-10 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:bg-slate-900 transition-colors shadow-inner text-start"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  {/* Left Side (RTL): View Switcher */}
                  <div className="flex items-center gap-1 p-1 bg-[#161821] rounded-xl border border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDisplayMode('table')}
                      className={cn(
                        "p-1.5 rounded-lg transition-all cursor-pointer",
                        displayMode === 'table' ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-white"
                      )}
                      title="عرض الجدول"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisplayMode('cards')}
                      className={cn(
                        "p-1.5 rounded-lg transition-all cursor-pointer",
                        displayMode === 'cards' ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-white"
                      )}
                      title="عرض البطاقات"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4 border border-orange-500/20 text-orange-400">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">لا توجد أعطال مسجلة</h3>
                    <p className="text-xs text-slate-400 max-w-sm mb-6">لم يتم تسجيل أي أعطال في هذه العائلة بعد، أو لم يتم العثور على نتائج للبحث.</p>
                    <button 
                      type="button"
                      onClick={() => setIsAddingTemplate(true)}
                      className="px-5 py-2.5 bg-white text-slate-950 font-extrabold rounded-xl shadow-md transition-all text-xs cursor-pointer"
                    >
                      إضافة العطل الأول
                    </button>
                  </div>
                ) : displayMode === 'table' ? (
                  /* Crystal High-Contrast Table View */
                  <div className="rounded-2xl border border-white/10 bg-[#0a0b10]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <table className="w-full text-start border-collapse">
                      <thead className="bg-white/[0.04] border-b border-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider text-start">
                        <tr>
                          <th className="p-4 text-start">اسم العطل والأعراض الملاحظة</th>
                          <th className="p-4 text-start">رمز المعايرة</th>
                          <th className="p-4 text-start">مستوى الخطورة</th>
                          <th className="p-4 text-start">شجرة التشخيص</th>
                          <th className="p-4 text-end">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs">
                        {filteredTemplates.map(template => {
                          const isSelected = selectedTemplateId === template.id;
                          return (
                            <tr 
                              key={template.id} 
                              onClick={() => setSelectedTemplateId(template.id)}
                              className={cn(
                                "hover:bg-white/[0.04] transition-colors cursor-pointer text-start",
                                isSelected ? "bg-orange-500/10" : ""
                              )}
                            >
                              <td className="p-4 font-bold text-white">
                                <div className="flex flex-col">
                                  <span className="text-sm font-extrabold text-white">{template.name}</span>
                                  {template.description && (
                                    <span className="text-slate-400 font-normal text-xs line-clamp-1 mt-0.5">{template.description}</span>
                                  )}
                                </div>
                              </td>

                              <td className="p-4">
                                <span className="font-mono text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/15">
                                  TR-{(template.id.substring(0,4)).toUpperCase()}
                                </span>
                              </td>

                              <td className="p-4">
                                <span className={cn(
                                  "px-2.5 py-1 rounded text-[10px] font-bold border font-mono tracking-wider",
                                  template.severity === 'critical' ? "bg-rose-500/20 text-rose-300 border-rose-500/30" :
                                  template.severity === 'high' ? "bg-orange-500/20 text-orange-300 border-orange-500/30" :
                                  template.severity === 'medium' ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                                  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                )}>
                                  {template.severity === 'critical' ? 'CRITICAL / حرج' :
                                   template.severity === 'high' ? 'HIGH / عالي' :
                                   template.severity === 'medium' ? 'MEDIUM / متوسط' : 'LOW / منخفض'}
                                </span>
                              </td>

                              <td className="p-4">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTemplateId(template.id);
                                    resetDiagnosticSimulator();
                                    setActiveTab('diagnostic');
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Activity className="w-3.5 h-3.5" />
                                  <span>تشخيص العطل ⚡</span>
                                </button>
                              </td>

                              <td className="p-4 text-end">
                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (window.confirm('هل أنت متأكد من حذف هذا العطل من كشوفات المصنع نهائياً؟')) {
                                        await deleteTemplate(template.id);
                                        showSuccess('تم حذف العطل من كتالوج النظام');
                                      }
                                    }}
                                    className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                                    title="حذف العطل"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Cards Grid View */
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredTemplates.map(template => {
                      const isSelected = selectedTemplateId === template.id;
                      return (
                        <div
                          key={template.id}
                          onClick={() => setSelectedTemplateId(template.id)}
                          className={cn(
                            "p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden cursor-pointer group text-start flex flex-col justify-between shadow-lg",
                            isSelected 
                              ? "bg-white/[0.06] border-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.2)] scale-[1.01]" 
                              : "bg-[#08080c]/80 border-white/10 text-slate-300 hover:border-orange-500/30 hover:bg-white/[0.03]"
                          )}
                        >
                          {/* Selected Glow ray */}
                          {isSelected && (
                            <div className="bg-orange-500/20 rounded-full blur-xl absolute -bottom-10 left-1/2 -translate-x-1/2 w-28 h-16 pointer-events-none z-0" />
                          )}

                          <div className="relative z-10 w-full h-full flex flex-col justify-between space-y-4">
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="text-base font-bold text-white group-hover:text-orange-300 transition-colors">
                                  {template.name}
                                </h4>
                                
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm('هل أنت متأكد من حذف هذا العطل من كشوفات المصنع نهائياً؟')) {
                                      await deleteTemplate(template.id);
                                      showSuccess('تم حذف العطل من كتالوج النظام');
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer"
                                  title="حذف العطل"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {template.description && (
                                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{template.description}</p>
                              )}
                            </div>

                            <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
                              <span className={cn(
                                "px-2.5 py-0.5 rounded text-[10px] font-bold border font-mono tracking-wider",
                                template.severity === 'critical' ? "bg-rose-500/20 text-rose-300 border-rose-500/30" :
                                template.severity === 'high' ? "bg-orange-500/20 text-orange-300 border-orange-500/30" :
                                template.severity === 'medium' ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                                "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              )}>
                                {template.severity === 'critical' ? 'CRITICAL / حرج' :
                                 template.severity === 'high' ? 'HIGH / عالي' :
                                 template.severity === 'medium' ? 'MEDIUM / متوسط' : 'LOW / منخفض'}
                              </span>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                                  TR-{(template.id.substring(0,4)).toUpperCase()}
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTemplateId(template.id);
                                    resetDiagnosticSimulator();
                                    setActiveTab('diagnostic');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Activity className="w-3 h-3" />
                                  <span>تشخيص العطل ⚡</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEWMODE 2: RICH & COMPLETE INTERACTIVE DIAGNOSTIC SIMULATOR LAB */}
            {selectedCategory && activeTab === 'diagnostic' && (
              <motion.div
                key="diagnostic"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 flex-1 flex flex-col min-h-0 text-start"
              >
                {/* Diagnostic Control Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0a0a0f]/90 p-3 rounded-2xl border border-white/10 shadow-xl">
                  
                  {/* Right Side (RTL): Title & Count */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] rounded-xl border border-white/10">
                      <Activity className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-black text-white uppercase tracking-wider">المحاكي الميداني ISO 14224</span>
                    </div>
                    <span className="hidden sm:block text-[10px] font-mono font-bold bg-white/10 text-slate-300 px-2.5 py-1 rounded-lg border border-white/10">
                      {filteredTemplates.length} أعطال
                    </span>
                  </div>

                  {/* Center: Search/Filter for Carousel */}
                  <div className="flex-1 max-w-md w-full">
                    <div className="relative w-full">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        placeholder="تصفية الأعطال في المحاكي..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#161821] border border-white/10 rounded-xl py-2 pr-10 pl-4 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition-colors shadow-inner text-start opacity-70 hover:opacity-100"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  {/* Left Side: Refresh Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={resetDiagnosticSimulator}
                      className="px-4 py-2 bg-[#161821] hover:bg-white/10 rounded-xl border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 cursor-pointer transition-all active:scale-95 hover:text-white"
                    >
                      <RefreshCw className="w-4 h-4 text-orange-400" />
                      <span>تهيئة المحاكي</span>
                    </button>
                  </div>
                </div>

                {/* Fault Quick Selection Carousel / Horizontal Matrix */}
                {filteredTemplates.length > 0 && (
                  <div className="space-y-3 bg-[#0a0b10]/60 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="font-bold text-slate-300 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        حدد العطل المستهدف لتشغيل شجرة القرار:
                      </span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 pt-1">
                      {filteredTemplates.map(tmpl => {
                        const isSelected = selectedTemplateId === tmpl.id;
                        return (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => {
                              setSelectedTemplateId(tmpl.id);
                              resetDiagnosticSimulator();
                            }}
                            className={cn(
                              "px-3.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer shrink-0",
                              isSelected
                                ? "bg-white text-slate-950 border-white shadow-lg font-black scale-105"
                                : "bg-[#08080c]/80 text-slate-300 border-white/10 hover:bg-white/[0.06] hover:text-white"
                            )}
                          >
                            <span className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              tmpl.severity === 'critical' ? 'bg-rose-500' :
                              tmpl.severity === 'high' ? 'bg-orange-500' :
                              tmpl.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                            )} />
                            <span>{tmpl.name}</span>
                            <span className={cn(
                              "text-[9px] font-mono px-1.5 py-0.5 rounded border",
                              isSelected ? "bg-slate-900 text-white border-slate-700" : "bg-white/10 text-slate-400 border-white/15"
                            )}>
                              TR-{(tmpl.id.substring(0,4)).toUpperCase()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedTemplate ? (
                  <div className="space-y-6 flex-1 flex flex-col min-h-0">
                    {/* Active Target Banner with Engineering Instrumentation Specs */}
                    <div className="bg-[#08080c]/90 rounded-2xl border border-white/10 p-5 space-y-4 shadow-xl">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold shrink-0">
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-extrabold text-white">{selectedTemplate.name}</h4>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-mono font-bold border",
                                selectedTemplate.severity === 'critical' ? "bg-rose-500/20 text-rose-300 border-rose-500/30" :
                                selectedTemplate.severity === 'high' ? "bg-orange-500/20 text-orange-300 border-orange-500/30" :
                                selectedTemplate.severity === 'medium' ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                                "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              )}>
                                {selectedTemplate.severity.toUpperCase()}
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-white/10 text-white px-2 py-0.5 rounded border border-white/15">
                                TR-{(selectedTemplate.id.substring(0,4)).toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              {selectedTemplate.description || 'فحص واختبار ميكانيكي / كهربائي تخصصي لتحديد السبب المادي الحركي والقطع الاستهلاكية'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                            STANDARD: ISO-14224-RCA
                          </span>
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg font-bold">
                            LOTO LOCKOUT REQUIRED
                          </span>
                        </div>
                      </div>

                      {/* Tooling & Measuring Instruments Badges */}
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                        <span className="text-[11px] font-bold text-slate-300">أجهزة القياس والفحص الموصى بها:</span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 text-[11px] flex items-center gap-1.5 font-mono">
                          <Zap className="w-3 h-3 text-amber-400" /> Multimeter / كاشف الجهد
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 text-[11px] flex items-center gap-1.5 font-mono">
                          <Droplets className="w-3 h-3 text-cyan-400" /> Manometer / مقياس الضغط
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 text-[11px] flex items-center gap-1.5 font-mono">
                          <Activity className="w-3 h-3 text-orange-400" /> Vibrometer / حساس الاهتزاز
                        </span>
                      </div>
                    </div>

                    {/* Step wizard container */}
                    <div className="bg-[#08080c]/90 rounded-3xl border border-white/10 p-6 md:p-8 min-h-[360px] flex flex-col justify-between relative overflow-hidden flex-1 shadow-2xl">
                      
                      {/* Symptom Panel */}
                      {diagnosticStep === 1 && (
                        <div className="mb-6 bg-white/[0.03] border border-white/10 p-4 rounded-2xl flex items-start gap-3 text-start">
                          <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">العَرَض الملاحظ في ساحة العمل:</span>
                            <p className="text-sm text-slate-200 font-bold leading-relaxed mt-1">{activeDiagnosticConfig?.symptom}</p>
                          </div>
                        </div>
                      )}

                      {/* Diagnostic Active Question */}
                      {diagnosticStep !== 4 && currentStepData ? (
                        <div className="flex-1 flex flex-col justify-center py-6 text-center">
                          <span className="text-[10px] font-mono text-white bg-white/10 px-3 py-1 rounded-full border border-white/15 uppercase tracking-widest mb-4 inline-block mx-auto font-black">
                            مرحلة البحث والقياس الميداني - الخطوة {diagnosticStep === 1 ? 'الأولى' : 'الثانية'}
                          </span>
                          <h3 className="text-xl font-extrabold text-white max-w-2xl mx-auto leading-relaxed mb-8">
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

                      {/* Final Diagnostic Resolution Output */}
                      {diagnosticStep === 4 && diagnosticOutput && (
                        <div className="flex-1 space-y-6 py-4">
                          <div className="text-center mb-6">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider mb-2">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              اكتمل التشخيص الهندسي بنجاح (Diagnostic Completed)
                            </span>
                            <h3 className="text-2xl font-black text-white">{diagnosticOutput.title}</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-rose-500/10 p-5 rounded-2xl border border-rose-500/20 space-y-2 text-start">
                              <span className="text-xs text-rose-300 font-bold block">السبب المادي الحركي (Root Cause):</span>
                              <p className="text-xs text-slate-200 leading-relaxed font-semibold">{diagnosticOutput.cause}</p>
                            </div>

                            <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 space-y-2 text-start">
                              <span className="text-xs text-emerald-300 font-bold block">الإجراء العلاجي المقترح (Corrective Action):</span>
                              <p className="text-xs text-slate-200 leading-relaxed font-semibold">{diagnosticOutput.action}</p>
                            </div>
                          </div>

                          {/* Parts Required */}
                          {diagnosticOutput.parts && diagnosticOutput.parts.length > 0 && (
                            <div className="bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-start">
                              <span className="text-xs text-white font-bold block mb-3">قطع الغيار المطلوب سحبها من المخزن فوراً (PDR):</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {diagnosticOutput.parts.map((p: string, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-white/10 font-sans">
                                    <span className="text-xs text-slate-200 font-bold">{p}</span>
                                    <span className="text-[10px] font-mono bg-white/10 text-white border border-white/15 px-2 py-0.5 rounded">
                                      {p.match(/\(([^)]+)\)/)?.[1] || 'ROB-001'}
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
                              <span>فحص عَرَض آخر للآلة</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => showSuccess('تم توثيق بروتوكول التشخيص وربطه بأمر الصيانة')}
                              className="px-5 py-2.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-500/40 font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4 text-orange-400" />
                              <span>اعتماد التقرير الميداني</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Footer Progress Tracker */}
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
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center border border-white/10 rounded-2xl bg-white/[0.01]">
                    <Activity className="w-12 h-12 text-slate-500 mb-3" />
                    <p className="text-slate-400 text-sm font-bold">يرجى تسجيل وتحديد عطل من القائمة لبدء تشغيل محاكي شجرة التشخيص الميداني.</p>
                  </div>
                )}
              </motion.div>
            )}

            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Add Category Modal */}
      <AnimatePresence>
        {isAddingCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0f]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0f111a] border border-white/10 rounded-2xl shadow-2xl p-6 text-start"
            >
              <h3 className="text-xl font-bold text-white mb-6">إضافة عائلة أعطال جديدة</h3>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">اسم العائلة</label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 text-start"
                    placeholder="مثال: ميكانيك، هيدروليك..."
                  />
                </div>
                <div className="flex gap-3 mt-8">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-white hover:bg-slate-200 text-slate-950 rounded-xl font-extrabold transition-all shadow-md text-xs cursor-pointer"
                  >
                    إضافة العائلة
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Template Modal */}
      <AnimatePresence>
        {isAddingTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0f]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0f111a] border border-orange-500/30 rounded-2xl shadow-2xl p-6 relative overflow-hidden text-start"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500/0 via-orange-500 to-orange-500/0" />
              
              <h3 className="text-xl font-bold text-white mb-2">تسجيل عطل جديد</h3>
              <p className="text-sm text-slate-400 mb-6">
                ضمن عائلة: <strong className="text-orange-400">{selectedCategory?.name}</strong>
              </p>

              <form onSubmit={handleAddTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">اسم العطّل (Symptom / Problem)</label>
                  <input
                    type="text"
                    required
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 text-start"
                    placeholder="مثال: تسرب هيدروليكي، ارتفاع الحرارة..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">وصف العطل وسياق الفحص (اختياري)</label>
                  <textarea
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 h-24 resize-none text-start"
                    placeholder="تفاصيل إضافية حول هذا العطل لتوجيه الفني..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">مستوى الخطورة الافتراضي</label>
                  <select
                    value={newTemplateSeverity}
                    onChange={(e) => setNewTemplateSeverity(e.target.value as any)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 text-start appearance-none"
                  >
                    <option value="low">منخفض (Low)</option>
                    <option value="medium">متوسط (Medium)</option>
                    <option value="high">عالي (High)</option>
                    <option value="critical">حرج (Critical)</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-8 pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-white hover:bg-slate-200 text-slate-950 rounded-xl font-extrabold transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                    <span>حفظ في الكتالوج</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingTemplate(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
