import Image from "next/image";
import FadeScroll from "../fade-effect/FadeScroll";
import CardFeatures from "../cards/CardFeatures";
import { BadgeCheck, ClipboardPen, Timer } from 'lucide-react'

export default function PatientFeaturesSection() {
  return (
    <FadeScroll>
      <section className="bg-white flex flex-col justify-center px-4 py-16 sm:px-8 lg:min-h-screen">
        <h2 className="font-fraunces font-medium text-3xl sm:text-4xl md:text-5xl text-center">
          Para <span className="text-[#007a7a]">Nutricionistas </span>
            e <span className="text-[#00754a]">Psicólogos</span>
        </h2>
        <p className="text-lg text-center mt-3 mb-10 lg:mb-20">
          Cuidado personalizado, do primeiro contato ao acompanhamento contínuo.
        </p>

        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:gap-16 lg:grid-cols-2">

          <div className="flex flex-col gap-4">
            <CardFeatures
              titulo="Validação e Credibilidade"
              descricao="Comprove sua atuação profissional e conquiste mais confiança dentro da plataforma."
              corFundo="azul"
              corIcon="bg-white"
              icone={BadgeCheck}
            />
            <CardFeatures
              titulo="Planos e Checklists Exclusivos"
              descricao="Crie planos personalizados e acompanhe a evolução dos seus pacientes."
              corFundo="azul"
              corIcon="bg-white"
              icone={ClipboardPen}
            />
            <CardFeatures
              titulo="Gestão de Agenda Prática"
              descricao="Organize horários, consultas e disponibilidade de forma simples e prática."
              corFundo="azul"
              corIcon="bg-white"
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