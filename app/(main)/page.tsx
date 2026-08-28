import Hero from "../components/Hero";
import Card from "../components/CardFuncionalidades";
import Card_Profi from "../components/CardProfi";
import FadeInProps from "../components/FadeScroll";
import FadeScrollProps from "../components/FadeScroll";
import Card_Avaliacoes from "../components/CardAvaliacoes";
import Footer from "../components/Footer";
import CTA from "../components/CTA";



export default function Landing() {
  return (
    <main>
      <FadeInProps>
        <Hero></Hero>
      </FadeInProps>

      {/* Primeiros passos do site */}

      <FadeScrollProps>
        <section className="mb-50 p-20">
          <div className="flex justify-center items-center gap-40 flex-col flex-1">
            <h1 className="font-fraunces text-4xl font-medium">
              Como Funciona?
            </h1>
            {/* <img src="/Como funciona.svg" alt="" className="w-1/2" /> */}
            <div className="flex gap-14 text-center">
              <div className="cards-landing1 font-fraunces">
                <img className="icon-landingPage" src="/number-1.png" alt="" />
                <p>Faça seu cadastro e preencha seu perfil de saúde</p>
                <img className="icon-landingPage" src="/cadastro.png" alt="" />
              </div>

              {/* <img src="/line.svg" alt="" className="w-[5%] object-contain" /> */}
              <div className="cards-landing1 gap-3 font-fraunces">
                <img className="icon-landingPage" src="/number-2.png" alt="" />
                <h2>Escolha o profissional ideal</h2>
                <img className="icon-landingPage" src="/medico.png" alt="" />
              </div>

              {/* <img src="/line.svg" alt="" className="w-[5%] object-contain" /> */}
              <div className="cards-landing1 font-fraunces">
                <img className="icon-landingPage" src="/number-3.png" alt="" />
                <h2>Agende sua consulta e comece seu acompanhamento</h2>
                <img
                  className="icon-landingPage"
                  src="/consultando.png"
                  alt=""
                />
              </div>
            </div>
          </div>
        </section>
      </FadeScrollProps>

      {/* Ap. Funcionalidades Clientes */}

      <FadeScrollProps>
        <section className="p-10 bg-blue-100 min-h-screen">
          <h1 className="font-fraunces font-medium text-4xl text-center mb-20">
            Para <span className="text-[#0069F6]">Pacientes</span>
          </h1>
          <div className=" flex justify-center flex-row items-center gap-20">
            <div>
              <img
                src="/pacientes.jfif"
                alt="" 
                className="object-cover w-[500px] rounded-2xl border-1 border-blue-900"
              />
            </div>

            <div className="flex flex-col gap-10">
              <Card
                image="/1.png"
                titulo="Avaliação Inicial Inteligente"
                descricao="Conte-nos seus objetivos e receba um acompanhamento personalizado."
              />
              {/* <img src="decoration.png" alt="" className="w-13 p-0 m-2" /> */}
              <Card
                image="/2.png"
                titulo="Consultas online ou presenciais"
                descricao="Encontre horários e agende consultas com nutricionistas e psicólogos pelo aplicativo."
              />
              {/* <img src="decoration.png" alt="" className="w-13 p-0 m-0" /> */}
              <Card
                image="/3.png"
                titulo="Diário Alimentar e de Rotina"
                descricao="Compartilhe fotos de refeições, anotações e relatos com seu profissional."
              />
            </div>
          </div>
        </section>
      </FadeScrollProps>

      {/* Ap. Funcionalidades Profissionais */}

      <FadeScrollProps>
        <section className="min-h-screen">
          <h1 className="font-fraunces font-medium text-4xl text-center mt-15 leading-15">
            Para <span className="text-[#00D9FF]">Nutricionistas</span> e 
            <span className="text-[#00DDB1]"> Psicólogos</span>
          </h1>
          <h2 className="text-base text-center mb-20 ">Uma plataforma pensada para simplificar sua rotina profissional.</h2>
          <div className="flex justify-center flex-row items-center gap-20">
            <div className="flex flex-col gap-10">
              <Card
                image="/1.png"
                titulo="Validação e Credibilidade"
                descricao="Comprove sua atuação profissional e conquiste mais confiança dentro da plataforma."
                cor="azul"
              />

              <Card
                image="/2.png"
                titulo="Planos e Checklists Exclusivos"
                descricao="Crie planos personalizados e acompanhe a evolução dos seus pacientes."
                cor="azul"
              />

              <Card
                image="/3.png"
                titulo="Gestão de Agenda Prática"
                descricao="Organize horários, consultas e disponibilidade de forma simples e prática."
                cor="azul"
              />
            </div>
            <img
              src="/profissionais.jpg"
              alt=""
              className="object-contain w-[500px] rounded-2xl border-1 border-blue-900"
            />
          </div>
        </section>
      </FadeScrollProps>

      <FadeScrollProps>
        <section>
          <img src="/rectangle.svg" alt="" className="w-full" />
          <h1 className="font-fraunces font-medium text-4xl text-center">
            Conheça alguns de nossos especialistas
          </h1>
          
          <h2 className="text-center text-base m-5">
            Junte-se a centenas de pacientes que já encontram psicólogos e
            nutricionistas qualificados no NutriMente. Escolha seu especialista
            e dê o primeiro passo hoje.
          </h2>

          <div className="flex flex-row gap-20 m-20 items-center justify-center">
            <Card_Profi
              titulo="Dr. Lucas Fernandes"
              descricao="Nutricionista com enfoque em nutrição comportamental, adesão terapêutica e organização da rotina alimentar. Atua no desenvolvimento de estratégias sustentáveis para melhorar a relação com a comida sem prescrições rígidas ou extremismos."
              categoria="Nutrição Comportamental"
              categoria2="Nutrição comportamental e alimentação consciente"
              img="/pfp.png"
            />

            <Card_Profi
              titulo="Dra. Fernanda Lima"
              descricao="Psicóloga clínica com ênfase em Terapia Cognitivo-Comportamental para manejo de estresse, sobrecarga emocional, padrões cognitivos disfuncionais e fortalecimento de recursos internos."
              categoria="Terapia Cognitivo-Comportamental"
              categoria2="Regulação emocional e manejo de sintomas ansiosos"
              img="/pfp2.png"
            />

            <Card_Profi
              titulo="Dra. Mariana Souza"
              descricao="Psicóloga com atuação clínica em sofrimento psíquico relacionado à alimentação, ansiedade, imagem corporal e processos de autocuidado. Realiza acompanhamento individual com foco em avaliação, formulação clínica e plano terapêutico personalizado."
              categoria="Psicologia Clínica e Nutricional"
              categoria2="Ansiedade associada ao comportamento alimentar"
              img="/pfp3.png"
            />
          </div>
        </section>
      </FadeScrollProps>

      <div className="flex flex-row justify-center m-30 gap-5">
        <img src="/maca.png" className="w-20 h-fit" />
        <img src="/cerebro.png" className="w-22 object-contain h-fit" />
      </div>

      {/* Secao cards de avaliacoes */}
      <FadeScrollProps>
        <section className="bg-blue-100 p-10">
          <h1 className="font-fraunces font-medium text-4xl text-center">
            O que dizem sobre nossa plataforma
          </h1>
          <h2 className="text-center text-base m-5">Uma plataforma criada para tornar o acompanhamento nutricional e psicológico mais acessível, organizado e personalizado.</h2>
          <div className="flex md:flex-row flex-col gap-30 justify-center my-20 p-20">
            <Card_Avaliacoes
              titulo="Mariana S., Paciente"
              avaliacao="O NutriMente facilitou muito minha rotina. Antes eu perdia os papéis da dieta, agora recebo as metas direto no celular e os lembretes de consulta me ajudam a não esquecer de nada. Muito prático!"
              img="/paciente2.png"
            />

            <Card_Avaliacoes
              titulo="Dr. Ricardo, Nutricionista"
              avaliacao="Como profissional, a gestão da agenda ficou muito mais organizada. O diário alimentar com fotos que os pacientes enviam me permite dar um feedback muito mais preciso entre as consultas."
              img="/doctor-pfp.png"
            />
          </div>
        </section>
      </FadeScrollProps>

      {/* Secao CTA Final */}
      <FadeScrollProps>
        <CTA/>
      </FadeScrollProps>

      {/* Footer  */}
      <section>
        <Footer />
      </section>
      
    </main>
  );
}
