"use client";

import { Highlighter } from "@/components/ui/highlighter";
import FadeInProps from "../fade-effect/FadeScroll";
import CarouselHeroSection from "../CarouselHeroSection";

export default function Hero() {
  return (
    <FadeInProps>
      <section className="min-h-screen mb-0">
        <div className="flex flex-row">
          <div className=" w-full relative z-10 flex flex-col gap-2 justify-center bg-green-100 md:px-12 lg:px-20 overflow-hidden">
            <div className="max-w-3xl">
              <img src="/logo/nutrimente-v2.png" className="w-50" />
              <h1 className="md:text-4xl xl:text-6xl font-fraunces leading-tight">
                Consultas de psicólogos e nutricionistas
                <span className="text-blue-600"> em um só lugar</span>
              </h1>
              <h2 className="my-10 md:text-2xl">
                Plataforma com diversos nutricionistas e psicólogos para atender
                a sua necessidade.
              </h2>
            </div>

            <button className="flex items-center bg-green1 rounded-4xl mb-10 w-65 p-2 text-white font-bold">
              <img src="/icons/cronograma.png" alt="" className="w-10 mx-2" />
              Agendar uma consulta
            </button>

            <div className="flex flex-row gap-10 font-bold">
              <div className="flex flex-row items-center gap-2">
                <img src="/icons/security.png" />
                <p>Segurança e Privacidade</p>
              </div>

              <div className="flex flex-row items-center gap-2">
                <img src="/icons/time.png" />
                <p>Rápido Atendimento</p>
              </div>
            </div>
          </div>
          <CarouselHeroSection/>
        </div>
      </section>
    </FadeInProps>
  );
}
