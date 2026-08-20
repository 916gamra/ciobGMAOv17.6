# 🏛 دستور البطاقة اليسرى الهرمية الموحدة للمختبرات (Golden Master Hierarchical Lab Sidebar Standard)

**نظام BDR Nexus (GMAO v17.6) — وثيقة المعايير المعمارية للمختبرات**

---

## 1. الفلسفة والهدف المعماري (Architectural Philosophy)
تُعتبر البطاقة اليسرى (`Left Navigation Panel / Hierarchical Sidebar`) العمود الفقري للتصفح والفلترة في مختبرات BDR Nexus. لضمان تجربة مستخدم موحدة وفائقة المقروءية وخالية من التشتت البصري بين مختلف المختبرات الصناعية:
1. **PDR Spare Parts Catalog** (`ComponentCatalogView.tsx`)
2. **Spare Parts Families & Templates Lab** (`PartsCatalogLabView.tsx`)
3. **Engineering Classification & Modeling Lab** (`EngineeringLabView.tsx`)

تم توحيد الهيكل والسلوك والأنماط التفاعلية في مكون مركزي واحد قابل لإعادة الاستخدام:
`@/shared/components/LabHierarchicalSidebar.tsx`

---

## 2. الهيكلية المعمارية الثلاثية (3-Tier Master Hierarchy)

```
┌─────────────────────────────────────────────────────────────┐
│ 🏛️ [Header] Title + Mandatory Subtitle        [ 🔄 Sync ]   │
├─────────────────────────────────────────────────────────────┤
│ 🔘 [Primary Action] High-Contrast White "+ New Family"     │
│ ⚪ [Master Reset] "View Master Catalog" (Conditional)       │
│ 🔍 [Search Input] "Filter by code, name, or SKU..."         │
├─────────────────────────────────────────────────────────────┤
│ 📂 [Level 1: Family Node]                                   │
│    ▶ [Icon] Mechanical (ROB)       [ 8 Tpls ] [ + Quick ]   │
│    ▼ [Expanded Family]                                      │
│      ├── 📑 [Level 2: Template Node]                        │
│      │   ▶ [Layers Icon] Roulement 6200  [ 12 Bps ] [ + ]   │
│      │   ▼ [Expanded Template]                              │
│      │     ├── 🏷️ [Level 3: Blueprint] ROB-001 [🟢 In-Stock] │
│      │     └── 🏷️ [Level 3: Blueprint] ROB-002 [⚫ Dormant]  │
│      └── 📑 [Level 2: Template 2] ...                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. مواصفات وميزات المكون الموحد (`LabHierarchicalSidebar`)

### أ. الترويسة والجو المحيطي (Header & Atmosphere)
- **الخامة الزجاجية:** `GlassCard` بخلفية زجاجية معتمة `bg-[#0a0a0f] backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl`.
- **التوهج المحيطي الخافت:** يتكيّف تلقائياً مع المحرك (`cyan`, `amber`, `indigo`, `orange`, `violet`, إلخ).
- **العنوان الصريح والوصف الإلزامي:** خط أبيض عريض `font-black` مع وصف رمادي `text-slate-400 text-[10px] uppercase tracking-widest` وزر المزامنة `RefreshCw`.

### ب. شريط القيادة والتحكم (Command & Filter Bar)
- **الزر الرئيسي الإستراتيجي الأبيض:** `bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg` يمنح وصولاً فورياً لإضافة عائلة جديدة.
- **زر التصفير الشامل الذكي (Master View Button):** يظهر ديناميكياً فقط عند وجود عنصر محدد، لإتاحة العودة الفورية لعرض الدليل الشامل لكافة المقاعد (999 Slots).
- **شريط البحث المتجاوب:** يدعم RTL / LTR تلقائياً مع زر تفريغ سريع `X`، وتوسيع تلقائي ذكي للعقد المطابقة للبحث.

### ج. عقد الشجرة الذكية (Smart Hierarchy Nodes)
- **المستوى الأول (العائلة - Family):**
  - زر طي/توسيع مستقل لا يتداخل مع حدث التحديد (`Selection`).
  - صندوق أيقونة دلالي حسب التخصص الصناعي (ميكانيكي، كهربائي، هيدروليكي، هوائي، عام).
  - كود العائلة بخط أحادي `font-mono` + بادج عداد القوالب.
  - زر إضافة سريعة `+` يظهر عند التحويم لإضافة قالب فرعي فوراً.
- **المستوى الثاني (القالب - Template):**
  - خط إرشادي متدرج `ms-4 ps-2.5 border-s border-white/10`.
  - كود القالب + بادج عداد الموديلات/القطع + زر إضافة سريعة `+` عند التحويم.
- **المستوى الثالث (الموديل/القطعة - Blueprint):**
  - مؤشر التواجد المادي في المخزن (نقطة خضراء متوهجة `bg-emerald-400` عند توفر رصيد مادي، أو رمادية `bg-slate-600` إذا كانت معرفة نظرية).
  - كود القطعة/الموديل بخط أحادي نقي `font-mono text-[9px]`.

---

## 4. المعايير القياسية للتجاوب والأبعاد (Responsive & Layout Dimensions Standard)

لتفادي أي تفاوت بين المختبرات وضمان التوافق المطلق مع كافة مقاسات الشاشات:

1. **عرض الحاوية اليسرى (Left Sidebar Width):**
   * العرض القياسي المعتمد: `w-full md:w-80 shrink-0 h-[650px] md:h-auto min-h-0`.
   * يمنع استخدام قياسات عريضة مفرطة مثل `lg:w-[380px]` لأنها تضغط مساحة الجداول وبطاقات العمل اليمنى.
   * قياس `w-80` (320px) يوفر اتساعاً مثالياً لعمق الشجرة الثلاثية مع إتاحة 70-80% من المساحة للوحة العمل الرئيسية.

2. **نقطة التحول والتجاوب (Breakpoint):**
   * يتم تفعيل التقسيم الأفقي للشاشات جنباً إلى جنب بدءاً من الشاشات المتوسطة `md:flex-row` (768px+) بدلاً من تأخيرها إلى `lg:`، مما يمنح تجربة سلسة على الأجهزة اللوحية (Tablets) والحواسيب المحمولة.

3. **الهيكل الخارجي والحشو (Outer Shell & Padding):**
   * حاوية الصفحة الخارجية: `px-6 md:px-8 pb-6 overflow-hidden flex-1 min-h-0`.
   * يضمن هذا التناسق عدم ظهور شريط تمرير خارجي مزدوج وتمدد القائمة الشجرية لتأخذ 100% من الارتفاع المتاح بسلاسة.

---

## 5. واجهة الخصائص البرمجية (TypeScript API Reference)

```typescript
import { LabHierarchicalSidebar, HierarchyFamilyNode } from '@/shared/components/LabHierarchicalSidebar';

// واجهة الاستخدام المعيارية:
<LabHierarchicalSidebar
  title="فهرس قطع الغيار"
  subtitle="PDR SPARE PARTS CATALOG"
  families={formattedFamilies}
  selectedFamilyId={selectedFamilyId}
  selectedTemplateId={selectedTemplateId}
  selectedBlueprintId={selectedBlueprintId}
  onSelectFamily={(family) => handleFamilySelect(family)}
  onSelectTemplate={(template, family) => handleTemplateSelect(template, family)}
  onSelectBlueprint={(blueprint, template, family) => handleBlueprintSelect(blueprint, template, family)}
  onPrimaryAction={() => setShowAddFamilyModal(true)}
  primaryActionLabel="تسجيل عائلة جديدة"
  onResetSelection={() => resetToMasterView()}
  resetLabel="عرض الدليل الشامل (999 مقعد)"
  onRefresh={() => refreshData()}
  isRefreshing={isLoading}
  onQuickAddTemplate={(family) => handleQuickAddTemplate(family)}
  onQuickAddBlueprint={(template, family) => handleQuickAddBlueprint(template, family)}
  engineTheme="cyan" // 'cyan' | 'amber' | 'indigo' | 'orange' | 'violet'
  searchPlaceholder="بحث بالاسم أو الكود أو المرجع..."
  level3Enabled={true}
/>
```

---

## 6. خطة التطبيق والمطابقة على صفحات المختبرات:
1. **PDR Spare Parts Catalog** (`ComponentCatalogView.tsx`) — *تم التوحيد والضبط التجاوبي بنجاح*.
2. **Spare Parts Families & Templates Lab** (`PartsCatalogLabView.tsx`) — *تم التوحيد وتطبيق القياسات المعيارية `w-80 md:flex-row` بنجاح*.
3. **Engineering Classification & Modeling Lab** (`EngineeringLabView.tsx`) — *المحطة التالية للتكامل المعماري*.
