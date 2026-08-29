import FadeScroll from "../fade-effect/FadeScroll";

export default function CTASection() {
  return (
    <FadeScroll>
      <section className="flex justify-center items-center min-h-screen">
        <div className="flex flex-row justify-between items-center relative w-355 h-120.75 m-20 rounded-4xl bg-linear-to-t from-green2 to-blue4">
          <img
            src="/background/fundo-cta.png"
            className="w-full h-full object-cover opacity-15 absolute"
          />

          <div className="flex justify-center items-end">
            <img src="/doctor/nutricionista.png" className="w-[1910px] h-full mb-10" />
          </div>

          <div className="flex flex-col gap-10 p-20 w-[1800px]">
            <h1 className="text-white font-fraunces text-4xl font-medium">
              Pronto para transformar sua saúde mental e alimentar?
            </h1>
            <button className="flex items-center  bg-green-400 rounded-4xl mb-10 p-2 w-65 text-white font-bold">
              <img src="/icons/cronograma.png" alt="" className="w-10 mx-2" />
              Agendar uma consulta
            </button>
          </div>
        </div>
      </section>
    </FadeScroll>
  );
}
