import FadeScroll from "../fade-effect/FadeScroll";
import ReviewCards from "../cards/ReviewCards"


export default function ReviewsSection() {
  return (

      <FadeScroll>
        <section className="bg-blue-100 px-4 py-16 sm:px-8 md:py-24">
          <h2 className="font-fraunces font-medium text-3xl sm:text-4xl text-center">
            O que dizem sobre nossa plataforma
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center">Uma plataforma criada para tornar o acompanhamento nutricional e psicológico mais acessível, organizado e personalizado.</p>
          <div className="mt-12 flex flex-col items-center gap-8 lg:flex-row lg:items-stretch lg:justify-center">
            <ReviewCards
              titulo="Mariana S., Paciente"
              avaliacao="O NutriMente facilitou muito minha rotina. Antes eu perdia os papéis da dieta, agora recebo as metas direto no celular e os lembretes de consulta me ajudam a não esquecer de nada. Muito prático!"
              img="/patient/paciente2.png"
            />

            <ReviewCards
              titulo="Dr. Ricardo, Nutricionista"
              avaliacao="Como profissional, a gestão da agenda ficou muito mais organizada. O diário alimentar com fotos que os pacientes enviam me permite dar um feedback muito mais preciso entre as consultas."
              img="/doctor/doctor-pfp.png"
            />
          </div>
        </section>
      </FadeScroll>

  )
}
