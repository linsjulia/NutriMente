"use client"
import React, { useState } from 'react';
import { StepProgress } from '../../components/appointment/StepProgress';
import { CalendarSelector } from '../../components/appointment/CalendarSelector';
import { PaymentForm } from '../../components/appointment/PaymentForm';
import { DoctorSummaryCard } from '../../components/appointment/DoctorSummaryCard';
import { SuccessCard } from '../../components/appointment/SuccessCard';
import { DoctorProfile } from '@/app/components/appointment/DoctorProfile';

type Step = 1 | 2 | 4 | 5;

export default function AppointmentPage() {
  const [currentStep, setCurrentStep] = useState<Step>(2);

const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Exibe o progresso das etapas apenas se ainda não tiver concluído */}
        {currentStep !== 5 && <StepProgress currentStep={currentStep} />}

        {/* Passo 1: Perfil do Profissional */}
        {currentStep === 1 && (
          <DoctorProfile onStartBooking={handleNextStep} />
        )}

        {/* Passo 2: Seleção de Data e Horário */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CalendarSelector />
            </div>
            <div className="lg:col-span-1">
              <DoctorSummaryCard
                buttonLabel="Continuar →"
                onButtonClick={handleNextStep}
              />
            </div>
          </div>
        )}

        {/* Passo 4: Pagamento / Confirmação */}
        {currentStep === 4 && (
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
                onButtonClick={handleNextStep}
              />
            </div>
          </div>
        )}

        {/* Passo 5: Sucesso / Comprovante */}
        {currentStep === 5 && (
          <div className="max-w-4xl mx-auto">
            <SuccessCard />
          </div>
        )}
      </main>
    </div>
  );
};