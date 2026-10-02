"use client"
import Image from "next/image";
import FadeScroll from "../fade-effect/FadeScroll";
import LandingButton from "../buttons/LandingButton";

export default function CTASection() {
  return (
    <FadeScroll>
      <section className="flex justify-center md:min-h-screen px-4 pb-16 pt-28 md:px-8 md:pb-28 md:pt-36">
        <div className="relative flex w-full max-w-355 flex-col items-center rounded-4xl bg-linear-to-t from-green2 to-blue4 md:min-h-120 md:flex-row">
          {/* Fundo decorativo: só ele é cortado pelos cantos arredondados */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-4xl">
            <Image
              src="/background/fundo-cta.png"
              alt=""
              aria-hidden
              fill
              sizes="(min-width: 1420px) 1420px, 100vw"
              className="object-cover opacity-15"
            />
          </div>

          {/* Foto: vaza pelo topo do card em todos os tamanhos */}
          <div className="relative flex w-full items-end justify-center self-end md:w-1/2">
            <Image
              src="/doctor/nutricionista.png"
              alt="Nutricionista sorrindo, de braços cruzados"
              width={600}
              height={700}
              className="-mt-20 h-auto max-h-80 w-auto object-contain md:-mt-24 md:max-h-144"
            />
          </div>

          {/* Texto e CTA */}
          <div className="relative flex w-full flex-col items-center gap-6 p-8 text-center md:w-1/2 md:items-start md:gap-10 md:p-20 md:text-left">
            <h2 className="font-fraunces text-3xl font-medium text-white md:text-4xl">
              Pronto para transformar sua saúde mental e alimentar?
            </h2>
            <LandingButton href="/register/patient" />
          </div>
        </div>
      </section>
    </FadeScroll>
  );
}