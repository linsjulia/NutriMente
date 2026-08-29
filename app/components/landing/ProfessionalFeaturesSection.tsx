import FadeScroll from "../fade-effect/FadeScroll";
import CardFeatures from "../cards/CardFeatures";

export default function ProfessionalFeaturesSection() {
  return (
    <FadeScroll>
      <section className="min-h-screen flex items-center justify-center flex-col">
        <h1 className="font-fraunces font-medium text-4xl text-center mt-15 leading-15">
          Para <span className="text-[#00D9FF]">Nutricionistas</span> e
          <span className="text-[#00DDB1]"> Psicólogos</span>
        </h1>
        <h2 className="text-base text-center mb-20 ">
          Uma plataforma pensada para simplificar sua rotina profissional.
        </h2>
        <div className="flex justify-center flex-row items-center gap-20">
          <div className="flex flex-col gap-10">
            <CardFeatures
              titulo="Validação e Credibilidade"
              descricao="Comprove sua atuação profissional e conquiste mais confiança dentro da plataforma."
              cor="azul"
            />

            <CardFeatures
              titulo="Planos e Checklists Exclusivos"
              descricao="Crie planos personalizados e acompanhe a evolução dos seus pacientes."
              cor="azul"
            />

            <CardFeatures
              titulo="Gestão de Agenda Prática"
              descricao="Organize horários, consultas e disponibilidade de forma simples e prática."
              cor="azul"
            />
          </div>
          <img
            src="/doctor/profissionais.jpg"
            alt=""
            className="object-contain w-125 rounded-2xl border border-blue-900"
          />
        </div>
      </section>
    </FadeScroll>
  );
}
