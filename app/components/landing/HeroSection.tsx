import Image from "next/image";
import FadeScroll from "../fade-effect/FadeScroll";
import CarouselHeroSection from "../CarouselHeroSection";
import LandingButton from "../buttons/LandingButton";
import { Clock, ShieldCheck, UserRoundPlus } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <FadeScroll>
      <section className="lg:min-h-screen">
        <div className="flex flex-col lg:min-h-screen lg:flex-row">
          {/* Conteúdo principal */}
          <div className="relative z-10 flex w-full flex-col gap-26 overflow-hidden bg-green-100 px-6 py-10 sm:px-10 md:px-12 lg:w-1/2 lg:gap-4 lg:px-12 lg:py-6 xl:gap-10 xl:px-20 2xl:gap-6 2xl:px-20 2xl:py-12">
            <div className="max-w-3xl">
              <Image
                src="/logo/nutrimente-v2.png"
                alt="NutriMente"
                width={192}
                height={194}
                preload
                className="h-auto w-32 sm:w-40 lg:w-28 xl:w-28 2xl:w-48"
              />

              <h1 className="mt-2 font-fraunces font-semibold text-3xl leading-tight sm:text-4xl md:text-5xl lg:text-3xl xl:text-4xl 2xl:text-6xl">
                Consultas de psicólogos e nutricionistas{" "}
                <span className="text-blue-600">em um só lugar</span>
              </h1>

              <h2 className="my-4 text-lg leading-relaxed font-medium! sm:text-xl md:my-6 md:text-2xl lg:my-3 lg:text-base xl:my-4 xl:text-lg 2xl:my-8 2xl:text-2xl">
                Plataforma com diversos nutricionistas e psicólogos para atender
                a sua necessidade.
              </h2>
            </div>

            <div className="grid w-full max-w-xl grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="*:w-full *:justify-center">
                <LandingButton href="/register/patient" />
              </div>
              <Link
                href="/register/professional"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-blue1 text-base font-semibold text-blue1 transition-all hover:bg-blue1/10 hover:-translate-y-0.5"
              >
                <UserRoundPlus className="h-5 w-5" aria-hidden />
                Sou profissional       
              </Link>
              <ul className="col-span-full mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-blue1/30 pt-4 pb-6 text-sm text-white md:pb-0" />

              <div className="flex items-center justify-center gap-2 font-bold text-nm-ink">
                <ShieldCheck className="h-6 w-6 text-blue1" aria-hidden />
                <p>Segurança e Privacidade</p>
              </div>

              <div className="flex items-center justify-center gap-2 font-bold text-nm-ink">
                <Clock className="h-6 w-6 text-blue1" aria-hidden />
                <p>Rápido Atendimento</p>
              </div>
            </div>
          </div>

          {/* Carrossel */}
          <div className="h-80 w-full sm:h-96 lg:h-auto lg:w-1/2 lg:flex">
            <CarouselHeroSection />
          </div>
        </div>
      </section>
    </FadeScroll>
  );
}