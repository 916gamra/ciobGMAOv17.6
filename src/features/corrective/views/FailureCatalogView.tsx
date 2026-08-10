import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, Settings2, Plus, Search,
  Wrench, Zap, Droplets, Wind, Cpu, ShieldAlert,
  ChevronRight, Activity, Filter, CheckCircle2, Layers, FolderTree,
  Trash2, Sliders, HelpCircle, Sparkles, RefreshCw, BarChart2, Info
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

  // New Lab View States
  const [viewMode, setViewMode] = useState<'catalog' | 'diagnostic' | 'ishikawa' | 'fmea'>('catalog');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Diagnostic simulator states
  const [diagnosticStep, setDiagnosticStep] = useState<number | string>(1);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, string>>({});
  const [diagnosticOutput, setDiagnosticOutput] = useState<any | null>(null);

  // FMEA simulator states
  const [fmeaSeverity, setFmeaSeverity] = useState<number>(7);
  const [fmeaOccurrence, setFmeaOccurrence] = useState<number>(5);
  const [fmeaDetection, setFmeaDetection] = useState<number>(4);

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

  // RPN Calculation and Color Code
  const rpnScore = useMemo(() => {
    return fmeaSeverity * fmeaOccurrence * fmeaDetection;
  }, [fmeaSeverity, fmeaOccurrence, fmeaDetection]);

  const rpnRating = useMemo(() => {
    if (rpnScore >= 300) return { label: 'مستوى حرج جداً (خطر داهم)', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]', level: 'critical' };
    if (rpnScore >= 125) return { label: 'خطورة متوسطة إلى عالية', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', level: 'high' };
    return { label: 'مقبول وضمن الحدود الآمنة', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', level: 'low' };
  }, [rpnScore]);

  // Ishikawa Fishbone Categories based on Selected Failure
  const ishikawaCauses = useMemo(() => {
    if (!selectedTemplate) return null;
    const name = selectedTemplate.name;
    return {
      problem: name,
      machine: ['تعب ميكانيكي واهتزاز هيكلي', 'قدم عمر المعدة وتآكل نقاط الاحتكاك', 'ضعف التثبيت على القاعدة الأسمنتية'],
      method: ['عدم توفر معايير ضبط الدقة والمسافة', 'غياب كروت وجداول الصيانة الوقائية الشهرية', 'التشغيل فوق القدرة المسموحة للآلة'],
      material: ['جودة قطع غيار مقلدة وغير معتمدة', 'خصائص زيت التزييت غير مطابقة للمواصفات', 'تلف موانع التسرب قبل تركيبها بسبب التخزين خاطئ'],
      manpower: ['تأهيل الكادر الفني غير متناسب مع تقنية الآلة', 'إهمال تزييت المكونات وفحص الفلاتر اليومية', 'السرعة الزائدة في تنفيذ الصيانة دون اتباع الدليل'],
      measurement: ['حساسات الحرارة تعطي قراءات خاطئة', 'غياب أجهزة التحليل بالاهتزاز (Vibration Pen)', 'عدم معايرة مفاتيح عزم الدوران'],
      environment: ['ارتفاع الرطوبة المحيطة وتراكم الغبار الكثيف', 'درجة حرارة المصنع مرتفعة جداً وغياب التهوية', 'تذبذب مستمر في خطوط الطاقة الكهربائية']
    };
  }, [selectedTemplate]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-slate-200 dir-rtl" dir="rtl">
      {/* Header Cockpit */}
      <div className="p-6 md:p-8 pb-0">
        <PageHeader
          title={t('corrective.failureCatalog.title', 'مختبر الأعطال والشجرة التشخيصية')}
          subtitle={t('corrective.failureCatalog.subtitle', 'الانتقال من التوثيق الجاف إلى التحليل المتقدم وهندسة الموثوقية الصناعية (RAMS & FMEA) لأصول المصنع.')}
          icon={<AlertTriangle className="w-7 h-7 text-orange-400 animate-pulse" />}
          badgeText="مختبر الأعطال والتشخيص v17.1"
          badgeColor="orange"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeaderBentoCard
              title="العائلات الصناعية"
              subtitle="CATEGORIES"
              value={categories.length}
              valueUnit="عائلة"
              icon={<FolderTree className="w-3.5 h-3.5" />}
              color="orange"
            />
            <HeaderBentoCard
              title="أنواع الأعطال"
              subtitle="FAILURES"
              value={templates.length}
              valueUnit="نوع"
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              color="amber"
            />
            <HeaderBentoCard
              title="مستوى الموثوقية"
              subtitle="RELIABILITY"
              value="94.2%"
              valueUnit="ممتاز"
              icon={<Activity className="w-3.5 h-3.5" />}
              color="emerald"
            />
            <HeaderBentoCard
              title="حالة شجرة التشخيص"
              subtitle="DIAGNOSTIC STATUS"
              value="100%"
              valueUnit="جاهزة"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              color="blue"
            />
          </div>
        </PageHeader>
      </div>

      {/* LAB NAVIGATION SWITCHER (Chapter 8: No glowing wild animations, clean high-contrast tabs) */}
      <div className="px-6 md:px-8 mt-6">
        <div className="flex items-center gap-2 bg-[#0a0a0f]/60 p-1.5 rounded-2xl border border-white/10 overflow-x-auto self-start max-w-2xl">
          <button
            onClick={() => setViewMode('catalog')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer",
              viewMode === 'catalog' 
                ? "bg-white text-slate-950 shadow-md font-black" 
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            )}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>كتالوج وإدارة الأعطال</span>
          </button>

          <button
            onClick={() => setViewMode('diagnostic')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer",
              viewMode === 'diagnostic' 
                ? "bg-white text-slate-950 shadow-md font-black" 
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            )}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>محاكي شجرة التشخيص تفاعلي</span>
          </button>

          <button
            onClick={() => setViewMode('ishikawa')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer",
              viewMode === 'ishikawa' 
                ? "bg-white text-slate-950 shadow-md font-black" 
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>مخطط عظمة السمكة (Ishikawa)</span>
          </button>

          <button
            onClick={() => setViewMode('fmea')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer",
              viewMode === 'fmea' 
                ? "bg-white text-slate-950 shadow-md font-black" 
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>مختبر تحليل مخاطر الفشل (FMEA)</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 flex-row-reverse mt-4">
        
        {/* Right Sidebar - Categories & Selection (Common context for all viewModes) */}
        <div className="w-80 border-l border-white/5 bg-white/[0.01] flex flex-col overflow-y-auto custom-scrollbar shrink-0">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4 flex-row-reverse">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-right">العائلات والقطاعات</h3>
              <button 
                onClick={() => setIsAddingCategory(true)}
                className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-lg px-2.5 py-1.5 text-[11px] shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 flex-row-reverse"
              >
                <Plus className="w-3.5 h-3.5 text-slate-950" />
                <span>عائلة جديدة</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    // reset sub-selections
                    resetDiagnosticSimulator();
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-sm font-semibold flex-row-reverse",
                    selectedCategoryId === cat.id 
                      ? "bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                      : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <div className={cn(
                      "p-2 rounded-lg",
                      selectedCategoryId === cat.id ? "bg-orange-500/20" : "bg-white/5"
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
                    "w-4 h-4 transition-transform rotate-180",
                    selectedCategoryId === cat.id ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
                  )} />
                </button>
              ))}
            </div>

            {/* Sub-Selector for Failure Templates (Highly relevant for Diagnostic Labs) */}
            {selectedCategory && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-right mb-4">العطل المستهدف للدراسة</h3>
                <div className="space-y-1.5">
                  {filteredTemplates.map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        setSelectedTemplateId(tmpl.id);
                        resetDiagnosticSimulator();
                      }}
                      className={cn(
                        "w-full text-right p-2.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-between flex-row-reverse",
                        selectedTemplateId === tmpl.id
                          ? "bg-white text-slate-950 border-white"
                          : "bg-[#0a0a0f]/40 text-slate-400 hover:text-slate-200 border-white/5 hover:bg-white/[0.02]"
                      )}
                    >
                      <span className="truncate">{tmpl.name}</span>
                      <span className={cn(
                        "w-2 h-2 rounded-full shrink-0 ml-2",
                        tmpl.severity === 'critical' ? 'bg-rose-500' :
                        tmpl.severity === 'high' ? 'bg-orange-500' :
                        tmpl.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                      )} />
                    </button>
                  ))}
                  {filteredTemplates.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">يرجى تسجيل عطل أولاً</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Left Content Area - Dynamic rendering depending on viewMode */}
        <div className="flex-1 bg-[#0a0a0f]/20 overflow-y-auto custom-scrollbar p-6 md:p-8 text-right">
          <AnimatePresence mode="wait">
            
            {/* VIEWMODE 1: CLASSIC FAILURE CATALOG & REGISTRATION */}
            {viewMode === 'catalog' && (
              <motion.div
                key="catalog"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto"
              >
                {selectedCategory ? (
                  <div>
                    <div className="flex items-center justify-between mb-8 flex-row-reverse">
                      <div className="text-right">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-end gap-3 flex-row-reverse">
                          <span className="text-orange-400">{selectedCategory.name}</span>
                          <span className="text-slate-500 text-base font-normal">- كشوفات وتسجيل المشاكل</span>
                        </h2>
                        <p className="text-sm text-slate-400">عدد الأعطال المسجلة: {templates.filter(t => t.categoryId === selectedCategory.id).length}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 flex-row-reverse">
                        <div className="relative w-64">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input 
                            type="text"
                            placeholder="بحث في الأعطال..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-right"
                          />
                        </div>
                        <button 
                          onClick={() => setIsAddingTemplate(true)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-200 text-slate-950 font-extrabold rounded-xl transition-all shadow-md flex-row-reverse text-xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>تسجيل عطل جديد</span>
                        </button>
                      </div>
                    </div>

                    {filteredTemplates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                          <AlertTriangle className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-300 mb-2">لا توجد أعطال مسجلة</h3>
                        <p className="text-slate-500 max-w-sm mb-6">لم يتم تسجيل أي أعطال في هذه العائلة بعد، أو لم يتم العثور على نتائج للبحث.</p>
                        <button 
                          onClick={() => setIsAddingTemplate(true)}
                          className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all text-xs font-bold"
                        >
                          إضافة العطل الأول
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredTemplates.map(template => (
                          <div
                            key={template.id}
                            onClick={() => setSelectedTemplateId(template.id)}
                            className={cn(
                              "p-5 rounded-2xl bg-white/[0.02] border transition-all group relative overflow-hidden cursor-pointer",
                              selectedTemplateId === template.id 
                                ? "border-orange-500/40 bg-orange-500/[0.02]" 
                                : "border-white/10 hover:border-white/20"
                            )}
                          >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 pointer-events-none transition-all" />
                            
                            <div className="flex items-start justify-between relative z-10 flex-row-reverse">
                              <div className="text-right flex-1 pr-2">
                                <div className="flex items-center gap-2 justify-end flex-row-reverse mb-1">
                                  <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                                    {template.name}
                                  </h3>
                                  {selectedTemplateId === template.id && (
                                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                                  )}
                                </div>
                                {template.description && (
                                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mt-1">{template.description}</p>
                                )}
                                
                                <div className="mt-4 flex items-center justify-end gap-3 flex-row-reverse">
                                  <span className={cn(
                                    "px-2.5 py-1 rounded-md text-[10px] font-bold border font-mono tracking-wider",
                                    template.severity === 'critical' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                    template.severity === 'high' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                    template.severity === 'medium' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  )}>
                                    {template.severity === 'critical' ? 'CRITICAL / حرج' :
                                     template.severity === 'high' ? 'HIGH / عالي' :
                                     template.severity === 'medium' ? 'MEDIUM / متوسط' : 'LOW / منخفض'}
                                  </span>
                                  <span className="text-xs text-slate-500">رمز المعايرة: TR-{(template.id.substring(0,4)).toUpperCase()}</span>
                                </div>
                              </div>
                              
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (window.confirm('هل أنت متأكد من حذف هذا العطل من كشوفات المصنع نهائياً؟')) {
                                    await deleteTemplate(template.id);
                                    showSuccess('تم حذف العطل من كتالوج النظام');
                                  }
                                }}
                                className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0 self-start"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <FolderTree className="w-16 h-16 text-slate-600 mb-4 animate-bounce" />
                    <p className="text-slate-500 font-bold">يرجى تحديد عائلة صناعية من القائمة الجانبية لبدء استكشاف الأعطال وتصنيفها.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEWMODE 2: INTERACTIVE DIAGNOSTIC SIMULATOR LAB */}
            {viewMode === 'diagnostic' && (
              <motion.div
                key="diagnostic"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto"
              >
                {selectedTemplate ? (
                  <div className="space-y-6">
                    {/* Simulator Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-row-reverse">
                      <div>
                        <h2 className="text-xl font-bold text-white flex items-center justify-end gap-2 flex-row-reverse">
                          <Activity className="w-5 h-5 text-orange-400" />
                          <span>المحاكي الذكي لتشخيص الأعطال</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                          تحليل ديناميكي وحركي للعطل المختار: <strong className="text-orange-400">{selectedTemplate.name}</strong>
                        </p>
                      </div>
                      <button
                        onClick={resetDiagnosticSimulator}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 flex-row-reverse"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>إعادة بدء التشخيص</span>
                      </button>
                    </div>

                    {/* Step wizard container */}
                    <div className="bg-slate-900/40 rounded-3xl border border-white/10 p-8 min-h-[300px] flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/[0.02] rounded-full blur-[100px] pointer-events-none" />
                      
                      {/* Symptom Panel */}
                      {diagnosticStep === 1 && (
                        <div className="mb-6 bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-start gap-3 flex-row-reverse text-right">
                          <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">العَرَض الملاحظ في ساحة العمل:</span>
                            <p className="text-sm text-slate-300 font-bold leading-relaxed mt-1">{activeDiagnosticConfig?.symptom}</p>
                          </div>
                        </div>
                      )}

                      {/* Diagnostic Active Question */}
                      {diagnosticStep !== 4 && currentStepData ? (
                        <div className="flex-1 flex flex-col justify-center py-6 text-center">
                          <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 block">
                            مرحلة البحث الميداني - خطوة {diagnosticStep === 1 ? '1' : '2'}
                          </span>
                          <h3 className="text-xl font-black text-white max-w-2xl mx-auto leading-relaxed mb-8">
                            {currentStepData.question}
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
                            {currentStepData.options.map((opt, i) => (
                              <button
                                key={i}
                                onClick={() => handleDiagnosticOption(opt.next, opt.value)}
                                className="p-4 rounded-xl border border-white/10 hover:border-orange-500/50 bg-[#0a0a0f]/60 hover:bg-orange-500/5 text-slate-300 hover:text-white text-xs font-extrabold leading-relaxed transition-all duration-200 cursor-pointer active:scale-95 text-center"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Final Diagnostic Resolution Output */}
                      {diagnosticStep === 4 && diagnosticOutput && (
                        <div className="flex-1 space-y-6 py-4">
                          <div className="text-center mb-6">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider mb-2">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              اكتمل التشخيص الميكانيكي بنجاح
                            </span>
                            <h3 className="text-2xl font-black text-white">{diagnosticOutput.title}</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[#0a0a0f]/40 p-5 rounded-2xl border border-white/5 space-y-2 text-right">
                              <span className="text-xs text-rose-400 font-bold block">السبب المادي الحركي (Root Cause):</span>
                              <p className="text-sm text-slate-300 leading-relaxed font-semibold">{diagnosticOutput.cause}</p>
                            </div>

                            <div className="bg-[#0a0a0f]/40 p-5 rounded-2xl border border-white/5 space-y-2 text-right">
                              <span className="text-xs text-emerald-400 font-bold block">الإجراء العلاجي المقترح (Corrective Action):</span>
                              <p className="text-sm text-slate-300 leading-relaxed font-semibold">{diagnosticOutput.action}</p>
                            </div>
                          </div>

                          {/* Parts Required - strictly following nomenclature rules */}
                          {diagnosticOutput.parts && diagnosticOutput.parts.length > 0 && (
                            <div className="bg-white/[0.01] border border-white/10 p-5 rounded-2xl text-right">
                              <span className="text-xs text-blue-400 font-bold block mb-3">قطع الغيار (PDR) المطلوب سحبها من المخزن فوراً:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {diagnosticOutput.parts.map((p: string, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-white/5 flex-row-reverse font-sans">
                                    <span className="text-xs text-slate-200 font-bold">{p}</span>
                                    <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-md">
                                      {p.match(/\(([^)]+)\)/)?.[1] || 'ROB-001'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-center pt-4 border-t border-white/5">
                            <button
                              onClick={resetDiagnosticSimulator}
                              className="px-6 py-3 bg-white text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 flex-row-reverse cursor-pointer"
                            >
                              <RefreshCw className="w-4 h-4" />
                              <span>فحص عَرَض آخر للآلة</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Footer Progress Tracker */}
                      {diagnosticStep !== 4 && (
                        <div className="mt-8 border-t border-white/5 pt-4 flex items-center justify-between text-xs text-slate-500 flex-row-reverse">
                          <span>التحليل مستند إلى معايير ISO 14224</span>
                          <div className="flex gap-1">
                            <div className={cn("w-6 h-1.5 rounded-full", diagnosticStep === 1 || typeof diagnosticStep === 'string' ? "bg-orange-500" : "bg-white/10")} />
                            <div className={cn("w-6 h-1.5 rounded-full", diagnosticStep === 'motor_coil' || diagnosticStep === 'gearbox_bearing' || diagnosticStep === 'leak_active' || diagnosticStep === 'leak_static' ? "bg-orange-500" : "bg-white/10")} />
                            <div className={cn("w-6 h-1.5 rounded-full animate-pulse", diagnosticStep === 4 ? "bg-orange-500" : "bg-white/10")} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Activity className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
                    <p className="text-slate-500 font-bold">يرجى تسجيل وتحديد عطل من القائمة الجانبية لبدء تشغيل محاكي شجرة التشخيص الميداني.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEWMODE 3: ISHIKAWA FISHBONE DIAGRAM (M6 ARCHITECTURE) */}
            {viewMode === 'ishikawa' && (
              <motion.div
                key="ishikawa"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto"
              >
                {selectedTemplate && ishikawaCauses ? (
                  <div className="space-y-6">
                    <div className="border-b border-white/10 pb-4 text-right">
                      <h2 className="text-xl font-bold text-white flex items-center justify-end gap-2 flex-row-reverse">
                        <Layers className="w-5 h-5 text-orange-400" />
                        <span>مخطط عظمة السمكة لربط وتحليل الأسباب الكبرى (Ishikawa / 6M)</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        توزيع احتمالي للمسببات المساهمة في المشكلة: <strong className="text-orange-400">{selectedTemplate.name}</strong>
                      </p>
                    </div>

                    {/* Ishikawa Skeleton (SVG style representation built natively with CSS grid) */}
                    <div className="bg-slate-900/50 rounded-3xl border border-white/10 p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/[0.02] rounded-full blur-[120px] pointer-events-none" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 text-right">
                        
                        {/* Upper Bones */}
                        <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl space-y-3">
                          <span className="text-xs text-orange-400 font-extrabold tracking-widest border-b border-orange-500/20 pb-1.5 block">1. الآلة والمعدات (Machine)</span>
                          <ul className="space-y-2 text-xs text-slate-400 leading-relaxed font-semibold">
                            {ishikawaCauses.machine.map((c, idx) => <li key={idx} className="flex items-start gap-2 flex-row-reverse"><span className="text-orange-400 mt-1">✦</span><span>{c}</span></li>)}
                          </ul>
                        </div>

                        <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl space-y-3">
                          <span className="text-xs text-orange-400 font-extrabold tracking-widest border-b border-orange-500/20 pb-1.5 block">2. الطرق والأساليب (Method)</span>
                          <ul className="space-y-2 text-xs text-slate-400 leading-relaxed font-semibold">
                            {ishikawaCauses.method.map((c, idx) => <li key={idx} className="flex items-start gap-2 flex-row-reverse"><span className="text-orange-400 mt-1">✦</span><span>{c}</span></li>)}
                          </ul>
                        </div>

                        <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl space-y-3">
                          <span className="text-xs text-orange-400 font-extrabold tracking-widest border-b border-orange-500/20 pb-1.5 block">3. المواد الأولية وقطع الغيار (Material)</span>
                          <ul className="space-y-2 text-xs text-slate-400 leading-relaxed font-semibold">
                            {ishikawaCauses.material.map((c, idx) => <li key={idx} className="flex items-start gap-2 flex-row-reverse"><span className="text-orange-400 mt-1">✦</span><span>{c}</span></li>)}
                          </ul>
                        </div>

                        {/* Spine backbone divider line */}
                        <div className="col-span-full h-1 bg-gradient-to-r from-orange-500 to-white/10 rounded-full my-4 flex items-center justify-between px-6 flex-row-reverse relative">
                          <div className="absolute right-0 -mr-3 px-3 py-1 bg-orange-500 text-black font-extrabold text-[10px] rounded-lg shadow-lg">المشكلة التقنية الرئيسية</div>
                          <div className="text-white text-sm font-extrabold pl-4 truncate">{selectedTemplate.name}</div>
                        </div>

                        {/* Lower Bones */}
                        <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl space-y-3">
                          <span className="text-xs text-orange-400 font-extrabold tracking-widest border-b border-orange-500/20 pb-1.5 block">4. العنصر البشري والتدريب (Manpower)</span>
                          <ul className="space-y-2 text-xs text-slate-400 leading-relaxed font-semibold">
                            {ishikawaCauses.manpower.map((c, idx) => <li key={idx} className="flex items-start gap-2 flex-row-reverse"><span className="text-orange-400 mt-1">✦</span><span>{c}</span></li>)}
                          </ul>
                        </div>

                        <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl space-y-3">
                          <span className="text-xs text-orange-400 font-extrabold tracking-widest border-b border-orange-500/20 pb-1.5 block">5. أدوات القياس والمعايرة (Measurement)</span>
                          <ul className="space-y-2 text-xs text-slate-400 leading-relaxed font-semibold">
                            {ishikawaCauses.measurement.map((c, idx) => <li key={idx} className="flex items-start gap-2 flex-row-reverse"><span className="text-orange-400 mt-1">✦</span><span>{c}</span></li>)}
                          </ul>
                        </div>

                        <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl space-y-3">
                          <span className="text-xs text-orange-400 font-extrabold tracking-widest border-b border-orange-500/20 pb-1.5 block">6. بيئة العمل والمحيط (Milieu / Environment)</span>
                          <ul className="space-y-2 text-xs text-slate-400 leading-relaxed font-semibold">
                            {ishikawaCauses.environment.map((c, idx) => <li key={idx} className="flex items-start gap-2 flex-row-reverse"><span className="text-orange-400 mt-1">✦</span><span>{c}</span></li>)}
                          </ul>
                        </div>

                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Layers className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
                    <p className="text-slate-500 font-bold">يرجى تسجيل وتحديد عطل من القائمة الجانبية لبناء ورسم مخطط إيشيكاوا عظمة السمكة.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEWMODE 4: FMEA RISK PRIORITY CALCULATOR */}
            {viewMode === 'fmea' && (
              <motion.div
                key="fmea"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto"
              >
                {selectedTemplate ? (
                  <div className="space-y-6 text-right">
                    <div className="border-b border-white/10 pb-4">
                      <h2 className="text-xl font-bold text-white flex items-center justify-end gap-2 flex-row-reverse">
                        <Sliders className="w-5 h-5 text-orange-400" />
                        <span>مختبر تحليل مخاطر وتأثيرات الفشل (FMEA Stress-Test Lab)</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        تخمين رقم أولوية المخاطر (Risk Priority Number - RPN) للعطل: <strong className="text-orange-400">{selectedTemplate.name}</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                      
                      {/* Sliders Input Panel (7 Columns) */}
                      <div className="lg:col-span-7 bg-[#0a0a0f]/40 border border-white/10 p-6 rounded-3xl space-y-6 flex flex-col justify-center">
                        
                        {/* 1. SEVERITY */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs flex-row-reverse">
                            <span className="text-slate-300 font-bold">مستوى التأثير والخطورة (Severity - S)</span>
                            <span className="text-orange-400 font-mono font-bold text-sm bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">{fmeaSeverity} / 10</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={fmeaSeverity}
                            onChange={(e) => setFmeaSeverity(parseInt(e.target.value))}
                            className="w-full accent-orange-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                            {fmeaSeverity >= 8 ? 'كلي: شلل تام للمصنع، خسائر إنتاجية فادحة وتهديد للسلامة المادية.' :
                             fmeaSeverity >= 5 ? 'متوسط: توقف جزئي للماكنة، المكون البديل يقلل كفاءة العمل الإجمالية.' :
                             'طفيف: تراجع جودة المظهر دون أي توقف في الآلات الكبرى.'}
                          </p>
                        </div>

                        {/* 2. OCCURRENCE */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs flex-row-reverse">
                            <span className="text-slate-300 font-bold">معدل التكرار والاحتمالية (Occurrence - O)</span>
                            <span className="text-orange-400 font-mono font-bold text-sm bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">{fmeaOccurrence} / 10</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={fmeaOccurrence}
                            onChange={(e) => setFmeaOccurrence(parseInt(e.target.value))}
                            className="w-full accent-orange-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                            {fmeaOccurrence >= 8 ? 'شبه مؤكد: يحدث يومياً تقريباً لغياب الصيانة ومشاكل متأصلة في التصميم.' :
                             fmeaOccurrence >= 5 ? 'مستمر: تكرار دوري متوقع (مرة شهرياً) تزامناً مع تعب الأجزاء الميكانيكية.' :
                             'نادر: حدوث شبه مستحيل أو لم يسبق رصده سوى مرة واحدة في تاريخ المصنع.'}
                          </p>
                        </div>

                        {/* 3. DETECTION */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs flex-row-reverse">
                            <span className="text-slate-300 font-bold">معامل صعوبة الاكتشاف المسبق (Detection - D)</span>
                            <span className="text-orange-400 font-mono font-bold text-sm bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">{fmeaDetection} / 10</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={fmeaDetection}
                            onChange={(e) => setFmeaDetection(parseInt(e.target.value))}
                            className="w-full accent-orange-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                            {fmeaDetection >= 8 ? 'مستحيل: لا توجد حساسات أو مؤشرات، والفشل يفاجئ الطاقم كلياً.' :
                             fmeaDetection >= 5 ? 'صعب: يعتمد على الكشف البصري الدقيق للفني أثناء الوردية والجرد.' :
                             'سهل جداً: حساسات IoT وحواسيب التتبع تعطي إنذاراً مبكراً قبل وقوع الضرر التام.'}
                          </p>
                        </div>

                      </div>

                      {/* Display Gauge dial Panel (5 Columns) */}
                      <div className="lg:col-span-5 bg-slate-900/60 border border-white/10 p-6 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/[0.01] rounded-full blur-3xl pointer-events-none" />
                        
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">رقم أولوية المخاطر (RPN Score)</span>
                        
                        {/* Huge Score circle */}
                        <div className="w-36 h-36 rounded-full border-4 border-dashed border-orange-500/20 flex flex-col items-center justify-center my-4 relative">
                          <div className="absolute inset-2 rounded-full bg-white/[0.02] backdrop-blur-md flex flex-col items-center justify-center">
                            <span className="text-4xl font-mono font-black text-white">{rpnScore}</span>
                            <span className="text-[9px] text-slate-500 font-black tracking-widest uppercase mt-1">S × O × D</span>
                          </div>
                        </div>

                        {/* Status classification */}
                        <div className={cn("px-4 py-2 rounded-xl text-xs font-bold border mt-2 w-full", rpnRating.color)}>
                          {rpnRating.label}
                        </div>

                        {/* Engineering advice */}
                        <p className="text-[11px] text-slate-400 font-semibold leading-relaxed mt-4">
                          {rpnScore >= 300 
                            ? 'إجراء عاجل: يجب إدخال هذا البند فوراً ضمن مهام الصيانة الوقائية الإجبارية لمنع الإضرار الكلي بالآلة.'
                            : rpnScore >= 100 
                            ? 'توصية: يرجى فحص ومعايرة القطع الاستهلاكية المذكورة شهرياً ومتابعة الرصيد في الكتالوج.'
                            : 'حالة مقبولة: مواصلة المراقبة الروتينية للماكينة ولا يتطلب تعديل خطط العمل.'}
                        </p>

                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Sliders className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
                    <p className="text-slate-500 font-bold">يرجى تسجيل وتحديد عطل من القائمة الجانبية لتشغيل معالج المخاطر (FMEA).</p>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
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
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0f111a] border border-white/10 rounded-2xl shadow-2xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6 text-right">إضافة عائلة أعطال جديدة</h3>
              <form onSubmit={handleAddCategory} className="space-y-4 text-right">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">اسم العائلة</label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 text-right"
                    placeholder="مثال: ميكانيك، هيدروليك..."
                  />
                </div>
                <div className="flex gap-3 mt-8 flex-row-reverse">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-white hover:bg-slate-200 text-slate-950 rounded-xl font-extrabold transition-all shadow-md text-xs"
                  >
                    إضافة العائلة
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs transition-all"
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
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0f111a] border border-orange-500/30 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500/0 via-orange-500 to-orange-500/0" />
              
              <h3 className="text-xl font-bold text-white mb-2 text-right">تسجيل عطل جديد</h3>
              <p className="text-sm text-slate-400 mb-6 text-right">
                ضمن عائلة: <strong className="text-orange-400">{selectedCategory?.name}</strong>
              </p>

              <form onSubmit={handleAddTemplate} className="space-y-4 text-right">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">اسم العطّل (Symptom / Problem)</label>
                  <input
                    type="text"
                    required
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 text-right"
                    placeholder="مثال: تسرب هيدروليكي، ارتفاع الحرارة..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">وصف العطل وسياق الفحص (اختياري)</label>
                  <textarea
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 h-24 resize-none text-right"
                    placeholder="تفاصيل إضافية حول هذا العطل لتوجيه الفني..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">مستوى الخطورة الافتراضي</label>
                  <select
                    value={newTemplateSeverity}
                    onChange={(e) => setNewTemplateSeverity(e.target.value as any)}
                    className="w-full bg-[#0a0a0f]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 text-right appearance-none"
                  >
                    <option value="low">منخفض (Low)</option>
                    <option value="medium">متوسط (Medium)</option>
                    <option value="high">عالي (High)</option>
                    <option value="critical">حرج (Critical)</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-8 pt-4 border-t border-white/10 flex-row-reverse">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-white hover:bg-slate-200 text-slate-950 rounded-xl font-extrabold transition-all shadow-md flex items-center justify-center gap-2 flex-row-reverse text-xs cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                    <span>حفظ في الكتالوج</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingTemplate(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs transition-all"
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
