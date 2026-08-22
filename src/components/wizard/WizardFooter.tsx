import React from 'react';
import { ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { useWizard } from './WizardContext';
import { useTranslation } from 'react-i18next';

export function WizardFooter({ onCancel }: { onCancel?: () => void }) {
  const { t } = useTranslation();
  const { currentStepIndex, steps, nextStep, prevStep, isSubmitting } = useWizard();
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <div className="p-4 md:p-6 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3 text-start">
      <div>
        {currentStepIndex === 0 ? (
          onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              {t('common.cancel', 'إلغاء')}
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={prevStep}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <ChevronRight className="mr-1.5 rtl:mr-0 rtl:ml-1.5 h-4 w-4" />
            {t('common.prev', 'السابق')}
          </button>
        )}
      </div>

      <div>
        {!isLastStep ? (
          <button
            type="button"
            onClick={nextStep}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-extrabold bg-white text-slate-950 hover:bg-slate-200 shadow-md shadow-white/10 transition-all active:scale-95 cursor-pointer"
          >
            {t('common.next', 'التالي')}
            <ChevronLeft className="ml-1.5 rtl:ml-0 rtl:mr-1.5 h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={nextStep}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-xs font-extrabold bg-white text-slate-950 hover:bg-slate-200 shadow-lg shadow-white/10 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Save className="mr-2 rtl:mr-0 rtl:ml-2 h-4 w-4" />
            {isSubmitting ? t('common.saving', 'جاري الحفظ...') : t('common.saveAndConfirm', 'حفظ واعتماد')}
          </button>
        )}
      </div>
    </div>
  );
}
