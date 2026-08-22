import React from 'react';
import { Layers, Settings, FileCheck } from 'lucide-react';
import { WizardProvider, useWizard } from './WizardContext';
import { WizardHeader } from './WizardHeader';
import { WizardFooter } from './WizardFooter';
import { StepGeneralInfo } from './steps/StepGeneralInfo';
import { StepSpecifications } from './steps/StepSpecifications';
import { StepReview } from './steps/StepReview';
import { WizardStepConfig, WizardFormData } from './types';

const STEPS: WizardStepConfig[] = [
  { id: 'general', title: 'المعلومات العامة', subtitle: 'الاسم والرمز والشركة', icon: Layers },
  { id: 'specs', title: 'المواصفات الفنية', subtitle: 'التغذية والقدرة والتشغيل', icon: Settings },
  { id: 'review', title: 'المراجعة والاعتماد', subtitle: 'الفحص والاعتماد النهائي', icon: FileCheck },
];

function WizardBody({ customStepsRenderer }: { customStepsRenderer?: (stepIndex: number) => React.ReactNode }) {
  const { currentStepIndex } = useWizard();

  if (customStepsRenderer) {
    return (
      <div className="p-6 md:p-8 flex-1 min-h-[300px] overflow-y-auto custom-scrollbar">
        {customStepsRenderer(currentStepIndex)}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 flex-1 min-h-[300px] overflow-y-auto custom-scrollbar">
      {currentStepIndex === 0 && <StepGeneralInfo />}
      {currentStepIndex === 1 && <StepSpecifications />}
      {currentStepIndex === 2 && <StepReview />}
    </div>
  );
}

export function ModularWizard({
  steps = STEPS,
  initialData,
  onComplete,
  onCancel,
  engineTheme = "indigo",
  renderStep,
}: {
  steps?: WizardStepConfig[];
  initialData?: Partial<WizardFormData>;
  onComplete?: (data: WizardFormData) => Promise<void> | void;
  onCancel?: () => void;
  engineTheme?: "indigo" | "cyan" | "amber" | "emerald" | "orange";
  renderStep?: (stepIndex: number) => React.ReactNode;
}) {
  return (
    <WizardProvider steps={steps} initialData={initialData} onComplete={onComplete} engineTheme={engineTheme}>
      <div className="w-full max-w-3xl mx-auto rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col transition-all text-start">
        <WizardHeader />
        <WizardBody customStepsRenderer={renderStep} />
        <WizardFooter onCancel={onCancel} />
      </div>
    </WizardProvider>
  );
}
