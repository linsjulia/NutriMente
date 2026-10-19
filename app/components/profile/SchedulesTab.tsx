"use client";

import { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import Card from "./Card";
import type { Dia, Horario } from "./Types";

function Grupo({ titulo, horarios }: { titulo: string; horarios: Horario[] }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-3 text-xs font-bold text-gray-600">
        {titulo}
        <span className="h-px flex-1 bg-gray-200" />
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {horarios.map((h) => (
          <button
            key={h.hora}
            type="button"
            disabled={!h.livre}
            className={`rounded-lg border py-2 text-sm font-bold ${
              h.livre ? "border-gray-200 hover:border-blue1" : "cursor-not-allowed text-gray-400 line-through"
            }`}
          >
            {h.hora}
          </button>
        ))}
      </div>
    </section>
  );
}

// Aba "Horários disponíveis": escolhe o dia e mostra os horários.
export default function SchedulesTab({ dias }: { dias: Dia[] }) {
  const [diaEscolhido, setDiaEscolhido] = useState<number | null>(null);
  const dia = diaEscolhido === null ? null : dias[diaEscolhido];

  const manha = dia?.horarios.filter((h) => Number(h.hora.split(":")[0]) < 12) ?? [];
  const tarde = dia?.horarios.filter((h) => Number(h.hora.split(":")[0]) >= 12) ?? [];

  return (
    // reducedMotion="user": quem pediu menos movimento no sistema não vê a animação
    <MotionConfig reducedMotion="user">
      <Card className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold">Horários disponíveis</h2>
          <p className="mt-1 text-sm text-gray-700">Escolha um horário para a consulta</p>
        </div>

        <p className="text-sm font-semibold">04 de outubro de 2026</p>

        <div className="grid grid-cols-5 gap-3">
          {dias.map((d, i) => (
            <button
              key={d.numero}
              type="button"
              aria-pressed={diaEscolhido === i}
              onClick={() => setDiaEscolhido(i)}
              className={`flex flex-col items-center rounded-xl border py-3 ${
                diaEscolhido === i ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 hover:border-blue1"
              }`}
            >
              <span className="text-sm">{d.semana}</span>
              <span className="text-xl font-bold">{d.numero}</span>
            </button>
          ))}
        </div>

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
                <Grupo titulo="MANHÃ" horarios={manha} />
                <Grupo titulo="TARDE" horarios={tarde} />
                <p className="flex gap-6 text-xs text-gray-600">
                  <span>● Disponível</span>
                  <span className="line-through">Indisponível</span>
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>
    </MotionConfig>
  );
}