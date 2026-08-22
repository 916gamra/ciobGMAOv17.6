import React from 'react';
import { Sparkles } from 'lucide-react';
import { useWizard } from '../WizardContext';
import { useTranslation } from 'react-i18next';

export function StepReview() {
  const { t } = useTranslation();
  const { formData } = useWizard();

  return (
    <div className="space-y-4 max-w-xl animate-in fade-in-50 duration-300 text-start">
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-indigo-400 shrink-0" />
        <div>
          <h5 className="font-extrabold text-sm text-white">
            {t('wizard.readyToApprove', 'جاهز للاعتماد النهائي')}
          </h5>
          <p className="text-xs text-slate-300">
            {t('wizard.readyToApproveDesc', 'يرجى مراجعة البيانات الفنية أدناه قبل الحفظ النهائي في قاعدة البيانات.')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs">
        <div>
          <span className="text-slate-400">{t('wizard.nameLabelShort', 'الاسم:')}</span>
          <p className="font-bold text-white text-sm mt-0.5">{formData.name || t('wizard.unspecified', 'غير محدد')}</p>
        </div>
        <div>
          <span className="text-slate-400">{t('wizard.codeLabelShort', 'الرمز:')}</span>
          <p className="font-bold font-mono text-white text-sm mt-0.5">{formData.code || t('wizard.unspecified', 'غير محدد')}</p>
        </div>
        <div>
          <span className="text-slate-400">{t('wizard.manufacturerLabelShort', 'الشركة المصنعة:')}</span>
          <p className="font-semibold text-slate-200 text-sm mt-0.5">{formData.manufacturer || '-'}</p>
        </div>
        <div>
          <span className="text-slate-400">{t('wizard.voltageLabelShort', 'التغذية الكهربائية:')}</span>
          <p className="font-semibold text-slate-200 text-sm mt-0.5">{formData.voltage}</p>
        </div>
        {formData.powerOrForce && (
          <div className="col-span-2">
            <span className="text-slate-400">{t('wizard.powerLabelShort', 'القدرة / الطاقة:')}</span>
            <p className="font-semibold text-slate-200 text-sm mt-0.5">{formData.powerOrForce}</p>
          </div>
        )}
        {formData.notes && (
          <div className="col-span-2 pt-2 border-t border-white/5">
            <span className="text-slate-400">{t('wizard.notesLabelShort', 'ملاحظات التشغيل والصيانة:')}</span>
            <p className="text-slate-300 text-xs mt-0.5 whitespace-pre-wrap">{formData.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
