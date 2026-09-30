import FadeScroll from "../fade-effect/FadeScroll";
import CardFeatures from "../cards/CardFeatures";
import { FileText, LaptopMinimalCheck, NotebookPen } from 'lucide-react'

export default function PatientFeaturesSection() {
  return (
    <FadeScroll>
      <section className="bg-blue-100 flex flex-col justify-center px-4 py-16 sm:px-8 lg:min-h-screen">
        <h2 className="font-fraunces font-medium text-3xl sm:text-4xl md:text-5xl text-center">
          Para <span className="text-[#0069F6]">Pacientes</span>
        </h2>
        <p className="text-lg text-center mt-3 mb-10 lg:mb-20">
          Cuidado personalizado, do primeiro contato ao acompanhamento contínuo.
        </p>

        <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-2">

          <div className="relative min-h-80 overflow-hidden rounded-2xl shadow-lg shadow-blue-900/5">
            <img
              src="/patient/pacientes.jfif"
              alt=""
              className="absolute inset-0 size-full object-cover object-bottom"
            />
          </div>

          <div className="flex flex-col gap-4">
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