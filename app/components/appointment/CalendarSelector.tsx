"use client"
import React from 'react';
import type { SlotDay } from '@/app/lib/agenda';

interface CalendarSelectorProps {
  /** Dias com horários livres (GET /api/professionals/{id}/slots) */
  days: SlotDay[];
  selectedDate: string | null;
  selectedStartsAt: string | null;
  onSelectDate: (date: string) => void;
  onSelectSlot: (startsAt: string) => void;
}

export const dayLabel = (date: string) => {
  const d = new Date(`${date}T12:00:00`);
  return {
    weekday: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
    day: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    long: d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
  };
};

// Escolha de dia e horário com os horários REAIS da agenda do profissional
export const CalendarSelector: React.FC<CalendarSelectorProps> = ({
  days,
  selectedDate,
  selectedStartsAt,
  onSelectDate,
  onSelectSlot,
}) => {
  const day = days.find((d) => d.date === selectedDate) ?? null;

  if (days.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p className="text-gray-700">Este profissional não tem horários livres nas próximas duas semanas.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Dias */}
      <fieldset>
        <legend className="font-bold text-blue-900 text-lg mb-4">Escolha o dia</legend>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 text-center text-sm">
          {days.map((d) => {
            const label = dayLabel(d.date);
            const isSelected = selectedDate === d.date;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => onSelectDate(d.date)}
                aria-pressed={isSelected}
                aria-label={`${label.long}, ${d.slots.length} horários`}
                className={`min-h-11 rounded-lg flex flex-col items-center justify-center py-1 font-medium transition-all ${
                  isSelected ? 'bg-blue-900 text-white font-bold' : 'bg-sky-100 text-blue-900 hover:bg-sky-200'
                }`}
              >
                <span className="text-xs capitalize">{label.weekday}</span>
                <span>{label.day}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Horários do dia */}
      <fieldset className="flex flex-col justify-between">
        <div>
          <legend className="font-bold text-blue-900 text-base mb-1 first-letter:uppercase">
            {day ? dayLabel(day.date).long : 'Escolha um dia'}
          </legend>
          <p className="text-xs text-gray-600 mb-4">Horário de Brasília</p>

          {day && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {day.slots.map((slot) => {
                const isSelected = selectedStartsAt === slot.startsAt;
                return (
                  <button
                    key={slot.startsAt}
                    type="button"
                    onClick={() => onSelectSlot(slot.startsAt)}
                    aria-pressed={isSelected}
                    className={`min-h-11 text-sm font-semibold rounded-xl border transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {day && (
          <p className="text-xs text-gray-600 mt-6">
            {day.slots.length} {day.slots.length === 1 ? 'horário disponível' : 'horários disponíveis'}
          </p>
        )}
      </fieldset>
    </div>
  );
};
