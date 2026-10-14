import Image from "next/image";
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
      <section className="bg-[#f7fffc] px-6 py-16 sm:px-10 lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:px-16 lg:py-[clamp(4rem,7vw,8rem)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center lg:max-w-[clamp(60rem,85vw,80rem)]">
          <span className="mb-3 text-base font-bold uppercase tracking-[0.25em] text-green-700 lg:text-[clamp(0.875rem,1.2vw,1.125rem)]">
            É simples começar
          </span>

          <h2 className="text-center font-fraunces text-4xl font-medium text-[#102f42] sm:text-5xl lg:text-[clamp(1.875rem,2.8vw,2.5rem)]">
            Como funciona?
          </h2>

          <p className="mt-4 max-w-xl text-center text-base leading-relaxed text-slate-600 lg:text-[clamp(0.9375rem,1.2vw,1.125rem)]">
            Cuidar da sua saúde pode ser simples, seguro e feito no seu ritmo.
          </p>

          <div className="relative mt-12 grid w-full grid-cols-1 gap-8 md:grid-cols-3 md:gap-6 lg:mt-[clamp(2.5rem,4.5vw,4rem)] lg:gap-[clamp(1rem,2vw,2rem)]">

            {steps.map((step) => (
              <div
                key={step.number}
                className="relative z-10 flex min-h-80 flex-col items-center rounded-3xl border-2 border-cyan-200 bg-white px-7 py-8 text-center shadow-[0_12px_35px_rgba(16,47,66,0.08)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_18px_40px_rgba(16,47,66,0.14)] lg:min-h-[clamp(16rem,22vw,20rem)] lg:px-[clamp(1.25rem,2vw,1.75rem)] lg:py-[clamp(1.5rem,2.2vw,2rem)]"
              >
                <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-linear-to-br from-green-400 to-green-600 text-3xl font-bold text-white shadow-lg shadow-green-200 lg:mb-[clamp(1rem,1.6vw,1.5rem)] lg:size-[clamp(3rem,4.3vw,4rem)] lg:text-[clamp(1.5rem,2.2vw,1.875rem)]">
                  {step.number}
                </div>

                <h3 className="max-w-xs font-fraunces text-2xl font-semibold leading-snug text-[#102f42] lg:text-[clamp(1.125rem,1.45vw,1.375rem)]">
                  {step.title}
                </h3>

                <p className="mt-4 max-w-xs text-base leading-relaxed text-slate-600 lg:mt-[clamp(0.5rem,1vw,1rem)] lg:text-[clamp(0.8125rem,0.95vw,0.9375rem)]">
                  {step.description}
                </p>

                <div className="mt-auto flex h-20 items-end justify-center pt-8 lg:h-[clamp(4rem,5.5vw,5rem)] lg:pt-[clamp(1rem,2vw,2rem)]">
                  <Image
                    src={step.icon}
                    alt=""
                    width={64}
                    height={64}
                    className="size-16 object-contain lg:size-[clamp(2.75rem,4.3vw,4rem)]"
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