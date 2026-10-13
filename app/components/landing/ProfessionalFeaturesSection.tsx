import Image from "next/image";
import FadeScroll from "../fade-effect/FadeScroll";
import CardFeatures from "../cards/CardFeatures";
import { BadgeCheck, ClipboardPen, Timer } from "lucide-react";

export default function ProfessionalFeaturesSection() {
  return (
    <FadeScroll>
      <section className="flex flex-col justify-center bg-[#d4faef] border border-b-emerald-500 px-4 py-16 sm:px-8 lg:min-h-screen lg:py-[clamp(3rem,5vw,6rem)]">
        <h2 className="text-center font-fraunces text-3xl font-medium sm:text-4xl md:text-5xl lg:text-[clamp(2rem,3vw,3rem)]">
          Para <span className="text-[#007a7a]">Nutricionistas</span> e{" "}
          <span className="text-[#00754a]">Psicólogos</span>
        </h2>
        <p className="mb-10 mt-3 text-center text-base sm:text-lg lg:mb-[clamp(2rem,4vw,5rem)] lg:text-[clamp(0.875rem,1.1vw,1.125rem)]">
          Cuidado personalizado, do primeiro contato ao acompanhamento contínuo.
        </p>

        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:max-w-[clamp(52rem,78vw,72rem)] lg:grid-cols-2 lg:gap-[clamp(1.5rem,3vw,4rem)]">
          <div className="flex flex-col gap-4 lg:gap-[clamp(0.75rem,1.2vw,1rem)]">
            <CardFeatures
              titulo="Validação e Credibilidade"
              descricao="Comprove sua atuação profissional e conquiste mais confiança dentro da plataforma."
              corFundo="branco"
              corIcon="bg-green-100"
              icone={BadgeCheck}
            />
            <CardFeatures
              titulo="Planos e Checklists Exclusivos"
              descricao="Crie planos personalizados e acompanhe a evolução dos seus pacientes."
              corFundo="branco"
              corIcon="bg-blue-100"
              icone={ClipboardPen}
            />
            <CardFeatures
              titulo="Gestão de Agenda Prática"
              descricao="Organize horários, consultas e disponibilidade de forma simples e prática."
              corFundo="branco"
              corIcon="bg-cyan-100"
              icone={Timer}
            />
          </div>

          <div className="relative min-h-80 overflow-hidden rounded-2xl shadow-lg shadow-blue-900/5">
            <Image
              src="/doctor/profissionais.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 576px, 100vw"
              className="object-cover object-bottom"
            />
          </div>
        </div>
      </section>
    </FadeScroll>
  );
}