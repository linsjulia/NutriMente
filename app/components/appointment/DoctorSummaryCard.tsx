import React from 'react';

interface DoctorSummaryCardProps {
  doctorName?: string;
  specialty?: string;
  date?: string;
  time?: string;
  modality?: string;
  price?: string;
  serviceFee?: string;
  totalPrice?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  showTotalRow?: boolean;
}

export const DoctorSummaryCard: React.FC<DoctorSummaryCardProps> = ({
  doctorName = 'Dra. Marina Alves',
  specialty = 'Nutricionista',
  date = '23 out 2026',
  time = '14:00',
  modality = 'Online',
  price = 'R$ 150,00',
  serviceFee,
  totalPrice,
  buttonLabel = 'Continuar →',
  onButtonClick,
  showTotalRow = false,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full">
      <div className="space-y-6">
        {/* Perfil */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-sky-400 text-white font-bold flex items-center justify-center text-sm">
            MA
          </div>
          <div>
            <h4 className="font-bold text-gray-800">{doctorName}</h4>
            <p className="text-xs text-gray-400">{specialty}</p>
          </div>
        </div>

        {/* Detalhes */}
        <div className="space-y-3 text-sm border-t border-dashed border-gray-100 pt-4">
          <div className="flex justify-between items-center text-gray-500">
            <span>Data</span>
            <span className="font-bold text-gray-800">
              {date} {showTotalRow ? `• ${time}` : ''}
            </span>
          </div>

          {!showTotalRow && (
            <div className="flex justify-between items-center text-gray-500">
              <span>Horário</span>
              <span className="font-bold text-gray-800">{time}</span>
            </div>
          )}

          {!showTotalRow && (
            <div className="flex justify-between items-center text-gray-500">
              <span>Modalidade</span>
              <span className="font-bold text-gray-800">{modality}</span>
            </div>
          )}

          {showTotalRow && (
            <div className="flex justify-between items-center text-gray-500">
              <span>Consulta (50 min)</span>
              <span className="font-bold text-gray-800">{price}</span>
            </div>
          )}

          {serviceFee && (
            <div className="flex justify-between items-center text-gray-500">
              <span>Taxa de serviço</span>
              <span className="font-bold text-emerald-500">{serviceFee}</span>
            </div>
          )}

          {!showTotalRow ? (
            <div className="flex justify-between items-center text-gray-500 pt-2 border-t border-dashed border-gray-100">
              <span>Valor</span>
              <span className="font-bold text-blue-900 text-base">{price}</span>
            </div>
          ) : (
            <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-100">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-bold text-blue-900 text-lg">{totalPrice}</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onButtonClick}
        className={`w-full mt-6 py-3 px-4 rounded-xl font-bold text-white transition-opacity ${
          showTotalRow
            ? 'bg-emerald-500 hover:bg-emerald-600'
            : 'bg-blue-800 hover:bg-blue-900'
        }`}
      >
        {buttonLabel}
      </button>
    </div>
  );
};