
export default function CTA(){
    return(
        <section className="flex justify-center m-30">
          <div className="flex flex-row justify-between items-center relative w-[1420px] h-[483px] m-20 rounded-4xl bg-linear-to-t from-green2 to-blue4">
            <img
              src="/fundo-cta.png"
              className="w-full h-full object-cover opacity-15 absolute"
            />

            <div className="flex justify-center items-end">
              <img
                src="/nutricionista.png"
                className="w-[1910px] h-full mb-10"
              />
            </div>

            <div className="flex flex-col gap-10 p-20 w-[1800px]">
              <h1 className="text-white font-fraunces text-4xl font-medium">
                Pronto para transformar sua saúde mental e alimentar?
              </h1>
              <button className="flex items-center  bg-green-400 rounded-4xl mb-10 p-2 w-65 text-white font-bold">
                <img src="/cronograma.png" alt="" className="w-10 mx-2" />
                  Agendar uma consulta
              </button>
            </div>
          </div>
        </section>
    )
}