"use client"

import SliderHero from "./CarouselHero"
import { Highlighter } from "@/components/ui/highlighter"

 export default function Hero(){
    return(

        <section className="min-h-screen mb-0">
            <div className="flex flex-row">
                
                    <div className=" w-full relative z-10 flex flex-col gap-2 justify-center bg-linear-30 from-indigo-300 to-green-200 md:px-12 lg:px-20 overflow-hidden">
                        <div className="max-w-3xl">
                            
                                {/* <Highlighter action="underline" color="#00DD5C" animationDuration={1} strokeWidth={4.0}>
                                    <h1 className="md:text-7xl text-blue1 font-fraunces leading-tight bg-gradient-to-r from-blue-600 to-teal-400 bg-clip-text text-transparent">NutriMente</h1>
                                </Highlighter> */}

                            <img src="/logo-fundo-branco.png" className="w-60" />
                            <h1 className="md:text-4xl xl:text-6xl font-fraunces leading-tight">Consultas de psicólogos e nutricionistas 
                            <span className="text-blue-600"> em um só lugar</span></h1>  
                            <h2 className="my-10 md:text-2xl">Plataforma  com diversos nutricionistas e psicólogos para atender a sua necessidade.</h2>
                        </div>
                         

                        <button className="flex items-center bg-green1 rounded-4xl mb-10 w-65 p-2 text-white font-bold">
                            <img src="/cronograma.png" alt="" className="w-10 mx-2"/>
                            Agendar uma consulta
                        </button>

                        <div className="flex flex-row gap-10 font-bold">
                            <div className="flex flex-row items-center gap-2">
                                <img src="security.png"/>
                                <p>Segurança e Privacidade</p>
                            </div>

                            <div className="flex flex-row items-center gap-2">
                                <img src="time.png"/>
                                <p>Rápido Atendimento</p>
                            </div>
                        </div>

                    </div>
                    <SliderHero/>
            </div>
        </section>


    )
 }

