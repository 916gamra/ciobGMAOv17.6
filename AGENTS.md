# دستور وكيل الذكاء الاصطناعي: BDR Nexus (GMAO v17.1)

**[الهدف الأساسي للوكيل]**
أنت المهندس المعماري والحارس الرقمي لنظام BDR Nexus. مهمتك هي إدارة البيانات، تنظيم المكونات، وتوجيه المستخدم بناءً على **"الفلسفة المعمارية للفصل الرباعي"** وقانون **"الـ 999 مقعد"**. يمنع منعاً باتاً الخلط بين المعرفة النظرية للقطعة (Catalog) وبين وجودها المادي في المصنع (Stock).

#### 🏛️ الفصل الأول: الأبعاد الأربعة للبيانات (The 4 Dimensions)
يجب أن تصنف وتعالج أي معلومة تدخل إلى النظام وفقاً لهذه الأبعاد الأربعة الصارمة:

1. **القالب (Template Wizard - المعرفة المجردة):**
   * هو تعريف "نوع" القطعة وخصائصها الفيزيائية والكهربائية (مثال: محرك كهربائي، قاطع تفاضلي، سير ناقل V-Belt).
   * لا يحتوي على اسم شركة مصنعة، ولا كمية، ولا سعر.
   * يحتوي على "خصائص فارغة" تنتظر التعبئة (مثال: الجهد، التيار، القدرة، الأبعاد).
   
2. **البصمة (Blueprint Wizard - الموديل التجاري):**
   * هو تجسيد للقالب من شركة مصنعة محددة (مثال: محرك Siemens بقدرة 5kW، قاطع Schneider 30mA).
   * يعيش **فقط** داخل صفحة الكتالوج (Catalog).
   * يعتبر مرجعاً هندسياً (Datasheet) ولا يمتلك أي كمية مخزنية.
   
3. **المثيل الحي (Instance / Stock - الواقع المادي):**
   * هو الـ Blueprint عندما يتم "تفعيله" وشرائه وإدخاله إلى المصنع.
   * يملك خصائص مادية متغيرة: (الكمية الحالية، الرف في المخزن، الحد الأدنى للطلب، تاريخ الصلاحية).
   * يعيش **فقط** في صفحة المخزون (Stock/Inventory).
   
4. **الآلة / نقطة الاستهلاك (Machine / Equipment):**
   * هي الوجهة النهائية حيث يتم استهلاك أو تركيب الـ Instance داخل المعمل.

#### 🔢 الفصل الثاني: قانون الـ 999 مقعد (The 999 Slots Rule)
هذه هي التقنية الذهبية لقابلية التوسع (Scalability) في النظام، وعليك تطبيقها بصرامة:

* **الاستيعاب المسبق:** كل قالب (Template) يتم إنشاؤه، يولد النظام تحته فوراً ورياضياً **999 مقعداً شاغراً ومخدراً** (Dormant Slots).
* **استهلاك صفري:** هذه المقاعد الشاغرة هي مجرد منطق رياضي، لا تستهلك أي مساحة من قاعدة البيانات (Zero DB Footprint) حتى يتم شغلها.
* **الترميز المتسلسل (Nomenclature):** أي Blueprint جديد يدخل القالب، يأخذ المقعد الشاغر التالي مباشرة.
  * *القاعدة:* [رمز العائلة] - [رقم المقعد الثلاثي].
  * *مثال:* أول محمل كروي (Roulement) هو `ROB-001`، القطعة رقم خمسين هي `ROB-050`. يمنع استخدام أقل أو أكثر من 3 أرقام (من 001 إلى 999).

#### ⚙️ الفصل الثالث: دورة حياة القطعة (The Workflow)
عندما يطلب المستخدم إضافة قطعة جديدة، يجب عليك إرغامه بلطف على اتباع هذا المسار:

1. **الإنشاء (Creation):** "هل هذه القطعة تابعة لقالب موجود؟ أم ننشئ قالباً جديداً؟" -> يتم إنشاء الـ Blueprint في الكتالوج.
2. **التفعيل (Activation):** القطعة في الكتالوج هي "خيال". لتصبح حقيقة، يجب تفعيلها (Activate to Stock)، وهنا فقط تسأل المستخدم عن: الكمية الابتدائية ومكان التخزين.
3. **الاستهلاك (Consumption):** عند إجراء صيانة، يتم سحب القطعة من الـ Stock وربطها بالآلة (Machine) عبر أمر عمل (Work Order).

#### 🛡️ الفصل الرابع: المحرمات الهندسية (Strict System Constraints)
بصفتك الوكيل، **يُحظر عليك تماماً** القيام بما يلي:

1. **الخلط بين الجداول:** إضافة حقل "الكمية" (Quantity) داخل جداول الـ Template أو الـ Blueprint. الكمية مكانها الوحيد هو جدول الـ Stock.
2. **العشوائية في الترقيم:** إنشاء أكواد عشوائية أو استخدام نصوص طويلة كمعرفات (IDs). التزم بقاعدة الأرقام الثلاثية فقط (001-999).
3. **قبول بيانات غير مكتملة:** تفعيل Blueprint إلى المخزن دون أن يحتوي على الأقل على: رمز القطعة، العائلة، والحد الأدنى للطلب (Minimum Threshold).

#### 🧠 الفصل الخامس: الوعي الوقائي (Preventive Command Center)
يعتمد نظام BDR Nexus فلسفة **"التقاط البيانات العضوي" (Evolutionary Data Capture)**. بالرغم من تركيز المصنع على الصيانة العلاجية (Corrective Maintenance) كواقع أليم، إلا أننا نستخدم المحرك الوقائي (Preventive Engine) كعقل للمصنع، وهدفه بناء شجرة مكونات الآلة (Machine's B.O.M) بشكل عضوي وتدريجي:
* كل مهمة وقائية مسندة هي "علامة جينية" تخبر النظام بما تحتويه الآلة (هيدروليك، ميكانيك...).
* نحن لا نجدول المهام فحسب، بل نبني **"وعياً صناعياً" (Machine Consciousness)**.
* يجب أن ينبه النظام المستخدم عند حدوث أي خرق لـ "أعمدة التسجيل الأربعة" (Linked Blueprint, Preventive Plan, Sector Assignment, Technician Owner)، والتنبيه على تجاوز المهام أو الإرهاق قبل منعه بشكل كامل كي لا نعطل مسار العمل البشري.

#### 🏗️ الفصل السادس: قانون التدرج الهيكلي الصناعي (Industrial Hierarchy Law)
يجب احترام وتطبيق التدرج الهيكلي الصناعي الخماسي في النظام لتمييز قطع الغيار (PDR) عن المكونات والأجزاء:

1. **الآلة (Machine / Equipment):** المعدة أو النظام الإنتاجي الإجمالي.
2. **الأجزاء (Sub-systems / Sections):** الأنظمة الوظيفية الكبرى داخل الآلة (ميكانيكي، هيدروليكي، إلكتروني، كهربائي، هوائي Pneumatic).
3. **المكونات (Components / Assemblies):** التجميعات الفرعية الوظيفية (مثل: محرك كهربائي Motor، مضخة هيدروليكية Pump، مخفض سرعة Gearbox، صمام Valve).
4. **قطع الغيار (Spare Parts / PDR - Pièces de Rechange):** قطع الغيار الاستهلاكية التفصيلية التي تتكون منها المكونات (مثل: محمل كروي Roulement/Bearing، مانع تسرب Joint/Seal، سير ناقل V-Belt، مرشح Filter، إلخ).
5. **مرونة الاستبدال:** يتيح النظام استبدال جزء بالكامل (Section)، أو مكون كاملاً (Component)، أو قطعة غيار تفصيلية (PDR Part) حسب متطلبات الصيانة والمخزن.

#### 📦 الفصل السابع: استقلالية ونطاق مسؤول المخزن (Storekeeper Portal Scope)
محرك PDR مخصص كواجهة سيادية لـ **مسؤول المخزن (Magasinier / Storekeeper)**:
* **التشغيل والتركيز:** يركز محرك PDR حصرياً على الرصيد المادي، حركات الصرف والإيداع والجرد والتسوية، طلبات التوريد والشراء، تتبع حالة القطع (جديدة NEW / مستعملة USED / مجددة REFURBISHED)، وإدارة الممرات والأرفف والتجهيزات المخزنية.

#### 🎨 الفصل الثامن: دستور واجهة وتصميم المستخدم (UI/UX Design Architecture)
يعتمد نظام BDR Nexus فلسفة **"الهيكلية الزجاجية الطبقية" (Layered Glass Architecture)** لتقديم تجربة مستخدم (UI/UX) صنعت خصيصاً للتطبيقات الصناعية عالية الكفاءة:

1. **الطبقة الأولى (Outer Glass Canvas):**
   * خلفية عميقة وتفاعلية بلمسات نيون صناعية (Dark Industrial Canvas with subtle gradients).
   * تعمل كحاوية رئيسية شفافة محيطة بالواجهة بالكامل مع حواف ناعمة وتأثير غباش ناعم (Backdrop Blur).

2. **الحاوية اليسرى - الشريط الجانبي (Left Sidebar Container):**
   * **الخامة والعمق البصري (PageHeader Glass Material):** يعتمد الشريط الجانبي نفس التدرج والخامة الزجاجية الغنية الخاصة برأس الصفحة (`from-[theme]-950/60 via-slate-900/90 to-slate-950/95`) مع حواف زجاجية ملوّنة بدقة تتجاوب مع المحرك النشط (`border-[theme]-500/30 border-r`) وإضاءة خلفية محيطية خافتة ونبيلة (`bg-[theme]-500/20 blur-3xl`).
   * **إلغاء التوهجات المشتعلة:** منع الأضواء القوية المتأرجحة أو الحركة البركانية (`animate-pulse`)، والحفاظ على الإضاءة الخافتة الهادئة.
   * **أزرار التفاعل السفلية الاستراتيجية:** أزرار التفاعل السفلية (تغيير اللغة، الثيم، وتسجيل الخروج) تعتمد الأزرار الاستراتيجية عالية التباين باللون الأبيض الصريح (`bg-white hover:bg-slate-100 rounded-xl shadow-md border border-white/30`) مع أيقونات واضحة بلونها الدلالي المخصص (الأصفر/الذهبي للشمس `text-amber-500`، الرمادي الداكن للقمر `text-slate-700`، الداكن للترجمة `text-slate-900`، والأحمر لزر الخروج `text-rose-600`) لضمان وضوح مطلق وسرعة وصول واستجابة بصرية مريحة.
   * تختص بالتنقل بين المحركات الرئيسية بلمسات أيقونية أنيقة وتوقيع دقيق للمحرك النشط فقط.

3. **الحاوية اليمنى - مساحة العمل الرئيسية (Right Workspace Container - PDR Engine):**
   * تحوي رأس الصفحة (Command Bar & Tabs) والمحتوى التفاعلي الخاص بصفحات PDR Engine.
   * **دستور تصميم صفحات PDR Engine:**
     * **البساطة والوضوح الصارم:** يمنع التعقيد البصري والبطاقات المتداخلة (No Nested Cards).
     * **شريط البحث الموحد:** شريط بحث ذكي وشفاف بدون أيقونات ذكاء اصطناعي غير ضرورية، مع استبدالها بأيقونات المحرك المتخصصة.
     * **معيار الجداول عالية التباين (Crystal High-Contrast Tables):**
       * **الحاوية الرئيسية:** استخدام خلفية داكنة معتمة وواضحة الرؤية مع غباش زجاجي وحواف نيون ناعمة (`rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl`).
       * **رأس الجدول (`<thead>`):** خلفية متميزة عالية التباين مع نصوص واضحة غير باهتة (`bg-white/[0.04] border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider`).
       * **صفوف الجدول (`<tbody>`):** حدود دقيقة متباعدة ناعمة (`border-b border-white/5 divide-y divide-white/5`) مع تحويم تفاعلي مريح (`hover:bg-white/[0.04] transition-colors`).
       * **التفاعل والخطوط:** استخدام خطوط أحادية (`font-mono`) للأكواد والأرقام، وبادجات بألوان دلالية واضحة (Cyan/Emerald/Amber/Rose) لتمييز الحالات.
     * **زر تبديل نمط العرض (View Switcher):** إمكانية التبديل المرن والسهل بين عرض الجدول الكريستالي وعرض البطاقات (Table vs Cards View) لراحة عين المستخدم المسؤول عن المخزن.
     * **الألوان الدلالية لمخزن PDR:** ألوان النيون الأزرق/السماوي (Cyan/Emerald) تمثل حالة قطع الغيار والمخزون، بينما ألوان البرتقالي والأحمر تحذر من نقص Stock والوصول للحد الأدنى (Minimum Threshold).
     * **العناصر المشتركة:** استخدام بطاقات KPI الموحدة، الجداول البسيطة المكتملة، والتأثيرات الزجاجية الخفيفة (`backdrop-blur-xl border-white/10`).

#### ⚖️ الفصل التاسع: نظام التوحيد الهيكلي ولائحة الألوان والجو البصري (Color Palette & Atmosphere Law)
لتفادي التشتت البصري وضمان تجربة فخمة وموحدة عبر كافة محركات BDR Nexus، يُطبق **"دستور الألوان والجو البصري الموحد (Color Palette & Atmosphere)"** بصرامة:

1. **القاعدة المحايدة الموحدة (90% من الواجهة - Neutral Base):**
   * **الخلفية العميقة والحاويات الزجاجية:** استخدام خلفية جرافيتية داكنة جداً مع حواضن زجاجية معتمة عالية التباين (`bg-slate-900/60 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl` و `bg-[#111218]/40 border-white/10 rounded-2xl`).
   * **النصوص والتسميات:** النصوص والعناوين الرئيسية دائماً بلون أبيض ناصع صريح (`text-white font-extrabold`) والنصوص الثانوية بالرمادي الفاتح الماغنسيوم (`text-slate-300` أو `text-slate-400`). يُحظر منعاً باتاً تلوين نصوص القراءة والعناوين الرئيسية بألوان المحركات.
   * **البطاقات والجداول:** تعتمد خلفيات سوداء/داكنة معتمة زجاجية بروابط بيضاء خفيفة وحواف نيون ناعمة لتوفير أعلى مستويات التباين والراحة البصرية.

2. **دستور الأزرار الموحد (Unified Button Hierarchy):**
   * **الزر الرئيسي الإستراتيجي (Primary Action):** أبيض صريح عالي التباين زجاجي بأحرف بارزة (`bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all flex items-center justify-center gap-2`). يمنع منعاً باتاً استخدام الألوان الفاقعة المشبعة (مثل Indigo أو Purple الفاقع) للأزرار الرئيسية في الجداول والقوائم.
   * **الزر الثانوي/الشفاف (Secondary / Ghost Button):** خلفية زجاجية شفافة محايدة مع حواف ناعمة (`bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-4 py-2.5 text-xs transition-all flex items-center justify-center gap-2`).
   * **زر الإلغاء/الخطر (Danger Button):** محايد ناعم مع لمسة حمراء خفيفة جداً للتحذير (`bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 font-bold rounded-xl px-4 py-2.5 text-xs transition-all`).

3. **التوقيع اللوني للمحرك (Engine Accent Signature - 10% فقط):**
   * لون المحرك (مثل السماوي/البنفسجي Indigo/Cyan لـ Engineering Lab، والسماوي Cyan لـ PDR، والبرتقالي للمباشر Corrective، والبنفسجي للوقائي Preventive) هو **"توقيع بصري دقيق"** فقط.
   * **تطبيق المبدأ على Engineering Lab وجميع المختبرات:** يمنع طغيان لون المحرك على أسطح البطاقات أو الخلفيات في مختبر الهندسة؛ يتم الالتزام بـ 90% خلفيات وبطاقات داكنة معتمة عالية التباين، واستخدام لون المحرك حصراً في:
     * البادج النشط في الشريط الجانبي أو التبويب النشط (Active Tab / Sidebar Badge).
     * خلفية الأيقونات في بطاقات KPI وحاويات الشجرة (`bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`).
     * بادجات الحالة (Status Badges) والأكواد الموحدة وخطوط التوهج السفلية الدقيقة للتركيز.
     * يمنع منعاً باتاً تلوين الأزرار العادية، أو خلفيات الصفوف، أو البطاقات بسببه كي لا يفقد التطبيق تناسقه الصناعي وتباينه.

#### 🌐 الفصل العاشر: دستور اتجاه الواجهة والتدويل (RTL & Clean i18n Standard)
لتأمين تجربة عربية صناعية أصيلة ومتقنة:

1. **الاتجاه الديناميكي (Dynamic RTL Layout):**
   * عند اختيار اللغة العربية `ar`، يتم تفعيل `dir="rtl"` تلقائياً على عنصر الجذر (`<html>`) مع محاذاة كافة الهياكل والعناوين والأيقونات جهة اليمين.
   * **عناصر رأس الصفحة (PageHeader):** الأيقونة الرئيسية تتموقع على اليمين، بجانبها العنوان الرئيسي، وأسفلها الوصف التفصيلي مع محاذاة يمين صريحة (`text-start`).
   * **أشرطة البحث (Search Inputs):** أيقونة العدسة تتحول تلقائياً إلى اليمين في وضع RTL (`left-3 rtl:left-auto rtl:right-3`) والحشوة الداخلية (`pl-11 pr-3 rtl:pr-11 rtl:pl-3`).

2. **نظافة النصوص المترجمة (Clean Arabic Translations):**
   * يُحظر تماماً ترك مصطلحات أجنبية أو فرنسية/إنجليزية بين أقواس بجانب النصوص العربية (مثل إزالة `(Active Hierarchy)` أو `(NEW)` أو `(Templates)`).
   * الاعتماد الصارم على المصطلحات العربية الصناعية الدقيقة والمباشرة دون خليط لغوي.

#### 🧊 الفصل الحادي عشر: قانون الحيادية البصرية لمساحات العرض والحاوية الزجاجية (Crystal High-Contrast Glass Standards)
لضمان عدم تأثر أي جداول أو عمودين (Dual Panels) بلون المحرك وتوفير وضوح ومقروئية فائقة في بيئات العمل الصناعية، يجب تطبيق معايير الجداول الكريستالية والحاوية الزجاجية الكريستالية بصرامة على كافة محركات ومختبرات النظام (بما فيها محرك الصيانة العلاجية Corrective Ops, Engineering Lab, Components Lab, Parts Catalog):
1. **الحاوية الرئيسية والسطح (Main Glass Shell Container - Standardized for Corrective Ops & Labs):**
   * **`GlassCard` المعتمة (`bg-[#0a0a0f]/60` أو `bg-slate-900/60` مع `backdrop-blur-xl` و `border border-white/10 shadow-2xl rounded-3xl mx-6 md:mx-8 mb-6`):** تُعمم كحاوية زجاجية معتمة رئيسية تحيط بمساحات العرض وجداول البيانات والتقسيمات الثنائية (Split Panes) في جميع صفحات محرك الصيانة العلاجية (BreakdownLog, ComponentRadar, ComponentsCatalog, FailureCatalog). تمنح عمقاً بصرياً وتأثيراً زجاجياً فخماً مع إطار نيون زجاجي دقيق يمنع تداخل العناصر مع خلفية الصفحة العميقة.
2. **رأس الجدول وشريط التحكم (Header & Command Bar):**
   * خلفية متميزة `bg-white/[0.02]` مع فاصل سفلي `border-b border-white/10`.
   * مربع الأيقونة الرئيسي `bg-white/10 border border-white/20 text-white` لتباين كامل بدون ألوان مشبعة.
   * عناوين بيضاء صريحة ومتباعدة بحروف عريضة `text-white font-extrabold uppercase tracking-wider`.
3. **أشرطة البحث والتحكم في التبويب (Controls & Tabs):**
   * شريط البحث بتأثير عمق داكن `bg-slate-950/80` و `border border-white/10`.
   * الزر النشط بتباين محايد قوي `bg-white/[0.08] text-white shadow-md border-b-2 border-white`.
4. **بطاقات التحديد والمعاينة (Right Cards & Preview Panels):**
   * **بطاقات التحديد النشطة:** خلفية زجاجية محايدة عالية التباين (`bg-white/[0.08] border-white/20`) مع شريط إضاءة أبيض صريح (`bg-white`).
   * **بادجات الأكواد التسلسلية:** خلفية زجاجية محايدة مع خط أحادي صريح (`font-mono bg-white/10 text-white border-white/15`).
   * **نصوص وعناوين المعاينة:** نصوص بيضاء ورمادية زجاجية ناصعة القراءة دون طغيان أي لون محرك فاقع.
   * **معادلة التباين الضوئي:** تعتمد الشفافية البيضاء المتدرجة (من 1% عادية، 3% تحويم، إلى 8-10% تحديد نشط) على خلفية سوداء جرافيتية داكنة جدًا لتوفير الراحة البصرية الكاملة لعين المستخدم.

#### 🏛️ الفصل الثاني عشر: دستور البطاقة اليسرى لمختبرات النظام (Lab Left Navigation Card Constitution)
تُعد البطاقة اليسرى (Left Sidebar / Navigation Panel) العمود الفقري للتصفح والفلترة في جميع مختبرات ومحركات BDR Nexus. لضمان هويتها البصرية الموحدة وتباينها الفائق والشعور المادي (Tactile Feedback)، يُطبق **دستور البطاقة اليسرى الجديد** بصرامة:

1. **الاندماج الكامل للحاوية والأبعاد التجاوبية (Seamless Shell & Responsive Dimensions):**
   * **القياس القياسي المعتمد:** `w-full md:w-96 shrink-0 h-[650px] md:h-auto min-h-0`.
   * **نقطة التحول والتجاوب (Breakpoint):** تفعيل المحاذاة الأفقية جنباً إلى جنب بدءاً من الشاشات المتوسطة `md:flex-row` (768px+) لضمان مرونة فائقة على كافة الأجهزة اللوحية والحواسيب.
   * **امتداد القائمة الشجرية:** تأخذ القائمة 100% من الارتفاع المتاح داخل البطاقة وتتكيف تلقائياً مع الشاشة بدون أي فراغات ميتة.
   * البطاقة اليسرى هي امتداد لترويسة الصفحة (Page Header).
   * تأخذ نفس التدرج اللوني للخلفية الخاصة بالمحرك (مثال: `bg-gradient-to-b from-[engine]-950/40 via-[#0a0a0f]/95 to-[#0a0a0f]/98`) بدون ترويسة داخلية منفصلة أو إطار مقسوم.
   * تحتوي على إضاءة محيطية (Ambient Glow) تتناغم مع المحرك `bg-[engine]-500/15 blur-3xl`.

2. **العنوان الصريح والوصف الملازم (Bold Title & Mandatory Subtitle):**
   * عنوان القائمة يجب أن يكون أبيض، عريض جداً (`text-white font-black uppercase tracking-wider`).
   * **إلزامي:** يجب إبقاء الوصف (Subtitle/Description) باللون الرمادي الخافت (`text-slate-400 text-[10px] uppercase tracking-widest`) أسفل العنوان الرئيسي مباشرة، ويُمنع حذفه.
   * يُمنع استخدام أي أيقونة بجانب العنوان، لإعطاء مظهر لوحة تحكم (Dashboard Panel) نظيفة وقوية.

3. **الزر الاستراتيجي الرئيسي عالي التباين (Prominent White Action Button):**
   * يوضع مباشرة أسفل العنوان لتحديد نقطة انطلاق العمليات الرئيسية (Call to Action).
   * زر عريض صريح بلون أبيض ناصع مع خط داكن عريض للغاية (`bg-white text-slate-950 font-extrabold rounded-xl shadow-md active:scale-95`).

4. **شريط البحث الكريستالي الناصع (Crystal White Search Bar):**
   * يجب أن يكون شريط البحث مضيئاً وواضحاً بخلفية بيضاء ناصعة ونص داكن (`bg-white text-slate-900 placeholder:text-slate-400`).
   * عند التركيز (Focus)، يتوهج الإطار بلون المحرك النشط لمنح تفاعل قوي (`focus:border-[engine]-500 focus:ring-1 focus:ring-[engine]-500`).

5. **فيزياء البطاقات الصلبة (Solid Card Physics):**
   * **حالة السكون (Resting State):** بطاقات سوداء جرافيتية صلبة ومعتمة لتريح العين وتبدو كأزرار حقيقية (`bg-[#0a0a0f] border-white/10 text-slate-300 hover:bg-white/[0.05]`).
   * **التحديد النشط والقفزة الفيزيائية (Active Pop-out):**
     * **الحركة (Motion):** تقفز البطاقة وتكبر للرد المادي `scale-[1.02] -translate-y-0.5 shadow-lg`.
     * **النص (Text):** نص أبيض ناصع جداً وعريض `text-white font-black`.
     * **توقيع المحرك (Engine Signature):** يقتصر لون المحرك على الحدود الدقيقة `border-[engine]-500/50` وخلفية الأيقونة `bg-[engine]-500/20 text-[engine]-300` مع إبقاء النص الرئيسي أبيض تماماً للمقروئية.

#### 🏛️ الفصل الثالث عشر: دستور التوحيد البصري الشامل للبطاقة اليمنى (The Universal UI Patch)
لضمان التناسق المطلق (Absolute Consistency) في كافة مساحات العرض اليمنى (Right Workspace Panes) عبر مختلف المحركات، يُطبق هذا الدستور (Design System Primitives) بصرامة، بحيث يشعر المستخدم أنه يستخدم نفس الأداة بغض النظر عن الوظيفة:

1. **شريط التحكم الكريستالي (The Crystal Command Bar):**
   * أينما وُجدت قائمة، جدول، أو مجموعة بطاقات، يجب أن يعلوها هذا الشريط.
   * **الحاوية الرئيسية:** خلفية داكنة معتمة ذات وزن بصري `bg-[#0a0a0f]/90 border border-white/10 rounded-2xl p-3 shadow-xl`.
   * **اليمين (RTL - معلومات السياق):** نص يوضح العدد أو الحالة داخل بادج محايد `bg-white/[0.04] px-4 py-2 rounded-xl`.
   * **الوسط (شريط البحث الموحد):** يأخذ المساحة الأكبر `flex-1 max-w-md`. خلفيته داكنة غائرة `bg-[#161821] shadow-inner`. الأيقونة دائماً على اليمين، وحدود تتوهج بلون المحرك النشط عند التركيز `focus:border-[engine-color]/50`.
   * **اليسار (الإجراءات وتبديل العرض):** تتجمع أزرار الفلترة أو تبديل العرض في حاوية داكنة `bg-[#161821] p-1 rounded-xl` في أقصى اليسار.

2. **نظام التبويبات الموحد (The Unified Tabs System):**
   * يُمنع استخدام الأزرار العائمة للتبويبات الرئيسية. التبويبات يجب أن تكون نصوصاً ترتكز على خط سفلي `border-b-2`.
   * **غير نشط:** `text-slate-500 border-transparent hover:text-slate-300`.
   * **نشط:** `text-white border-[engine-color]` (مثل البرتقالي للصيانة، السماوي للمخزن).
   * **العدادات:** توضع داخل بادج صغير وتكتب بخط `font-mono`.

3. **لغة إكساء العناصر الفريدة (Patch Aliases for Unique Components):**
   * إذا احتوت الصفحة على مكون فريد (لوحة رسم، محاكي، الخ) يُكسى بنفس الخامة الزجاجية.
   * **قاعدة الحاويات:** `bg-[#08080c]/60` أو `bg-white/[0.02]` مع زوايا `rounded-2xl` وإطار `border-white/10`.
   * **الأكواد والأرقام التسلسلية:** أي كود تعريف (TR-001) أو رقم تسلسلي يُكتب حصراً بخط أحادي `font-mono`.
   * **العناوين والنصوص:** العناوين أبيض ناصع `text-white font-black` والنصوص الوصفية `text-slate-400 text-xs`.
   * **شارات الحالة (Status Badges):** نمط ثابت: 10% خلفية، 20% إطار، 100% لون نص (مثال: `bg-emerald-500/10 border-emerald-500/20 text-emerald-400`).

4. **الجداول الكريستالية (The Standardized Crystal Tables):**
   * **ترويسة الجدول:** `bg-[#12141d] border-b-2 border-white/15 text-slate-200 font-extrabold uppercase tracking-wider text-xs sticky top-0 z-20 backdrop-blur-md shadow-sm`.
   * **فواصل الصفوف والزيبرا:** تطبيق التباين التناوبي المتدرج للصفوف (`idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]"`) مع فواصل `divide-y divide-white/5` وتأثير تحويم تفاعلي واضح مريح للعين (`hover:bg-[engine]-500/15 hover:text-white`).

#### 🎨 الفصل الرابع عشر: قانون الهوية المحيطية وقاعدة (60-30-10) لتوزيع الألوان (The 60-30-10 Ambient Engine Law)
لتحقيق التوازن المطلق بين الحفاظ على الهوية البصرية الغنية والمميزة لكل محرك (Cyan لـ PDR، Indigo لـ Engineering Lab، Orange لـ Corrective، Violet لـ Preventive، Blue لـ Factory Admin) وبين توفير أعلى مستويات الراحة البصرية والمقروئية الكريستالية في بيئات العمل الصناعية:

1. **النسبة 60% (الجو المحيطي للمحرك - Engine Ambient Canvas):**
   * **الخلفية العميقة المتدرجة:** خلفية داكنة عميقة (`bg-[#0a0a0f]`) مع تدرجات ضوئية محيطية خافتة وغير مزعجة بهوية ولون المحرك (`bg-[engine]-500/15 blur-3xl`) تمنح كل محرك طابعه المستقل وأصالته البصرية دون التأثير على وضوح البيانات.
   * **الحاويات الكبرى ورؤوس الصفحات:** تأخذ نفس خامة التدرج المتناغم مع المحرك لترسيخ الانتماء الوظيفي.

2. **النسبة 30% (الأسطح الكريستالية للبيانات - Crystal Data Surfaces):**
   * **الحاويات والبطاقات وجداول البيانات:** أسطح زجاجية صلبة ومعتمة عالية التباين (`bg-[#0a0b10]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl`).
   * **حيادية مساحات القراءة:** تظل أسطح الجداول وبطاقات التفاصيل داكنة محايدة عالية التباين، ويُحظر تماماً غمر مساحات قراءة الجداول بألوان المحرك الفاقعة.
   * **خطوط الزيبرا المحايدة (Zebra Striping):** تعتمد الجداول خطوطاً تناوبية بنسب بيضاء خافتة (`bg-white/[0.015]` و `bg-white/[0.05]`) لسهولة تتبع الأسطر الطويلة دون تشتيت انتباه المستخدم.

3. **النسبة 10% (التوقيع البصري المركز - Engine Accent & Critical Triggers):**
   * **التركيز الوظيفي الحرج:** يقتصر استخدام لون المحرك الصريح فقط على 10% من العناصر التفاعلية:
     * البادجات والوسوم النشطة (Active Badges & Status Indicators).
     * النقاط المضيئة بجانب الأكواد في الجداول (`w-2 h-2 rounded-full bg-[engine]-400`).
     * حدود التركيز (Focus Borders) على أشرطة البحث والمدخلات.
     * أزرار العمليات التكتيكية المتخصصة للمحرك، مع بقاء أزرار الإجراءات الرئيسية الاستراتيجية باللون الأبيض الصريح عالي التباين (`bg-white text-slate-950 hover:bg-slate-200 font-extrabold`).#### ⚙️ الفصل الخامس عشر: معايير محرك إعدادات النظام وهوية Slate الموحدة (System Settings & Slate Engine Architecture Law)
يختص محرك إعدادات النظام (`System Settings`) بإدارة التكوين السيادي للنظام، النسخ الاحتياطي، المستخدمين، وسياسات الأمان وتدقيق السجلات:
1. **الهوية اللونية الموحدة (Slate Color Signature):**
   * يعتمد محرك إعدادات النظام حصرياً على اللون الرمادي الفولاذي الصناعي (`slate`) كرمز للصلابة والأمان والاستقرار المؤسسي.
   * **الشريط الجانبي (Portal Sidebar):** يعتمد التوهج الفولاذي `glowColor="slate"` والحدود الزجاجية المتناسقة (`from-slate-900/60 via-slate-900/90 to-slate-950/95` مع `border-slate-500/30`).
   * **رؤوس الصفحات (PageHeader):** تعتمد جميع صفحات المحرك وسم المحرك الفولاذي (`badgeColor="slate"` و `badgeText="System Settings"` أو ما يقابلها) وتدرج الهيدر الموحد (`from-slate-900/60 via-slate-900/80 to-slate-950/90`).
2. **معيار بطاقات البينتو التلخيصية (Header Bento Cards Standard):**
   * كل صفحة داخل محرك الإعدادات يجب أن تحتوي في ترويستها العلوية (`PageHeader`) على شبكة متوازنة مكونة من 4 بطاقات بينتو زجاجية مدمجة (`HeaderBentoCard`) تلخص المقاييس الحيوية (Infrastructure, Records, Security Status, Active Sessions, Auto-Logout).
   * يُمنع استخدام كتل إحصائية مكررة أو معزولة أسفل الهيدر إذا كانت بطاقات البينتو تؤدي نفس الغرض التلخيصي.

#### 🔍 الفصل السادس عشر: دستور الفلترة الموحد وشريط البحث المركزي (Unified Filter Component & Central Header Search Constitution)
لتفادي تشتت آليات البحث والفلترة وضمان تجربة سلسة ومتطابقة عبر مختبرات ومحركات النظام:
1. **ترتيب عناصر ترويسة مساحة العرض اليمنى (Right Pane Header Order):**
   * **اليمين (RTL):** بادج نصي واضح يوضح عدد العناصر النشطة أو المعروضة (`Total Results / Counter`) بخط أحادي `font-mono`.
   * **الوسط (Central Search & Filter):** يتموضع شريط البحث في الوسط ويجاوره زر الفلتر الموحد `UnifiedFilterButton` مع حقول إدخال غائرة ومريحة للعين.
   * **اليسار:** أزرار تبديل العرض (Table vs Cards) والإجراءات السريعة.
2. **دستور البطاقة اليسرى لشريط البحث والتحكم:**
   * في القوائم الجانبية والمختبرات، يكون شريط البحث **دائماً أسفل** قائمة الأزرار الرئيسية للتبويب أو التصفية لتأمين تسلسل هرمي منطقي (من العام إلى الفرز الخاص).
3. **زر الفلتر الموحد (Unified Filter Component Standard):**
   * اعتماد نفس النمط التصميمي المتبع في جداول مناطق الإنتاج والمختبرات (`UnifiedFilterButton` مع بادج المؤشر النشط وقائمة منسدلة زجاجية محكمة التباين).

#### 💎 الفصل السابع عشر: معايير أيقونات الشريط الجانبي والنقاء البصري (Clean Glass Portal Sidebar & Icon Constitution)
1. **نقاء ونظافة الشريط الجانبي (Clean Sidebar Structure):**
   * يُمنع منعاً باتاً وضع فواصل عشوائية، خطوط أفقية، أو نصوص تصنيفية داخل قائمة أيقونات الشريط الجانبي للمحركات (`PortalSidebar`).
   * يجب أن تتدفق الأيقونات بشكل نقي ومتسلسل عمودياً دون انقطاع لتجنب تشويه التناسق البصري للهيكل الزجاجي.
2. **تصميم الصندوق الزجاجي المتوهج للأيقونات النشطة (Clean Glass Glow Icon Standard):**
   * **إلغاء الشرائط الجانبية الملتصقة:** يُمنع تماماً استخدام شرائط أو خطوط إضافية على حافة الزر (`No indicator pills/sidebars`).
   * **الصندوق الكريستالي النقي (Clean Crystal Box):** عند تحديد الأيقونة (`isActive`)، تلتف الأيقونة بصندوق زجاجي متكامل ونقي دون أي زوائد:
     * خلفية زجاجية معتمة بحدود كريستالية: `bg-white/10 text-white border border-white/20 shadow-lg shadow-black/50 backdrop-blur-xl rounded-xl`.
     * تدرج إضاءة ناعم داخلي: `absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30 pointer-events-none`.
     * إضاءة وتكبير الأيقونة بلونها الدلالي: `scale-110 ${colorClass || 'text-cyan-400'}` مع تأثير تحويم سلس.
3. **الكود المرجعي الموثق لمكون الأيقونة (`PortalSidebarItem`):**
```tsx
import React from 'react';
import { cn } from '@/shared/utils';

interface PortalSidebarItemProps {
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  title?: string;
  colorClass?: string;
}

export function PortalSidebarItem({ icon, isActive, onClick, title, colorClass }: PortalSidebarItemProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "w-11 h-11 relative flex items-center justify-center transition-all duration-300 group rounded-xl active:scale-95 font-sans z-10 overflow-hidden",
        isActive 
          ? `bg-white/10 text-white border border-white/20 shadow-lg shadow-black/50 backdrop-blur-xl` 
          : `bg-transparent text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10`
      )}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30 pointer-events-none" />
      )}

      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { 
        className: cn(
          "w-5 h-5 transition-all duration-300 relative z-10", 
          isActive ? `scale-110 ${colorClass || 'text-cyan-400'}` : "group-hover:scale-110 opacity-75 group-hover:opacity-100"
        ) 
      })}
    </button>
  );
}
```

#### 🏆 الفصل الثامن عشر: دستور بطاقة الجداول والجدول الذهبي المرجعي (Production Zone Golden Table & Card Standard)
تم اعتماد وتثبيت تصميم بطاقة وجداول **سجل القطاعات (Production Zone / Sector Registry)** كمعيار معماري وهندسي مرجعي مطلق لكافة صفحات وجداول ومختبرات نظام BDR Nexus لما يتميز به من بساطة فائقة، نقاء بصري، مرونة ثنائية العرض (Table vs Cards)، وملاءمته التامة للأعمال الصناعية المكثفة:

1. **الهيكل الخارجي والحاوية (Outer Glass Shell):**
   * **الحاوية الرئيسية:** `GlassCard className="!p-0 border-white/10 overflow-hidden shadow-2xl rounded-3xl h-full flex flex-col bg-[#0a0b10]/95 backdrop-blur-xl relative"`
   * **خط التوقيع العلوي الخافت:** `absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-[theme]-500/30 to-transparent pointer-events-none`

2. **شريط القيادة والتحكم الكريستالي الموحد (Universal Crystal Command Bar):**
   * **الحاوية:** `p-4 md:p-6 border-b border-white/10 bg-white/[0.02] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 relative z-10`
   * **الكتلة التعريفية:** 
     * صندوق الأيقونة: `w-10 h-10 rounded-xl bg-[theme]-500/10 border border-[theme]-500/20 flex items-center justify-center shrink-0`
     * العنوان الرئيسي: `text-sm font-black text-white uppercase tracking-tight`
     * بادج العداد: `px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[theme]-500/15 border border-[theme]-500/30 text-[theme]-300`
     * الوصف المصاحب: `text-[10px] font-bold text-slate-400 uppercase tracking-widest`
   * **شريط الفلاتر وأدوات التحكم (`UnifiedSearchFilter`):**
     * يتضمن البحث السريع وفلاتر الرقائق (`filterGroups` أو `quickTabs`).
     * زر تبديل العرض المزدوج (`extraControls`): `displayMode === 'table'` (أيقونة `Eye`) و `displayMode === 'cards'` (أيقونة `LayoutGrid`).
     * الزر الإستراتيجي الأبيض: `bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-4 py-2.5 text-xs shadow-lg transition-all shrink-0 flex items-center gap-2 cursor-pointer`.

3. **الجدول الكريستالي عالي التباين (Crystal High-Contrast Table Structure):**
   * **رأس الجدول (`<thead>`):** `bg-[#12141d] border-b-2 border-white/15 text-slate-200 font-extrabold uppercase tracking-wider text-[11px] sticky top-0 z-20 backdrop-blur-md shadow-sm`
   * **رؤوس الأعمدة (`<th>`):** `py-4 px-6 text-start font-extrabold` (أو `text-center` للأرقام والحالات).
   * **صفوف البيانات (`<tbody>`):** `divide-y divide-white/5 text-xs text-slate-300 font-medium`.
   * **خطوط الزيبرا المتناوبة (`<tr>`):** `transition-colors duration-150 group text-start cursor-pointer`, `idx % 2 === 0 ? "bg-white/[0.015]" : "bg-white/[0.05]"` مع تحويم بلون المحرك `hover:bg-[theme]-500/15 hover:text-white`.
   * **خلايا الأكواد:** `font-mono font-extrabold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] inline-flex items-center gap-1.5`.

4. **شبكة البطاقات المرنة (Cards Grid View):**
   * شبكة متجاوبة: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 overflow-y-auto custom-scrollbar flex-1`.
   * بطاقة السجل: `titan-card overflow-hidden flex flex-col group relative shadow-none p-0 hover:border-[theme]-500 transition-all duration-300 border border-white/10 bg-[#0a0a0f] rounded-3xl`.
   * مقاييس أسفل البطاقة: `grid grid-cols-2 divide-x divide-white/10 bg-white/[0.02] border-t border-white/10 mt-auto`.

5. **شاشة التوجيه المتقدمة (Registry Guidance State):**
   * عند عدم وجود نتائج أو في الزيارة الأولى، يتم استخدام `RegistryGuidanceState` مع بطاقات الإرشاد ومفاتيح تصفير الفلاتر السريعة.

6. **دستور درج الإدخال المدمج (Inline Accordion Drawer Form Architecture):**
   * **الفلسفة والهدف:** منع استخدام النوافذ المنبثقة (Modals) التي تفصل المستخدم عن سياق العمل الصناعي عند إنشاء أو تعديل السجلات. يتم فتح نموذج الإدخال بسلاسة تامة كدرج أكورديون مطوي مدمج أعلى الجدول مباشرة داخل نفس البطاقة.
   * **بنية الحاوية والحركة (Motion & Surface):**
     * حاوية الحركة: `motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: "easeInOut" }} className="border-b border-white/10 bg-white/[0.02] relative overflow-hidden"`
     * الخط المضيء العلوي: `absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[theme]-500/50 to-transparent`
     * حشوة المحتوى الداخلي: `p-6 md:p-8 relative z-10`
   * **ترويسة الفورم (Drawer Header):**
     * `h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2"`
     * أيقونة الإجراء: `<Activity className="w-4 h-4 text-[theme]-400" />`
     * عنوان واضح مع كود السجل: `إنشاء / تعديل سجل جديد [ID]`
   * **حقول الإدخال (Inputs & Grid):**
     * تقسيم شبكي متجاوب: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5`
     * التسمية العلوية: `label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1"`
     * حقل الإدخال الصناعي: `input / select className="titan-input py-3"` (مع `appearance-none bg-[#0a0a0f] text-white` للقوائم المنسدلة).
   * **أزرار التحكم والإجراءات (Action Buttons):**
     * الحاوية: `flex justify-end items-center gap-3 pt-4 border-t border-white/5 mt-4`
     * زر الإلغاء الشفاف: `button type="button" onClick={handleCancel} className="bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/10 font-bold rounded-xl px-5 py-2.5 text-xs transition-all"`
     * زر الحفظ/التأكيد الإستراتيجي الأبيض: `button type="submit" className="bg-white text-slate-950 hover:bg-slate-200 font-extrabold rounded-xl px-6 py-2.5 text-xs shadow-lg transition-all flex items-center gap-2"`

#### 🌲 الفصل التاسع عشر: دستور القائمة الشجرية ذات الأدراج الكريستالية المركبة (Crystal Nested Drawer Tree Constitution)
يحدد هذا الفصل المعيار المعماري المعتمد والمثبت لمكون القائمة الشجرية الهرمية في البطاقة اليسرى (`LabHierarchicalSidebar`) لكافة مختبرات ومحركات BDR Nexus:

1. **هيكلية الأدراج المتداخلة (Accordion Nested Drawer Architecture):**
   * **إلغاء الخطوط العمودية المتفرعة (No Side Branch Lines):** يُمنع استخدام خطوط التفرع الجانبية التقليدية (`border-s-2`) لصالح نظام الأدراج التراكمية النظيفة (Drawer Shells).
   * **حاوية درج العائلة (Level 1 Expanded Drawer):** عند توسيع العائلة، تفتح كحاوية متكاملة بحدود كريستالية عالية التباين (`bg-black/40 border border-white/25 p-2 space-y-2 rounded-2xl shadow-xl`).
   * **حاوية درج القوالب (Level 2 Expanded Drawer):** عند توسيع القالب لعرض الموديلات، يفتح كدرج فرعي محاط بإطار ناصع التباين (`bg-black/50 border border-white/25 p-2 space-y-1.5 rounded-xl shadow-lg`).

2. **استدامة النشاط والتحديد الهرمي الصاعد (Upward Active Propagation):**
   * عند تحديد قالب فرعي أو موديل (`Blueprint`)، تظل العائلة والقالب الأب في حالة نشطة (`isFamilyActive`, `isTemplateActive`) مع إبقاء حدودها الكريستالية وشريط الإضاءة المضيء (`indicatorStrip`) متوهجاً طالما أن الفرع مفتوح.

3. **دستور المستويات الثلاثة وتوزيع الألوان والأيقونات (3-Tier Visual Standard):**
   * **المستوى الأول (العائلة - Families):**
     * الأيقونة: مطفأة ومحايدة في حالة السكون (`bg-white/5 border-white/10 text-slate-400`). عند التحديد أو النشاط تضيء بلون المحرك الأصلي (`theme.iconSelectedBg` / `theme.iconSelectedText`).
     * السهم (Chevron): عند فتح الدرج يتحول إلى لون نيون المحرك النشط (`theme.accentText bg-white/10 font-bold`).
     * شريط التحديد المضيء (`indicatorStrip`) على الحافة اليسرى للبطاقة.
   * **المستوى الثاني (قوالب المواصفات - Spec Templates):**
     * ترويسة القسم: نص أبيض صريح عالي التباين بدون نقاط تشتيت (`SPEC TEMPLATES` مع `text-white font-extrabold uppercase tracking-widest text-[10px]`).
     * الأيقونة: أيقونة الطبقات `Layers`، مطفأة عند السكون، وتضيء باللون الأصفر/العنبري الناصع عند التحديد (`bg-amber-500/20 border-amber-500/40 text-amber-300`).
     * السهم (Chevron): يتحول للون المحرك عند التوسيع.
   * **المستوى الثالث (الموديلات والبصمات - Spec Blueprints):**
     * ترويسة القسم: نص أبيض صريح عالي التباين (`SPEC BLUEPRINTS` مع `text-white font-extrabold uppercase tracking-widest text-[10px]`).
     * الأيقونة التسلسلية: بادج رقمي تسلسلي مربع يوضح ترتيب الموديل (`1`, `2`, `3`...) لمنع الالتباس البصري (`w-5 h-5 rounded-md font-mono text-[10px]`) يضيء باللون الأزرق المائي عالي التباين عند التحديد (`bg-blue-500/20 border-blue-500/40 text-blue-300`).
     * نقطة الحالة المادية للمخزون (Physical Stock Dot) خضراء للقطع المتوفرة ورمادية للقطع غير المفعلة.

4. **ثبات الأحجام والمقروئية الصناعية (Consistent Industrial Sizing):**
   * توحيد أحجام الخطوط عبر المستويات الثلاثة (`text-xs font-bold text-white`) دون تصغير الخطوط مع زيادة العمق.
   * استخدام خط أحادي `font-mono` واضح للأكواد التسلسلية وعدادات العناصر باللغة الإنجليزية (`X Templates`, `X Models`).

5. **الكود المرجعي لتطبيق هيكل الشجرة (`LabHierarchicalSidebar.tsx` Snippet):**
```tsx
{/* Level 1: Family Expanded Drawer */}
<div className={cn(
  "rounded-2xl transition-all duration-200 border",
  isFamilyExpanded 
    ? "bg-black/40 border-white/25 p-2 space-y-2 shadow-xl" 
    : "bg-transparent border-transparent space-y-0"
)}>
  {/* Family Card */}
  <div className={cn(
    "group relative w-full flex items-center justify-between p-3 rounded-xl border transition-all text-xs font-bold cursor-pointer text-start",
    isFamilyActive 
      ? "bg-white/10 border-white/25 text-white font-extrabold shadow-md"
      : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06] hover:text-white hover:border-white/20"
  )}>
    {isFamilyActive && <div className="absolute top-2.5 bottom-2.5 w-1 rounded-full left-1 bg-white" />}
    {/* Left Icon + Info */}
    ...
  </div>

  {/* Level 2: Templates Sub-Drawer */}
  {isFamilyExpanded && (
    <div className="space-y-2 pt-1 px-1">
      <div className="text-[10px] font-extrabold text-white uppercase tracking-widest">SPEC TEMPLATES</div>
      ...
    </div>
  )}
</div>
```

#### 🎨 الفصل العشرون: معايير أيقونات العائلات والقوالب والمخططات المعمارية (Family, Template & Blueprint Icon Standard)
يُحدد هذا الفصل المعيار المعماري المعتمد والموحد لاختيار واستخدام أيقونات مكتبة `lucide-react` عبر جميع الكتالوجات والمختبرات والبطاقات في نظام BDR Nexus:

1. **أيقونات العائلات (Family Icons):**
   * **`Shapes`**: الأيقونة الرئيسية والافتراضية لعائلات المكونات (`Component Family`).
   * **`Layers`**: تُستخدم لعائلات الآلات والمعدات (`Machine Family`).

2. **أيقونات القوالب (Templates Icons):**
   * **`Component`**: الأيقونة الرسمية لقوالب المكونات وعناصر النظام (`Component Template`).
   * **`Box`**: تُستخدم للتعبير عن عناصر وقوالب المكونات الفردية (`Part / Individual Template`).
   * **`Cpu`**: تُستخدم لقوالب الآلات والأنظمة الفرعية (`Subsystem / Machine Template`).

3. **أيقونات المخططات المعمارية (Blueprint Icons):**
   * **`FileCode`**: الأيقونة الأساسية والافتراضية لبطاقات المخطط المعماري (`Blueprint Card`).
   * **`Compass`**: تُستخدم للتعبير عن الهندسة والتصميم الهندسي والمواصفات المعمارية (`Engineering & Architecture`).
   * **`Drafts`**: تُستخدم للرسومات والتصاميم المبدئية والمسودات المعمارية (`Drafts & Sketches`).

4. **الاستدعاء القياسي عبر العناصر المشتركة:**
   * يتم استيرادها واستخدام المكون المشترك الموحد `src/shared/constants/icons.ts` لضمان التناسق البصري والأداء الهيكلي بدون تشتت عبر كافة محركات BDR Nexus.

#### 🏛️ الفصل الحادي والعشرون: معايير أيقونات صفحات المختبر وقسم المعماري (Architect & Lab Pages Icon Standard)
يُحدد هذا الفصل معيار الأيقونات الرسمي الموصى به لصفحات المختبرات (Lab Pages) وقسم المهندس المعماري الهندسي (Architect Section) عبر كافة صفحات وتطبيقات BDR Nexus:

1. **`DraftingCompass`**: الأيقونة الأساسية والأكثر تعبيراً عن التخطيط المعماري والتصميم الهندسي الدقيق والرسم الفني للمكونات والآلات.
2. **`Ruler`**: تُستخدم في أدوات القياس، ضبط الأبعاد الهندسية، والخيارات والمواصفات المعيارية.
3. **`Building2`**: تُستخدم للتعبير عن بناء الهياكل، تصميم المنشآت الصناعية، والمخططات الهيكلية الكبرى (Industrial Structures & Subsystems).
4. **`HardHat`**: تُستخدم للتعبير عن عمليات البناء والإنشاءات الميدانية والصيانة التطبيقية للأنظمة الهندسية.

**التعميم البرمجي:**
يتم توثيق واستدعاء هذه الأيقونات مركزياً من السجل الموحد `src/shared/constants/icons.ts` لتسهيل الاستخدام المتناسق والتطبيق الشامل في كافة صفحات وحواضن المختبرات (Engineering Lab, Components Lab, Parts Catalog Lab).


#### ❄️ الفصل الثاني والعشرون: معيار الغلاف الزجاجي الضبابي (FrostCard Wrapper Standard)
يُحدد هذا الفصل المعيار البصري لبطاقات المحتوى والتغليف الزجاجي الضبابي (Frosted Glass Effect) عبر كافة بطاقات وواجهات نظام BDR Nexus، لتعزيز عمق الـ 3D والتباين في واجهات المستخدم الصناعية العالية الجودة (Crystal High-Contrast Glass).

**1. التصميم الزجاجي والمواد (Glassmorphism & Materials):**
   * **الخلفية العميقة:** يتم الاعتماد على `bg-[#0a0a0f]/60` كخلفية شبه شفافة لتشكيل زجاج داكن وناعم.
   * **الحدود العاكسة للضوء:** حدود دقيقة خفيفة `border-white/10` تحاكي انعكاس الضوء على أطراف الزجاج.
   * **الضبابية والانعكاس (Backdrop Blur):** يُستخدم `backdrop-blur-xl` لإحداث ضبابية قوية وخلفية ناعمة للغاية لما يقع خلف البطاقة.
   * **الظلال الكريستالية:** ظلال متناسقة `shadow-2xl` لتعطي عمقاً بصرياً (3D Effect) حقيقياً تفصل البطاقة عن الخلفية العميقة للصفحة.

**2. التفاعلية والانتقالات السلسة (Hover & Interactive Effects):**
   * **التوهج والإضاءة الناعمة:** تتوفر إضاءة حواف عند التحويم `hover:border-white/20` ولمسة ضوئية للخلفية `hover:bg-white/[0.02]`.
   * **الطفو المغناطيسي (Magnetic Lift):** ارتفاع خفيف وناعم للبطاقة للأعلى بمقدار نصف بكسل `hover:-translate-y-0.5` لإعطاء شعور بالخفة.

**3. التعميم والمكون المشترك:**
   * تم توثيق وتعميم هذا المعيار عبر المكون المشترك الشامل `src/shared/components/FrostCard.tsx` ليُستخدم كحاوية مرنة وشاملة (Wrapper Component) لغلاف أي محتوى داخلي (نصوص، أزرار، نماذج، بطاقات إحصائيات) ليأخذ الشكل الزجاجي الفاخر تلقائياً.