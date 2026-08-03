import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, Settings2, Plus, Search,
  Wrench, Zap, Droplets, Wind, Cpu, ShieldAlert,
  MoreVertical, Edit2, Trash2, ChevronRight, Activity, Filter
} from 'lucide-react';
import { useFailureCatalog } from '../hooks/useFailureCatalog';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { cn } from '@/shared/utils';

export function FailureCatalogView() {
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
      await addTemplate(selectedCategoryId, newTemplateName, newTemplateDesc, newTemplateSeverity);
      setNewTemplateName('');
      setNewTemplateDesc('');
      setNewTemplateSeverity('medium');
      setIsAddingTemplate(false);
      showSuccess('تم تسجيل العطل بنجاح');
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

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-slate-200">
      {/* Header */}
      <header className="shrink-0 p-8 border-b border-white/5 bg-white/[0.02]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tighter flex items-center gap-3 font-sans">
              <AlertTriangle className="w-8 h-8 text-orange-500" /> كتالوج الأعطال (Failure Catalog)
            </h1>
            <p className="text-slate-400 max-w-2xl text-base opacity-80 mt-2">
              بناء وإدارة شجرة الأعطال والمشاكل حسب العائلات الصناعية (ميكانيك، كهرباء، هيدروليك...) لتسهيل إدخال تدخلات الصيانة العلاجية.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsAddingCategory(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 hover:border-white/20 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة عائلة جديدة</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        
        {/* Left Sidebar - Categories */}
        <div className="w-80 border-r border-white/5 bg-white/[0.01] flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">العائلات (Disciplines)</h3>
            
            <div className="space-y-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-sm font-semibold",
                    selectedCategoryId === cat.id 
                      ? "bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                      : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      selectedCategoryId === cat.id ? "bg-orange-500/20" : "bg-white/5"
                    )}>
                      {cat.name.includes('Mécanique') ? <Wrench className="w-4 h-4" /> :
                       cat.name.includes('Électrique') ? <Zap className="w-4 h-4" /> :
                       cat.name.includes('Hydraulique') ? <Droplets className="w-4 h-4" /> :
                       cat.name.includes('Pneumatique') ? <Wind className="w-4 h-4" /> :
                       cat.name.includes('Électronique') ? <Cpu className="w-4 h-4" /> :
                       <Settings2 className="w-4 h-4" />}
                    </div>
                    <span>{cat.name}</span>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform",
                    selectedCategoryId === cat.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                  )} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content - Failure Templates */}
        <div className="flex-1 bg-black/20 overflow-y-auto custom-scrollbar p-8">
          {selectedCategory ? (
            <div className="max-w-5xl mx-auto">
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                    <span className="text-orange-400">{selectedCategory.name}</span>
                    <span className="text-slate-500 text-base font-normal">- قائمة الأعطال المحتملة</span>
                  </h2>
                  <p className="text-sm text-slate-400">عدد الأعطال المسجلة: {templates.filter(t => t.categoryId === selectedCategory.id).length}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      placeholder="بحث في الأعطال..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                    />
                  </div>
                  <button 
                    onClick={() => setIsAddingTemplate(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة عطل</span>
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
                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all text-sm font-semibold"
                  >
                    إضافة العطل الأول
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {filteredTemplates.map(template => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-orange-500/30 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 pointer-events-none transition-all" />
                        
                        <div className="flex items-start justify-between relative z-10">
                          <div>
                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-orange-400 transition-colors">
                              {template.name}
                            </h3>
                            {template.description && (
                              <p className="text-sm text-slate-400 line-clamp-2">{template.description}</p>
                            )}
                            
                            <div className="mt-4 flex items-center gap-2">
                              <span className={cn(
                                "px-2.5 py-1 rounded-md text-xs font-bold border",
                                template.severity === 'critical' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                template.severity === 'high' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                template.severity === 'medium' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              )}>
                                {template.severity?.toUpperCase() || 'MEDIUM'}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={async () => {
                              if (window.confirm('هل أنت متأكد من حذف هذا العطل؟')) {
                                await deleteTemplate(template.id);
                                showSuccess('تم حذف العطل');
                              }
                            }}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-slate-500">اختر عائلة من القائمة الجانبية لعرض الأعطال</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      <AnimatePresence>
        {isAddingCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0f111a] border border-white/10 rounded-2xl shadow-2xl p-6"
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
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50"
                    placeholder="مثال: ميكانيك، هيدروليك..."
                  />
                </div>
                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-400 text-black rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                  >
                    إضافة
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0f111a] border border-orange-500/30 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500/0 via-orange-500 to-orange-500/0" />
              
              <h3 className="text-xl font-bold text-white mb-2">تسجيل عطل جديد</h3>
              <p className="text-sm text-slate-400 mb-6">
                ضمن عائلة: <strong className="text-orange-400">{selectedCategory?.name}</strong>
              </p>

              <form onSubmit={handleAddTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">اسم العطل (Symptom / Problem)</label>
                  <input
                    type="text"
                    required
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50"
                    placeholder="مثال: Fuite d'huile, Manque de phase..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">وصف إضافي (اختياري)</label>
                  <textarea
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 h-24 resize-none"
                    placeholder="تفاصيل إضافية حول هذا العطل لتوجيه الفني..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">مستوى الخطورة الافتراضي</label>
                  <select
                    value={newTemplateSeverity}
                    onChange={(e) => setNewTemplateSeverity(e.target.value as any)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50"
                  >
                    <option value="low">منخفض (Low)</option>
                    <option value="medium">متوسط (Medium)</option>
                    <option value="high">عالي (High)</option>
                    <option value="critical">حرج (Critical)</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-8 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddingTemplate(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-400 text-black rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>حفظ العطل</span>
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
