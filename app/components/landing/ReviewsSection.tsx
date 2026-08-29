import FadeScroll from "../fade-effect/FadeScroll";
import ReviewCards from "../cards/ReviewCards"


export default function ReviewsSection() {
  return (

      <FadeScroll>
        <section className="bg-blue-100 p-30 min-h-screen">
          <h1 className="font-fraunces font-medium text-4xl text-center">
            O que dizem sobre nossa plataforma
          </h1>
          <h2 className="text-center text-base m-5">Uma plataforma criada para tornar o acompanhamento nutricional e psicológico mais acessível, organizado e personalizado.</h2>
          <div className="flex md:flex-row flex-col gap-30 justify-center my-20 p-20">
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
