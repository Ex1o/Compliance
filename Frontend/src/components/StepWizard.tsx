import { ReactNode } from 'react';

interface StepWizardProps {
  totalSteps: number;
  currentStep: number;
  onBack: () => void;
  onContinue: () => void;
  canContinue?: boolean;
  children: ReactNode;
}

const StepWizard = ({ totalSteps, currentStep, onBack, onContinue, canContinue = true, children }: StepWizardProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[560px]">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-body text-muted-foreground">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm font-body font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-card rounded-lg border border-border p-6 md:p-8 shadow-sm">
          {children}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={onBack}
            disabled={currentStep === 1}
            className="px-5 py-2.5 text-sm font-body font-medium rounded-md border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            ← Back
          </button>
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className="px-5 py-2.5 text-sm font-body font-medium rounded-md bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            {currentStep === totalSteps ? 'Build My Calendar →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepWizard;
