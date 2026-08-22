import React from 'react';
import { useWizard } from '../WizardContext';
import { useTranslation } from 'react-i18next';

export function StepSpecifications() {
  const { t } = useTranslation();
  const { formData, updateFormData } = useWizard();

  return (
    <div className="space-y-4 max-w-xl animate-in fade-in-50 duration-300 text-start">
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">
          {t('wizard.voltageLabel', 'معدل التغذية الكهربائية (Voltage Rating)')}
        </label>
        <select
          value={formData.voltage}
          onChange={(e) => updateFormData({ voltage: e.target.value })}
          className="w-full h-11 px-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none"
        >
          <option value="380V" className="bg-slate-900">380V Three-Phase AC</option>
          <option value="220V" className="bg-slate-900">220V Single-Phase AC</option>
          <option value="400V" className="bg-slate-900">400V Industrial AC</option>
          <option value="24V" className="bg-slate-900">24V Industrial DC</option>
          <option value="N/A" className="bg-slate-900">{t('wizard.noneMechanical', 'غير منطبق (ميكانيكي / هيدروليكي صرف)')}</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">
          {t('wizard.powerLabel', 'القدرة التشغيلية / القوة (Power / Capacity)')}
        </label>
        <input
          type="text"
          value={formData.powerOrForce || ''}
          onChange={(e) => updateFormData({ powerOrForce: e.target.value })}
          placeholder={t('wizard.powerPlaceholder', 'مثال: 45 kW / 250 Bar / 1500 RPM')}
          className="w-full h-11 px-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">
          {t('wizard.notesLabel', 'ملاحظات التشغيل والصيانة الوقائية')}
        </label>
        <textarea
          rows={3}
          value={formData.notes}
          onChange={(e) => updateFormData({ notes: e.target.value })}
          placeholder={t('wizard.notesPlaceholder', 'أدخل أي متطلبات فنية أو فترات تزييت وتشحيم خاصة...')}
          className="w-full p-3 rounded-xl bg-slate-950/80 border border-white/10 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none resize-none"
        />
      </div>
    </div>
  );
}
