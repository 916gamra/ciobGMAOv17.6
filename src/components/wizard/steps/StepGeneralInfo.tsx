import React from 'react';
import { useWizard } from '../WizardContext';
import { useTranslation } from 'react-i18next';

export function StepGeneralInfo() {
  const { t } = useTranslation();
  const { formData, updateFormData } = useWizard();

  return (
    <div className="space-y-4 max-w-xl animate-in fade-in-50 duration-300 text-start">
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">
          {t('wizard.nameLabel', 'اسم الآلة / المكون / الطراز')}
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          placeholder={t('wizard.namePlaceholder', 'مثال: وحدة حقن هيدروليكية 500 طن')}
          className="w-full h-11 px-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">
          {t('wizard.codeLabel', 'الرمز التعريفي (Code / ID)')}
        </label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => updateFormData({ code: e.target.value })}
          placeholder={t('wizard.codePlaceholder', 'مثال: MCH-INJ-001')}
          className="w-full h-11 px-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-sm font-mono text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">
          {t('wizard.manufacturerLabel', 'الشركة المصنعة / العلامة التجارية')}
        </label>
        <input
          type="text"
          value={formData.manufacturer || ''}
          onChange={(e) => updateFormData({ manufacturer: e.target.value })}
          placeholder={t('wizard.manufacturerPlaceholder', 'مثال: Siemens, Rexroth, Schneider...')}
          className="w-full h-11 px-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none"
        />
      </div>
    </div>
  );
}
