import FadeScroll from "../fade-effect/FadeScroll";
import CardFeatures from "../cards/CardFeatures";
import { BadgeCheck, ClipboardPen, FileText, LaptopMinimalCheck, NotebookPen, Timer } from 'lucide-react'

export default function PatientFeaturesSection() {
  return (
    <FadeScroll>
      <section className="bg-white min-h-screen flex flex-col justify-center">
        <h1 className="font-fraunces font-medium text-5xl text-center">
          Para <span className="text-[#00d6d6]">Nutricionistas </span>
            e <span className="text-[#00e485]">Psicólogos</span>
        </h1>
        <h2 className="text-[18px] text-center mb-20">
          Cuidado personalizado, do primeiro contato ao acompanhamento contínuo.
        </h2>

        <div className="mx-auto grid w-full max-w-6xl gap-30 lg:grid-cols-2">

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
              <img
                src="/doctor/profissionais.jpg"
                alt=""
                className="absolute inset-0 size-full object-cover object-bottom"
              />
            </div>
        </div>
      </section>
    </FadeScroll>
  );
}