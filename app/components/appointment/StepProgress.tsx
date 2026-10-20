import React from 'react';

interface StepProgressProps {
  currentStep: number;
}

const steps = [
  { id: 1, label: 'Profissional' },
  { id: 2, label: 'Data e horário' },
  { id: 4, label: 'Confirmação' },
];

export const StepProgress: React.FC<StepProgressProps> = ({ currentStep }) => {
  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4 flex items-center justify-between">
      {steps.map((step, i) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;

        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center space-x-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-blue-800 text-white'
                    : 'bg-white text-gray-400 border border-gray-200'
                }`}
              >
                {isCompleted ? '✓' : step.id}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  isCurrent || isCompleted ? 'font-bold text-blue-900' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 sm:mx-4 ${
                  step.id < currentStep ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};