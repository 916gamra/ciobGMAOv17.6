import React from 'react';

export interface WizardStepConfig {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  isOptional?: boolean;
}

export interface WizardFormData {
  name: string;
  code: string;
  familyId: string;
  category: string;
  voltage: string;
  description: string;
  notes: string;
  manufacturer?: string;
  powerOrForce?: string;
  subsystems?: string[];
  unit?: string;
}

export interface WizardContextType {
  steps: WizardStepConfig[];
  currentStepIndex: number;
  formData: WizardFormData;
  isSubmitting: boolean;
  engineTheme?: "indigo" | "cyan" | "amber" | "emerald" | "orange";
  goToStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateFormData: (data: Partial<WizardFormData>) => void;
  submitForm: () => Promise<void>;
  resetWizard: () => void;
}
