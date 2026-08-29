import FadeScroll from "../fade-effect/FadeScroll";
import ProfessionalCards from "../cards/ProfessionalCards"

export default function SpecialistsSection() {
  return (
    <div>
      <FadeScroll>
              <section className="min-h-screen">
                
                  <img src="/background/rectangle.svg" className="w-full" />
                  <div className="p-30 min-h-screen">
                    <h1 className="font-fraunces font-medium text-4xl text-center">
                      Conheça alguns de nossos especialistas
                    </h1>
                    
                    <h2 className="text-center text-base m-5">
                      Junte-se a centenas de pacientes que já encontram psicólogos e
                      nutricionistas qualificados no NutriMente. Escolha seu especialista
                      e dê o primeiro passo hoje.
                    </h2>
          
                    <div className="flex flex-row gap-20 m-30 items-center justify-center">
                      <ProfessionalCards
                        titulo="Dr. Lucas Fernandes"
                        descricao="Nutricionista com enfoque em nutrição comportamental, adesão terapêutica e organização da rotina alimentar. Atua no desenvolvimento de estratégias sustentáveis para melhorar a relação com a comida sem prescrições rígidas ou extremismos."
                        categoria="Nutrição Comportamental"
                        categoria2="Nutrição comportamental e alimentação consciente"
                        img="/doctor/pfp.png"
                      />
          
                      <ProfessionalCards
                        titulo="Dra. Fernanda Lima"
                        descricao="Psicóloga clínica com ênfase em Terapia Cognitivo-Comportamental para manejo de estresse, sobrecarga emocional, padrões cognitivos disfuncionais e fortalecimento de recursos internos."
                        categoria="Terapia Cognitivo-Comportamental"
                        categoria2="Regulação emocional e manejo de sintomas ansiosos"
                        img="/doctor/pfp2.png"
                      />
          
                      <ProfessionalCards
                        titulo="Dra. Mariana Souza"
                        descricao="Psicóloga com atuação clínica em sofrimento psíquico relacionado à alimentação, ansiedade, imagem corporal e processos de autocuidado. Realiza acompanhamento individual com foco em avaliação, formulação clínica e plano terapêutico personalizado."
                        categoria="Psicologia Clínica e Nutricional"
                        categoria2="Ansiedade associada ao comportamento alimentar"
                        img="/doctor/pfp3.png"
                      />
                    </div>
                                    <div className="flex flex-row justify-center gap-5">
                  <img src="/icons/apple.png" className="w-15 h-fit" />
                  <img src="/icons/caring-mental.png" className="w-17 object-contain h-fit" />
                </div>
                  </div>
                  

              </section>
            </FadeScroll>
    </div>
  )
}
