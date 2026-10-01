import Image from "next/image";
import FadeScroll from "../fade-effect/FadeScroll";
import LandingButton from "../buttons/LandingButton";

export default function CTASection() {
  return (
    <FadeScroll>
      <section className="flex justify-center px-4 pb-16 pt-28 md:px-8 md:pb-28 md:pt-36">
        <div className="relative flex w-full max-w-355 flex-col items-center rounded-4xl bg-linear-to-t from-green2 to-blue4 lg:min-h-[clamp(22rem,32vw,30rem)] lg:flex-row lg:justify-end">
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

          {/* Texto */}
          <div className="relative order-1 flex w-full flex-col items-center gap-6 p-8 text-center md:p-12 lg:w-1/2 lg:items-start lg:gap-10 lg:p-16 xl:p-20 lg:text-left">
            <h2 className="font-fraunces text-3xl font-medium text-white md:text-4xl">
              Pronto para transformar sua saúde mental e alimentar?
            </h2>
            <LandingButton href="/login" />
          </div>

          {/* Foto: mobile no fluxo normal / desktop absoluta, proporcional ao card */}
          <div className="relative order-2 flex w-full justify-center lg:static lg:w-0 lg:flex-none">
            <Image
              src="/doctor/nutricionista.png"
              alt="Nutricionista sorrindo, de braços cruzados"
              width={600}
              height={700}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="-mt-20 h-auto max-h-80 w-auto object-contain lg:absolute lg:bottom-0 lg:left-0 lg:mt-0 lg:h-[125%] lg:max-h-none lg:max-w-none"
            />
          </div>
        </div>
      </section>
    </FadeScroll>
  );
}