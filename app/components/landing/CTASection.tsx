import { Highlighter } from "@/components/ui/highlighter";
import FadeScroll from "../fade-effect/FadeScroll";
import { Apple, ArrowRight, Brain, CalendarCheck, ShieldCheck, Video } from "lucide-react";
import Image from "next/image";
import LandingButton from "../buttons/LandingButton";

export default function CTASection() {
  return (
    <FadeScroll>
      <section className="relative mx-auto max-w-6xl pt-8 md:pt-12">
        <div className="relative rounded-[2rem] bg-[linear-gradient(135deg,#0a4cc4_0%,#1f6ff2_50%,#45a9f7_100%)] shadow-[0_25px_60px_-15px_rgba(30,100,220,0.45)]">
          <div className="relative grid items-center gap-4 md:grid-cols-[5fr_7fr] md:gap-8">
            {/* image column */}
            <div className="relative order-2 flex justify-center md:order-1 md:self-stretch">
              <div className="absolute bottom-0 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-[#d6e6ff]/15 md:h-72 md:w-72" />
              <Image
                src="/doctor/nutricionista.png"
                alt="Nutricionista sorrindo segurando uma prancheta"
                width={800}
                height={1000}
                priority
                sizes="(min-width: 768px) 600px, 300px"
                className="relative z-10 h-auto w-[75%] max-w-75 object-contain md:absolute md:-top-14 md:bottom-0 md:-left-10 md:h-[calc(100%+3.5rem)] md:w-auto md:max-w-none md:object-bottom"
              />
              {/* floating badges */}
              <div className="absolute left-0 top-1/2 z-20 hidden animate-float items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-[0_10px_30px_-8px_rgba(10,40,120,0.35)] md:flex">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#d6e6ff] text-[#1e56d6]">
                  <Brain className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-[#0b2545]">Psicologia</span>
              </div>
              <div
                className="absolute -right-4 bottom-8 z-20 hidden animate-float items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-[0_10px_30px_-8px_rgba(10,40,120,0.35)] md:flex"
                style={{ animationDelay: "1.5s" }}
              >
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#d5f8e3] text-[#0b2545]">
                  <Apple className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-[#0b2545]">Nutrição</span>
              </div>
            </div>

            {/* text column */}
            <div className="relative z-20 order-1 px-6 pt-8 md:order-2 md:px-10 md:py-10 lg:pr-14">
              <h2 className="font-display text-2xl font-semibold leading-tight text-white font-fraunces sm:text-3xl md:text-4xl">
                Pronto para transformar sua saúde{" "}
                <Highlighter action="underline" color="#00e3d0" strokeWidth={3} isView={true} animationDuration={1500}>
                  mental
                </Highlighter>
                  {" "}e{" "}

                 <Highlighter action="underline" color="#00e3d0" strokeWidth={3} isView={true} animationDuration={1500}>
                    alimentar?
                 </Highlighter>
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#d6e6ff] md:text-base">
                Para quem busca cuidado e para quem cuida: psicólogos e nutricionistas em uma só
                plataforma, com consultas online e acompanhamento contínuo.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <LandingButton href="/register/patient"/>
                <a
                  href="#"
                  className="inline-flex items-center rounded-full border-2 border-[#d6e6ff]/40 px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-[#d6e6ff]/10"
                >
                  Sou profissional
                </a>
              </div>

              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#d6e6ff]/20 pt-4 pb-6 text-sm text-white md:pb-0">
                <li className="flex items-center gap-2">
                  <Video className="h-6 w-6 text-[#6ee7d7]" /> Atendimento por vídeo
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-[#6ee7d7]" /> Profissionais verificados
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </FadeScroll>
  );
}