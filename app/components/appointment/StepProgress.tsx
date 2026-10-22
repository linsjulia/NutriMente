import React from 'react';

interface StepProgressProps {
  currentStep: number;
}

// Etapas do agendamento (sem pagamento: o valor é combinado com o profissional)
const steps = [
  { id: 1, label: 'Profissional' },
  { id: 2, label: 'Data e horário' },
  { id: 3, label: 'Confirmação' },
];

export const StepProgress: React.FC<StepProgressProps> = ({ currentStep }) => {
  return (
    <ol aria-label="Etapas do agendamento" className="w-full max-w-4xl mx-auto my-6 px-4 flex items-center justify-between">
      {steps.map((step, i) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;

        return (
          <React.Fragment key={step.id}>
            <li className="flex items-center space-x-2" aria-current={isCurrent ? 'step' : undefined}>
              <div
                aria-hidden
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-blue-800 text-white'
                    : 'bg-white text-gray-500 border border-gray-300'
                }`}
              >
                {isCompleted ? '✓' : step.id}
              </div>
              <span
                className={`text-sm ${isCurrent ? 'inline' : 'hidden sm:inline'} ${
                  isCurrent || isCompleted ? 'font-bold text-blue-900' : 'text-gray-600'
                }`}
              >
                <span className="sr-only">Etapa {step.id}: </span>
                {step.label}
                {isCompleted && <span className="sr-only"> (concluída)</span>}
              </span>
            </li>

            {i < steps.length - 1 && (
              <li
                aria-hidden
                className={`flex-1 h-0.5 mx-2 sm:mx-4 list-none ${
                  step.id < currentStep ? 'bg-emerald-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
};
