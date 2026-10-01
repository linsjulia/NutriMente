import FadeScroll from "../fade-effect/FadeScroll";
import ReviewCards from "../cards/ReviewCards";

export default function ReviewsSection() {
  return (
    <FadeScroll>
      <section className="flex flex-col justify-center overflow-x-clip bg-blue-100 px-4 py-16 md:px-8 md:py-24 lg:min-h-screen lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-fraunces text-3xl font-medium md:text-4xl lg:text-[clamp(2rem,2.6vw,3rem)]">
            O que dizem sobre nossa plataforma
          </h2>
          <p className="mt-4 text-base text-balance lg:text-[clamp(0.875rem,1.05vw,1.125rem)]">
            Uma plataforma criada para tornar o acompanhamento nutricional e
            psicológico mais acessível, organizado e personalizado.
          </p>
        </div>

        <div className="mx-auto mt-10 flex w-full max-w-2xl flex-col gap-6 md:mt-16 lg:max-w-6xl lg:flex-row lg:gap-[clamp(1.5rem,3vw,3rem)]">
          <div className="flex min-w-0 flex-1 [&>*]:w-full [&>*]:min-w-0">
            <ReviewCards
              titulo="Mariana S., Paciente"
              avaliacao="O NutriMente facilitou muito minha rotina. Antes eu perdia os papéis da dieta, agora recebo as metas direto no celular e os lembretes de consulta me ajudam a não esquecer de nada. Muito prático!"
              img="/patient/paciente2.png"
            />
          </div>

          <div className="flex min-w-0 flex-1 [&>*]:w-full [&>*]:min-w-0">
            <ReviewCards
              titulo="Dr. Ricardo, Nutricionista"
              avaliacao="Como profissional, a gestão da agenda ficou muito mais organizada. O diário alimentar com fotos que os pacientes enviam me permite dar um feedback muito mais preciso entre as consultas."
              img="/doctor/doctor-pfp.png"
            />
          </div>
        </div>
      </section>
    </FadeScroll>
  );
}