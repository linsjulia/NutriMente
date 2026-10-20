"use client";

import { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import AboutTab from "./AboutTab";
import ProfileHeader from "./ProfileHeader";
import ProfileSideBar from "./ProfileSideBar";
import ReviewsTab from "./ReviewsTab";
import SchedulesTab from "./SchedulesTab";
import type { Profissional } from "./Types";

type Aba = "sobre" | "horarios" | "avaliacoes";

// Animação usada ao trocar de aba (a mesma para o conteúdo e para a coluna da direita)
const animacao = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.2 },
};

// Monta a tela toda e guarda qual aba está aberta.
export default function ProfileView({ p }: { p: Profissional }) {
  const [aba, setAba] = useState<Aba>("sobre");

  const abas: { id: Aba; label: string }[] = [
    { id: "sobre", label: "Sobre" },
    { id: "horarios", label: "Horários disponíveis" },
    { id: "avaliacoes", label: `Avaliações (${p.totalAvaliacoes})` },
  ];

  return (
    // reducedMotion="user": quem pediu menos movimento no sistema não vê a animação
    <MotionConfig reducedMotion="user">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <ProfileHeader p={p} onAgendar={() => setAba("horarios")} />

        <div role="tablist" aria-label="Seções do perfil" className="flex gap-8 border-b border-gray-200">
          {abas.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={aba === a.id}
              onClick={() => setAba(a.id)}
              className={`-mb-px border-b-2 px-1 pb-2 text-sm ${
                aba === a.id ? "border-blue1 font-bold text-blue1" : "border-transparent text-gray-600 hover:text-blue1"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          {/* A "key" muda com a aba: o conteúdo antigo sai e o novo entra */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={aba} role="tabpanel" {...animacao}>
              {aba === "sobre" && <AboutTab p={p} />}
              {aba === "horarios" && <SchedulesTab dias={p.dias} />}
              {aba === "avaliacoes" && <ReviewsTab p={p} />}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={aba} className="self-start" {...animacao}>
              <ProfileSideBar p={p} aba={aba} onVerMais={() => setAba("avaliacoes")} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}