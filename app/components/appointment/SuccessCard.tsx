import React from 'react';

export const SuccessCard: React.FC = () => {
  return (
    <div className="flex flex-col items-center max-w-xl mx-auto text-center space-y-6 py-6">
      {/* Ícone de Sucesso */}
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
        <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          ✓
        </div>
      </div>

      {/* Mensagem Principal */}
      <div>
        <h2 className="text-2xl font-extrabold text-blue-900">
          Consulta agendada com sucesso!
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Enviamos a confirmação para seu e-mail e WhatsApp.
        </p>
      </div>

      {/* Card com Detalhes da Consulta */}
      <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-left space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-sky-400 text-white font-bold flex items-center justify-center text-sm">
              MA
            </div>
            <div>
              <h4 className="font-bold text-gray-800">Dra. Marina Alves</h4>
              <p className="text-xs text-gray-400">Nutricionista • Videochamada</p>
            </div>
          </div>
          <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
            Confirmada
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-sky-50 rounded-xl p-3">
            <span className="text-xs text-gray-400 block">Data</span>
            <span className="font-bold text-blue-900 text-sm">Sex, 23 out 2026</span>
          </div>
          <div className="bg-sky-50 rounded-xl p-3">
            <span className="text-xs text-gray-400 block">Horário</span>
            <span className="font-bold text-blue-900 text-sm">14:00 – 14:50</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 flex items-center pt-2">
          <span className="mr-1.5">🔔</span> O link da sala é liberado 10 minutos antes do horário.
        </p>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button className="flex-1 py-3 px-4 bg-blue-800 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
          Ver minhas consultas
        </button>
      </div>
    </div>
  );
};