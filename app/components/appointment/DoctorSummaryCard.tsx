import React from 'react';
import Image from 'next/image';

interface DoctorSummaryCardProps {
  doctorName: string;
  photoUrl: string | null;
  specialty: string;
  /** Ex.: "quinta-feira, 23 de outubro" (vazio enquanto não escolheu) */
  date?: string;
  time?: string;
  modality?: string;
  /** Já formatado ("R$ 150,00" ou "A combinar") */
  price: string;
  /** Botão ou formulário de envio (opcional) */
  button?: React.ReactNode;
}

export const initials = (name: string) =>
  name.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export const DoctorSummaryCard: React.FC<DoctorSummaryCardProps> = ({
  doctorName,
  photoUrl,
  specialty,
  date,
  time,
  modality,
  price,
  button,
}) => {
  return (
    <aside aria-label="Resumo do agendamento" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          {photoUrl ? (
            <Image src={photoUrl} alt="" width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div aria-hidden className="w-12 h-12 rounded-full bg-sky-700 text-white font-bold flex items-center justify-center text-sm">
              {initials(doctorName)}
            </div>
          )}
          <div>
            <p className="font-bold text-gray-800">{doctorName}</p>
            <p className="text-xs text-gray-600">{specialty}</p>
          </div>
        </div>

        <dl className="space-y-3 text-sm border-t border-dashed border-gray-200 pt-4">
          <div className="flex justify-between items-center gap-4 text-gray-600">
            <dt>Data</dt>
            <dd className="font-bold text-gray-800 text-right first-letter:uppercase">{date || '—'}</dd>
          </div>
          <div className="flex justify-between items-center gap-4 text-gray-600">
            <dt>Horário</dt>
            <dd className="font-bold text-gray-800">{time || '—'}</dd>
          </div>
          <div className="flex justify-between items-center gap-4 text-gray-600">
            <dt>Modalidade</dt>
            <dd className="font-bold text-gray-800">{modality || '—'}</dd>
          </div>
          <div className="flex justify-between items-center gap-4 text-gray-600 pt-2 border-t border-dashed border-gray-200">
            <dt>Valor</dt>
            <dd className="font-bold text-blue-900 text-base">{price}</dd>
          </div>
        </dl>
        <p className="text-xs text-gray-600">O pagamento é combinado direto com o profissional.</p>
      </div>

      {button && <div className="mt-6">{button}</div>}
    </aside>
  );
};
