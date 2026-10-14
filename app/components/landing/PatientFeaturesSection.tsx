import Image from "next/image";
import FadeScroll from "../fade-effect/FadeScroll";
import CardFeatures from "../cards/CardFeatures";
import { FileText, LaptopMinimalCheck, NotebookPen } from "lucide-react";

export default function PatientFeaturesSection() {
  return (
    <FadeScroll>
      <section className="flex flex-col justify-center bg-blue-100 border border-blue-400 px-4 py-16 sm:px-8 lg:min-h-screen lg:py-[clamp(3rem,5vw,6rem)]">
        <h2 className="text-center font-fraunces text-3xl font-medium sm:text-4xl md:text-5xl lg:text-[clamp(2rem,3vw,3rem)]">
          Para <span className="text-[#0069F6]">Pacientes</span>
        </h2>
        <p className="mb-10 mt-3 text-center text-base sm:text-lg lg:mb-[clamp(2rem,4vw,5rem)] lg:text-[clamp(0.875rem,1.1vw,1.125rem)]">
          Cuidado personalizado, do primeiro contato ao acompanhamento contínuo.
        </p>

        <div className="mx-auto grid w-full max-w-6xl gap-4 lg:max-w-[clamp(52rem,78vw,72rem)] lg:grid-cols-2 lg:gap-[clamp(0.75rem,1.2vw,1rem)]">
          <div className="relative min-h-80 overflow-hidden rounded-2xl shadow-lg shadow-blue-900/5">
            <Image
              src="/patient/pacientes.jfif"
              alt=""
              fill
              sizes="(min-width: 1024px) 576px, 100vw"
              className="object-cover object-bottom"
            />
          </div>

          <div className="flex flex-col gap-4 lg:gap-[clamp(0.75rem,1.2vw,1rem)]">
            <CardFeatures
              titulo="Avaliação Inicial Inteligente"
              descricao="Conte-nos seus objetivos e receba um acompanhamento personalizado."
              corIcon="bg-green-100"
              icone={FileText}
            />
            <CardFeatures
              titulo="Consultas online ou presenciais"
              descricao="Encontre horários e agende consultas com nutricionistas e psicólogos pelo aplicativo."
              corIcon="bg-blue-100"
              icone={LaptopMinimalCheck}
            />
            <CardFeatures
              titulo="Diário Alimentar e de Rotina"
              descricao="Compartilhe fotos de refeições, anotações e relatos com seu profissional."
              corIcon="bg-cyan-100"
              icone={NotebookPen}
            />
          </div>
        </div>
      </section>
    </FadeScroll>
  );
}