import FadeScroll from "../fade-effect/FadeScroll";

const steps = [
  {
    number: "1",
    title: "Crie seu perfil",
    description: "Conte um pouco sobre você e suas necessidades",
    icon: "/icons/cadastro.png",
  },
  {
    number: "2",
    title: "Encontre seu profissional",
    description: "Escolha o especialista ideal para o seu momento",
    icon: "/icons/medico.png",
  },
  {
    number: "3",
    title: "Comece seu acompanhamento",
    description: "Agende sua consulta e cuide da sua saúde",
    icon: "/icons/consultando.png",
  },
];

export default function GettingStartedSection() {
  return (
    <FadeScroll>
      <section className="bg-[#f7fffc] min-h-screen px-6 py-20 sm:px-10 lg:px-20 lg:pt-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center">
          <span className="mb-3 text-lg font-bold uppercase tracking-[0.25em] text-green-700">
            É simples começar
          </span>

          <h1 className="text-center font-fraunces text-4xl font-medium text-[#102f42] sm:text-5xl">
            Como Funciona?
          </h1>

          <p className="mt-4 max-w-xl text-center text-base leading-relaxed text-slate-600 sm:text-lg">
            Cuidar da sua saúde pode ser simples, seguro e feito no seu ritmo.
          </p>

          <div className="relative mt-16 grid w-full grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">

            <div className="absolute left-[16%] right-[16%] top-12 hidden h-px bg-linear-to-r from-green-300 via-blue-300 to-green-300 md:block" />

            {steps.map((step) => (
              <div
                key={step.number}
                className="relative z-10 flex min-h-80 flex-col items-center rounded-3xl border-2 border-cyan-200 bg-white px-7 py-8 text-center shadow-[0_12px_35px_rgba(16,47,66,0.08)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_18px_40px_rgba(16,47,66,0.14)]"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-green-400 to-green-600 text-3xl font-bold text-white shadow-lg shadow-green-200">
                  {step.number}
                </div>

                <h2 className="max-w-xs font-fraunces text-2xl font-semibold leading-snug text-[#102f42]">
                  {step.title}
                </h2>

                <p className="mt-4 max-w-xs text-[16px] leading-relaxed text-slate-600">
                  {step.description}
                </p>

                <div className="mt-auto flex h-20 items-end justify-center pt-8">
                  <img
                    src={step.icon}
                    alt=""
                    className="h-16 w-16 object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </FadeScroll>
  );
}
