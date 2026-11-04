"use client";

import { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import AboutTab from "./AboutTab";
import ProfileHeader from "./ProfileHeader";
import ProfileSideBar from "./ProfileSideBar";
import ReviewsTab from "./ReviewsTab";
import SchedulesTab from "./SchedulesTab";
import type { ProfessionalProfile, PublicReview, SlotDay } from "@/app/lib/agenda";

type Aba = "sobre" | "horarios" | "avaliacoes";

const animacao = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.2 },
};


export default function ProfileView({
  p,
  days,
  reviews,
}: {
  p: ProfessionalProfile;
  days: SlotDay[];
  reviews: PublicReview[];
}) {
  const [aba, setAba] = useState<Aba>("sobre");

  const abas: { id: Aba; label: string }[] = [
    { id: "sobre", label: "Sobre" },
    { id: "horarios", label: "Horários disponíveis" },
    { id: "avaliacoes", label: `Avaliações (${p.ratingCount})` },
  ];

  return (
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
              {aba === "horarios" && <SchedulesTab dias={days} />}
              {aba === "avaliacoes" && <ReviewsTab p={p} reviews={reviews} />}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={aba} className="self-start" {...animacao}>
              <ProfileSideBar p={p} reviews={reviews} aba={aba} onVerMais={() => setAba("avaliacoes")} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}