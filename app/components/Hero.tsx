"use client"

import SliderHero from "./CarouselHero"


 export default function Hero(){
    return(

        <section className="min-h-screen mb-0">
            <div className="flex flex-row">



                {/* Text */}
                
                    <div className="inset-0 w-full relative z-10 flex flex-col justify-center bg-linear-30 from-indigo-300 to-green-200 md:px-12 lg:px-20 overflow-hidden border-1 border-green-700">
                        <div className="max-w-3xl">
                            <h1 className="md:text-4xl xl:text-6xl font-fraunces leading-tight">Consultas de psicólogos e nutricionistas 
                            <span className="text-blue-600"> em um só lugar</span></h1>  
                            <h2 className="my-10 md:text-2xl">Plataforma  com diversos nutricionistas e psicólogos para atender a sua necessidade.</h2>
                        </div>
                        

                        <button className="flex items-center  bg-green1 rounded-4xl mb-10 p-2 w-65 text-white font-bold">
                            <img src="/cronograma.png" alt="" className="w-10 mx-2  "/>
                            Agendar uma consulta
                        </button>

                    </div>
                         <SliderHero/>
                

           



            </div>
        </section>


    )
 }

