"use client"
import React, { useState } from 'react';

export const CalendarSelector: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<number>(23);
  const [selectedTime, setSelectedTime] = useState<string>('14:00');

  const availableTimes = [
    '09:00', '10:00', '11:00', '14:00',
    '15:00', '16:00', '17:00', '18:00',
  ];

  const highlightedDays = [21, 22, 23, 26, 27, 28, 29, 30];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Seção Calendário */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-blue-900 text-lg">Outubro 2026</h3>
          <div className="flex space-x-2 text-gray-400 text-sm">
            <button className="hover:text-gray-600">&lt;</button>
            <button className="hover:text-gray-600">&gt;</button>
          </div>
        </div>

        {/* Cabeçalho de Dias */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
            <div key={i}>{day}</div>
          ))}
        </div>

        {/* Grade de Dias */}
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {/* Espaçadores de início do mês */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            const isAvailable = highlightedDays.includes(day);
            const isSelected = selectedDay === day;

            return (
              <button
                key={day}
                disabled={!isAvailable}
                onClick={() => setSelectedDay(day)}
                className={`h-9 w-full rounded-lg flex items-center justify-center font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-900 text-white font-bold'
                    : isAvailable
                    ? 'bg-sky-100 text-blue-900 hover:bg-sky-200'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seção de Horários */}
      <div className="flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-blue-900 text-base mb-1">
            Sex, {selectedDay} de outubro
          </h4>
          <p className="text-xs text-gray-400 mb-4">Horário de Brasília (GMT-3)</p>

          <div className="grid grid-cols-4 gap-2">
            {availableTimes.map((time) => {
              const isSelected = selectedTime === time;
              return (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6 flex items-center">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full inline-block mr-2" />
          8 horários disponíveis
        </p>
      </div>
    </div>
  );
};