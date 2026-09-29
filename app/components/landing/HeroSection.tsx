"use client";

import FadeScroll from "../fade-effect/FadeScroll";
import CarouselHeroSection from "../CarouselHeroSection";
import Button from "../buttons/LandingButton";

export default function Hero() {
  return (
    <FadeScroll>
      <section className="min-h-screen">
        <div className="flex min-h-screen flex-col lg:flex-row">
          {/* Conteúdo principal */}
          <div className="relative z-10 flex w-full flex-col justify-center gap-6 overflow-hidden bg-green-100 px-6 sm:px-10 md:px-12 lg:w-1/2 lg:px-20">
            <div className="max-w-3xl">
              <img
                src="/logo/nutrimente-v2.png"
                alt="Nutrimente"
                className="w-40 sm:w-48"
              />

              <h1 className="font-fraunces text-3xl leading-tight sm:text-4xl md:text-5xl xl:text-6xl">
                Consultas de psicólogos e nutricionistas{" "}
                <span className="text-blue-600">em um só lugar</span>
              </h1>

              <h2 className="my-6 text-lg leading-relaxed sm:my-8 sm:text-xl md:text-2xl">
                Plataforma com diversos nutricionistas e psicólogos para atender
                a sua necessidade.
              </h2>
            </div>

            <Button href="/login" />

            <div className="flex flex-col gap-4 font-bold sm:flex-row sm:flex-wrap sm:gap-8">
              <div className="flex items-center gap-2">
                <img
                  src="/icons/security.png"
                  alt=""
                  className="h-8 w-8 object-contain"
                />
                <p>Segurança e Privacidade</p>
              </div>

              <div className="flex items-center gap-2">
                <img
                  src="/icons/time.png"
                  alt=""
                  className="h-8 w-8 object-contain"
                />
                <p>Rápido Atendimento</p>
              </div>
            </div>
          </div>

          {/* Carrossel */}
          <div className="w-full lg:flex lg:w-1/2">
            <CarouselHeroSection />
          </div>
        </div>
      </section>
    </FadeScroll>
  );
}
