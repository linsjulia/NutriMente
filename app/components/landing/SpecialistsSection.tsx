import FadeScroll from "../fade-effect/FadeScroll";
import ProfessionalCards from "../cards/HomeProfessionalCard";

export default function SpecialistsSection() {
  return (
    <FadeScroll>
      <section>
        <div className="px-4 py-16 sm:px-8 md:py-24 lg:py-[clamp(3rem,5vw,6rem)]">
          <h2 className="text-center font-fraunces text-3xl font-medium sm:text-4xl lg:text-[clamp(2rem,3vw,2.5rem)]">
            Conheça alguns de nossos especialistas
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-center text-base lg:text-[clamp(0.875rem,1.1vw,1.125rem)]">
            Junte-se a centenas de pacientes que já encontram psicólogos e
            nutricionistas qualificados no NutriMente.
          </p>

          <div className="mx-auto my-12 flex flex-col items-center gap-8 lg:my-[clamp(2rem,4vw,4rem)] lg:max-w-[clamp(60rem,85vw,80rem)] lg:flex-row lg:items-stretch lg:justify-center lg:gap-[clamp(1rem,2vw,2rem)]">
            <ProfessionalCards
              titulo="Dr. Lucas Fernandes"
              tipoProfissional="Nutricionista"
              documento="CRN-3 00000"
              descricao="Nutricionista com enfoque em nutrição comportamental, adesão terapêutica e organização da rotina alimentar. Atua no desenvolvimento de estratégias sustentáveis para melhorar a relação com a comida sem prescrições rígidas ou extremismos."
              categoria="Nutrição Comportamental"
              segundaCategoria="Nutrição comportamental e alimentação consciente"
              img="/doctor/pfp.png"
            />

            <ProfessionalCards
              titulo="Dra. Fernanda Lima"
              tipoProfissional="Psicóloga"
              documento="CRP - 06/00000"
              descricao="Psicóloga clínica com ênfase em Terapia Cognitivo-Comportamental para manejo de estresse, sobrecarga emocional, padrões cognitivos disfuncionais e fortalecimento de recursos internos."
              categoria="Terapia Cognitivo-Comportamental"
              segundaCategoria="Regulação emocional e manejo de sintomas ansiosos"
              img="/doctor/pfp2.png"
            />

            <ProfessionalCards
              titulo="Dra. Mariana Souza"
              tipoProfissional="Psicóloga"
              documento="CRP - 06/00000"
              descricao="Psicóloga com atuação clínica em sofrimento psíquico relacionado à alimentação, ansiedade, imagem corporal e processos de autocuidado. Realiza acompanhamento individual com foco em avaliação, formulação clínica e plano terapêutico personalizado."
              categoria="Psicologia Clínica e Nutricional"
              segundaCategoria="Ansiedade associada ao comportamento alimentar"
              img="/doctor/pfp3.png"
            />
          </div>


        </div>
      </section>
    </FadeScroll>
  );
}