import React from 'react';

interface DoctorProfileProps {
  onStartBooking: () => void;
}

export const DoctorProfile: React.FC<DoctorProfileProps> = ({ onStartBooking }) => {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-400 flex items-center space-x-1">
        <span className="hover:underline cursor-pointer">Profissionais</span>
        <span>›</span>
        <span className="hover:underline cursor-pointer">Nutrição</span>
        <span>›</span>
        <span className="text-blue-900 font-semibold">Dra. Marina Alves</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna da Esquerda: Detalhes do Perfil */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            {/* Cabeçalho do Perfil */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-400 to-blue-500 text-white font-bold text-2xl flex items-center justify-center shrink-0">
                MA
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-blue-900">Dra. Marina Alves</h2>
                <p className="text-xs text-gray-500">Nutricionista clínica • CRN-3 12345</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="bg-sky-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">Emagrecimento</span>
                  <span className="bg-sky-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">Nutrição esportiva</span>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">Atende online</span>
                </div>
                <div className="text-xs text-gray-600 pt-1 flex items-center space-x-1">
                  <span className="text-amber-400">★</span>
                  <span className="font-bold text-gray-800">4,9</span>
                  <span className="text-gray-400">• 312 avaliações • +1.200 consultas</span>
                </div>
              </div>
            </div>

            {/* Sobre */}
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <h3 className="font-bold text-blue-900 text-base">Sobre</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Atendimento humanizado e baseado em evidências, com foco em reeducação alimentar sem restrições extremas. Planos personalizados e acompanhamento contínuo por vídeo.
              </p>
            </div>

            {/* Como funciona a consulta */}
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <h3 className="font-bold text-blue-900 text-base">Como funciona a consulta</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                  <span className="font-bold text-blue-900 text-sm block">50 min</span>
                  <span className="text-xs text-gray-500">Videochamada segura</span>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <span className="font-bold text-emerald-800 text-sm block">Plano em PDF</span>
                  <span className="text-xs text-gray-500">Enviado após a consulta</span>
                </div>
                <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                  <span className="font-bold text-blue-900 text-sm block">Retorno 30 dias</span>
                  <span className="text-xs text-gray-500">Incluso no valor</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Avaliação do Paciente */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-amber-400 shrink-0">
              <span>★</span>
              <span className="font-bold text-blue-900 text-sm">4,9 de 5</span>
            </div>
            <p className="text-xs text-gray-600 italic">
              “Me senti acolhida desde o primeiro minuto. O plano ficou simples de seguir.” — <span className="font-semibold not-italic text-gray-800">Paciente verificada</span>
            </p>
          </div>
        </div>

        {/* Coluna da Direita: Preço e Botão de Agendamento */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div>
              <span className="text-xs text-gray-400 block">Consulta online</span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-2xl font-extrabold text-blue-900">R$ 150</span>
                <span className="text-xs text-gray-400">/consulta</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 font-medium flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
              <span>Próximo horário: sex, 23 out • 14:00</span>
            </div>

            <button
              onClick={onStartBooking}
              className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              <span>📅</span>
              <span>Agendar consulta</span>
            </button>

            <p className="text-[11px] text-center text-gray-400">
              Cancelamento gratuito até 24h antes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};