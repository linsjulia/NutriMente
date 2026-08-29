import FadeScroll from "../fade-effect/FadeScroll";

export default function GettingStartedSection() {
  return (
    <FadeScroll>
      <section className="p-20 min-h-screen">
        <div className="flex justify-center items-center gap-40 flex-col flex-1">
          <h1 className="font-fraunces text-4xl font-medium">Como Funciona?</h1>

          <div className="flex gap-14 text-center">

            <div className="cards-landing1 font-fraunces">
              <img className="icon-landingPage" src="/icons/number-1.png" alt="" />
              <p>Faça seu cadastro e preencha seu perfil de saúde</p>
              <img className="icon-landingPage" src="/icons/cadastro.png" alt="" />
            </div>

            <div className="cards-landing1 gap-3 font-fraunces">
              <img className="icon-landingPage" src="/icons/number-2.png" alt="" />
              <h2>Escolha o profissional ideal</h2>
              <img className="icon-landingPage" src="/icons/medico.png" alt="" />
            </div>

            <div className="cards-landing1 font-fraunces">
              <img className="icon-landingPage" src="/icons/number-3.png" alt="" />
              <h2>Agende sua consulta e comece seu acompanhamento</h2>
              <img className="icon-landingPage" src="/icons/consultando.png" alt="" />
            </div>

          </div>
        </div>
      </section>
    </FadeScroll>
  );
}
