"use client"; 
 
import { Navigation, Pagination, Autoplay } from 'swiper/modules'; 
import { Swiper, SwiperSlide } from 'swiper/react';
import "swiper/css";
import "swiper/css/pagination";

export default function Cadastro(){ 
    return( 
        <section>
            <h1 className='text-5xl text-center m-10'>Cadastro</h1> 
            <div className='flex flex-row'>
                <div className='w-full text-center bg-blue-300'>
                    <form action="">
                        <div>
                            <label htmlFor="name">Nome completo:</label>
                        </div>

                        <div>
                            <label htmlFor="birthdate">Data de nascimento:</label>
                        </div>

                        <div>
                            <label htmlFor="gender">Selecione seu gênero: </label>
                        </div>

                            
                        <div>
                            <label htmlFor="cpf">CPF:</label>
                        </div>

                        <div>
                            <label htmlFor="numberphone">Número de celular:</label>
                        </div>

                        <div>
                            <label htmlFor="email">E-mail:</label>
                        </div>

                        <div>
                            <label htmlFor="password">Senha</label>
                        </div>
                    </form>
                </div>


                <Swiper 
                    className='w-full h-[900px] bg-green-300'
                    modules={[Autoplay, Pagination]} 
                    slidesPerView={1} 
                    autoplay={{ 
                        delay: 3000, 
                        disableOnInteraction: false 
                    }} 
                    pagination
                    loop={true}
                > 
                    <SwiperSlide> 
                        <img 
                            src="/psicologo.jpeg" 
                            alt="" 
                            className="w-full h-full object-contain" 
                        /> 
                    </SwiperSlide> 
    
                    <SwiperSlide> 
                        <img 
                            src="/psicologo2.jpg" 
                            alt="" 
                            className="w-full h-full object-contain "  
                        /> 
                    </SwiperSlide>
                </Swiper> 
            </div>
        </section> 
    )
}