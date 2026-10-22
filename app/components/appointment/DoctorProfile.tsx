import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PROFESSION_LABELS, formatCouncilNumber } from '@/app/lib/types';
import type { ProfessionalProfile } from '@/app/lib/agenda';
import { initials } from './DoctorSummaryCard';

interface DoctorProfileProps {
  profile: ProfessionalProfile;
  /** Já formatado ("R$ 150,00" ou "A combinar") */
  price: string;
  /** Ex.: "qui, 23/10 · 14:00" (null se não há horário livre) */
  nextSlot: string | null;
  onStartBooking: () => void;
}

// Etapa 1: quem é o profissional, com os dados reais do perfil público
export const DoctorProfile: React.FC<DoctorProfileProps> = ({ profile: p, price, nextSlot, onStartBooking }) => {
  const modalities = [
    p.offersOnline ? 'Online' : null,
    p.offersInPerson ? `Presencial${p.officeCity ? ` em ${p.officeCity}/${p.officeState}` : ''}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <nav aria-label="Você está em" className="text-xs text-gray-600 flex items-center space-x-1">
        <Link href="/professionals" className="hover:underline">Profissionais</Link>
        <span aria-hidden>›</span>
        <Link href={`/professionals?type=${p.type}`} className="hover:underline">{PROFESSION_LABELS[p.type]}</Link>
        <span aria-hidden>›</span>
        <span className="text-blue-900 font-semibold">{p.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section aria-labelledby="perfil-nome" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              {p.photoUrl ? (
                <Image src={p.photoUrl} alt="" width={80} height={80} className="w-20 h-20 rounded-full object-cover shrink-0" />
              ) : (
                <div aria-hidden className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-700 to-blue-800 text-white font-bold text-2xl flex items-center justify-center shrink-0">
                  {initials(p.name)}
                </div>
              )}
              <div className="space-y-1">
                <h2 id="perfil-nome" className="text-xl font-extrabold text-blue-900">{p.name}</h2>
                <p className="text-sm text-gray-600">
                  {PROFESSION_LABELS[p.type]} · {formatCouncilNumber(p.type, p.document)}
                </p>
                <ul aria-label="Especialidades e atendimento" className="flex flex-wrap gap-2 pt-1">
                  {p.specialties.map((s) => (
                    <li key={s.id} className="bg-sky-50 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">{s.name}</li>
                  ))}
                  {modalities.map((m) => (
                    <li key={m} className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">{m}</li>
                  ))}
                </ul>
                <p className="text-sm text-gray-700 pt-1">
                  {p.ratingCount > 0 ? (
                    <>
                      <span aria-hidden className="text-amber-500">★ </span>
                      <strong>{p.ratingAverage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</strong> de 5 ·{' '}
                      {p.ratingCount} {p.ratingCount === 1 ? 'avaliação' : 'avaliações'}
                    </>
                  ) : (
                    'Ainda sem avaliações'
                  )}
                </p>
              </div>
            </div>

            {p.bio && (
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <h3 className="font-bold text-blue-900 text-base">Sobre</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{p.bio}</p>
              </div>
            )}

            <div className="space-y-3 border-t border-gray-100 pt-4">
              <h3 className="font-bold text-blue-900 text-base">Como funciona</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <li className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                  <span className="font-bold text-blue-900 text-sm block">{modalities.join(' ou ') || 'A combinar'}</span>
                  <span className="text-xs text-gray-600">Você escolhe ao agendar</span>
                </li>
                <li className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <span className="font-bold text-emerald-900 text-sm block">Triagem opcional</span>
                  <span className="text-xs text-gray-600">Conte como você está antes da consulta</span>
                </li>
                <li className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                  <span className="font-bold text-blue-900 text-sm block">Cancelamento</span>
                  <span className="text-xs text-gray-600">Pelo site, até 24 horas antes</span>
                </li>
              </ul>
            </div>
          </section>

          <p className="text-sm">
            <Link href={`/professionals/${p.id}`} className="font-semibold text-blue-800 underline-offset-4 hover:underline">
              Ver o perfil completo e as avaliações
            </Link>
          </p>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div>
              <span className="text-xs text-gray-600 block">Valor da consulta</span>
              <span className="text-2xl font-extrabold text-blue-900">{price}</span>
            </div>

            <p className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-900 font-medium">
              {nextSlot ? `Próximo horário: ${nextSlot}` : 'Sem horários livres nas próximas duas semanas'}
            </p>

            <button
              type="button"
              onClick={onStartBooking}
              disabled={!nextSlot}
              className="w-full min-h-11 bg-blue-800 hover:bg-blue-900 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Escolher data e horário
            </button>

            <p className="text-xs text-center text-gray-600">Cancelamento pelo site até 24 horas antes</p>
          </div>
        </div>
      </div>
    </div>
  );
};
