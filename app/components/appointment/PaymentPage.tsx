import React from 'react';
import { StepProgress } from './StepProgress';
import { PaymentForm } from './PaymentForm';
import { DoctorSummaryCard } from './DoctorSummaryCard';

export const PaymentPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        <StepProgress currentStep={4} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PaymentForm />
          </div>
          <div className="lg:col-span-1">
            <DoctorSummaryCard
              showTotalRow={true}
              serviceFee="Grátis"
              totalPrice="R$ 150,00"
              buttonLabel="Confirmar agendamento"
            />
          </div>
        </div>
      </main>
    </div>
  );
};