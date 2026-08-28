"use client"; 

import { useState } from 'react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'; 
import { Swiper, SwiperSlide } from 'swiper/react';
import "swiper/css";
import "swiper/css/pagination";
import Button from "../components/Button"
import Logo from "../components/Logo"
import RegisterPatient from '../components/RegisterPatient';
import RegisterProfessional from '../components/RegisterProfessional';

export default function Cadastro(){ 
    const [selected, setSelected] = useState("women");

    const options = [
        { id: "women", label: "Feminino" },
        { id: "men", label: "Masculino" },
    ];

    return( 
        <section>
            <div className='flex flex-row'> {/* FLEX PAI 1 */} 
                {/* ! BOTAO - TIPO CADASTRO */}
                {/* <div className='flex flex-col w-full h-full'>
                    <h1 className="text-5xl leading-1 font-medium font-fraunces text-start">
                        Bem vindo!
                    </h1>
                    <p className="text-start">
                        Para se cadastrar, preencha as informações abaixo
                    </p>


                    <div className='flex flex-col'>
                        <div>
                            <input type="radio" name="type-register"/>
                            <label htmlFor="nutritionist">Psicólogo</label>
                        </div>
                        <div>

                        <input type="radio" name="type-register"/>
                        <label htmlFor="psychologist">Psicólogo</label>

                        </div>
                    </div> 
                      
                </div> */}

                <RegisterProfessional/>  
               
                <div className='bg-blue-100 w-1/2 flex justify-center items-center h-screen'>
                    <img src="/nutrimenteLogo.png" className='w-[397px] h-[397px] shadow-lg' />
                </div>
            </div>
        </section> 
    )
}