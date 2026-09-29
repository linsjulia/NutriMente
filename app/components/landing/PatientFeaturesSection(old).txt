import FadeScroll from "../fade-effect/FadeScroll";
import CardFeatures from "../cards/CardFeatures";

export default function PatientFeaturesSection() {
  return (
    <FadeScroll>
      <section className="bg-blue-100 min-h-screen flex flex-col justify-center">
        <h1 className="font-fraunces font-medium text-4xl text-center">
          Para <span className="text-[#0069F6]">Pacientes</span>
        </h1>
        <h2 className="text-base text-center mb-20">
          Cuidado personalizado, do primeiro contato ao acompanhamento contínuo.
        </h2>
        <div className=" flex justify-center flex-row items-center gap-20">
          <div>
            <img
              src="/patient/pacientes.jfif"
              alt=""
              className="object-cover w-125 rounded-2xl border border-blue-900"
            />
          </div>

          <div className="flex flex-col gap-10">
            <CardFeatures
              titulo="Avaliação Inicial Inteligente"
              descricao="Conte-nos seus objetivos e receba um acompanhamento personalizado."
            />
            {/* <img src="decoration.png" alt="" className="w-13 p-0 m-2" /> */}
            <CardFeatures
              titulo="Consultas online ou presenciais"
              descricao="Encontre horários e agende consultas com nutricionistas e psicólogos pelo aplicativo."
            />
            {/* <img src="decoration.png" alt="" className="w-13 p-0 m-0" /> */}
            <CardFeatures
              titulo="Diário Alimentar e de Rotina"
              descricao="Compartilhe fotos de refeições, anotações e relatos com seu profissional."
            />
          </div>
        </div>
      </section>
    </FadeScroll>
  );
}
