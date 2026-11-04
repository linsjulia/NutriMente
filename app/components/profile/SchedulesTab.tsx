"use client";

import { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import Card from "./Card";
import type { Slot, SlotDay } from "@/app/lib/agenda";

function Grupo({
  titulo,
  horarios,
  selecionado,
  onSelecionar,
}: {
  titulo: string;
  horarios: Slot[];
  selecionado: string | null;
  onSelecionar: (startsAt: string) => void;
}) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-3 text-xs font-bold text-gray-600">
        {titulo}
        <span className="h-px flex-1 bg-gray-200" />
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {horarios.map((slot) => (
          <button
            key={slot.startsAt}
            type="button"
            aria-pressed={selecionado === slot.startsAt}
            onClick={() => onSelecionar(slot.startsAt)}
            className={`rounded-lg border py-2 text-sm font-bold ${
              selecionado === slot.startsAt
                ? "border-blue1 bg-blue1 text-white"
                : "border-gray-200 hover:border-blue1"
            }`}
          >
            {slot.time}
          </button>
        ))}
      </div>
    </section>
  );
}

function dateValue(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

// Aba "Horários disponíveis": escolhe o dia e mostra os horários.
export default function SchedulesTab({ dias }: { dias: SlotDay[] }) {
  const [diaEscolhido, setDiaEscolhido] = useState<string | null>(null);
  const [horarioEscolhido, setHorarioEscolhido] = useState<string | null>(null);
  const dia = diaEscolhido === null ? null : dias.find((day) => day.date === diaEscolhido) ?? null;

  const manha = dia?.slots.filter((slot) => Number(slot.time.slice(0, 2)) < 12) ?? [];
  const tarde = dia?.slots.filter((slot) => Number(slot.time.slice(0, 2)) >= 12) ?? [];

  return (
    <MotionConfig reducedMotion="user">
      <Card className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold">Horários disponíveis</h2>
          <p className="mt-1 text-sm text-gray-700">Escolha um horário para a consulta</p>
        </div>

        {dia && (
          <p className="text-sm font-semibold">
            {dateValue(dia.date).toLocaleDateString("pt-BR", {
              timeZone: "UTC",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}

        {dias.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {dias.map((day) => (
              <button
                key={day.date}
                type="button"
                aria-pressed={diaEscolhido === day.date}
                onClick={() => {
                  setDiaEscolhido(day.date);
                  setHorarioEscolhido(null);
                }}
                className={`flex flex-col items-center rounded-xl border py-3 ${
                  diaEscolhido === day.date
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-200 hover:border-blue1"
                }`}
              >
                <span className="text-sm">{day.weekday}</span>
                <span className="text-xl font-bold">
                  {dateValue(day.date).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit" })}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-blue-100 bg-blue3 py-8 text-center text-sm text-gray-600">
            Não há horários livres nos próximos dias.
          </p>
        )}

        {/* Quando a "key" muda (outro dia), o conteúdo antigo sai e o novo entra */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={diaEscolhido ?? "vazio"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {!dia ? (
              <div className="flex flex-col items-center gap-1 rounded-xl border border-blue-100 bg-blue3 py-8 text-center">
                <CalendarDays aria-hidden size={28} className="text-gray-600" />
                <p className="font-semibold">Selecione um dia</p>
                <p className="text-xs text-gray-600">Escolha uma data acima para ver os horários disponíveis.</p>
              </div>
            ) : (
              <>
                {manha.length > 0 && (
                  <Grupo
                    titulo="MANHÃ"
                    horarios={manha}
                    selecionado={horarioEscolhido}
                    onSelecionar={setHorarioEscolhido}
                  />
                )}
                {tarde.length > 0 && (
                  <Grupo
                    titulo="TARDE"
                    horarios={tarde}
                    selecionado={horarioEscolhido}
                    onSelecionar={setHorarioEscolhido}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>
    </MotionConfig>
  );
}