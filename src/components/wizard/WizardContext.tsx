import React, { createContext, useContext, useState } from 'react';
import { WizardStepConfig, WizardFormData, WizardContextType } from './types';

const WizardContext = createContext<WizardContextType | undefined>(undefined);

const initialFormData: WizardFormData = {
  name: '',
  code: '',
  familyId: '',
  category: '',
  voltage: '380V',
  description: '',
  notes: '',
  manufacturer: '',
  powerOrForce: '',
  subsystems: [],
  unit: 'PCS',
};

export function WizardProvider({
  steps,
  initialData,
  onComplete,
  engineTheme = "indigo",
  children,
}: {
  steps: WizardStepConfig[];
  initialData?: Partial<WizardFormData>;
  onComplete?: (data: WizardFormData) => Promise<void> | void;
  engineTheme?: "indigo" | "cyan" | "amber" | "emerald" | "orange";
  children: React.ReactNode;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>({
    ...initialFormData,
    ...initialData,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
    }
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      submitForm();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const updateFormData = (data: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const resetWizard = () => {
    setFormData({ ...initialFormData, ...initialData });
    setCurrentStepIndex(0);
  };

  const submitForm = async () => {
    if (!onComplete) return;
    try {
      setIsSubmitting(true);
      await onComplete(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WizardContext.Provider
      value={{
        steps,
        currentStepIndex,
        formData,
        isSubmitting,
        engineTheme,
        goToStep,
        nextStep,
        prevStep,
        updateFormData,
        submitForm,
        resetWizard,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}
