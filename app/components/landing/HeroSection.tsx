import Image from "next/image";
import FadeScroll from "../fade-effect/FadeScroll";
import CarouselHeroSection from "../CarouselHeroSection";
import Button from "../buttons/LandingButton";

export default function Hero() {
  return (
    <FadeScroll>
      <section className="lg:min-h-screen">
        <div className="flex flex-col lg:min-h-screen lg:flex-row">
          {/* Conteúdo principal */}
          <div className="relative z-10 flex w-full flex-col gap-24 overflow-hidden bg-green-100 px-6 py-10 sm:px-10 md:px-12 lg:w-1/2 lg:gap-4 lg:px-12 lg:py-6 xl:gap-4 xl:px-14 2xl:gap-6 2xl:px-20 2xl:py-12">
            <div className="max-w-3xl">
              <Image
                src="/logo/nutrimente-v2.png"
                alt="NutriMente"
                width={192}
                height={194}
                preload
                className="h-auto w-32 sm:w-40 lg:w-28 xl:w-28 2xl:w-48"
              />

              <h1 className="mt-2 font-fraunces text-3xl leading-tight sm:text-4xl md:text-5xl lg:text-3xl xl:text-4xl 2xl:text-6xl">
                Consultas de psicólogos e nutricionistas{" "}
                <span className="text-blue-600">em um só lugar</span>
              </h1>

              <h2 className="my-4 text-lg leading-relaxed sm:text-xl md:my-6 md:text-2xl lg:my-3 lg:text-base xl:my-4 xl:text-lg 2xl:my-8 2xl:text-2xl">
                Plataforma com diversos nutricionistas e psicólogos para atender
                a sua necessidade.
              </h2>
            </div>

            <div className="self-start">
              <Button href="/register/patient" />
            </div>

            <div className="flex flex-col gap-3 font-bold sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3 lg:text-sm 2xl:text-base">
              <div className="flex items-center gap-2">
                <Image
                  src="/icons/security.png"
                  alt=""
                  width={49}
                  height={49}
                  className="h-6 w-6 object-contain 2xl:h-8 2xl:w-8"
                />
                <p>Segurança e Privacidade</p>
              </div>

              <div className="flex items-center gap-2">
                <Image
                  src="/icons/time.png"
                  alt=""
                  width={49}
                  height={49}
                  className="h-6 w-6 object-contain 2xl:h-8 2xl:w-8"
                />
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