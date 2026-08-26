import { Navigation, Pagination, Scrollbar, A11y, Autoplay } from 'swiper/modules';
import {Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

export default function SliderHero(){
    return(

                <Swiper 
                    className='w-full h-full'
                    modules={[Autoplay, Pagination]} 
                    slidesPerView={1} 
                    autoplay={{ 
                        delay: 3000, 
                        disableOnInteraction: false}} 
                    pagination
                    loop={true}
                > 
                    <SwiperSlide> 
                        <img 
                            src="/paciente.jpg" 
                            alt="" 
                            className="w-full h-[870px] object-cover " 
                        /> 
                    </SwiperSlide> 
    
                    <SwiperSlide> 
                        <img 
                            src="/nutricionista2.jpg" 
                            alt="" 
                            className="w-full h-[870px] object-cover "  
                        /> 
                    </SwiperSlide>

                    <SwiperSlide>   
                        <img 
                            src="/psicologo6.jpg" 
                            alt="" 
                            className="w-full h-[870px] object-cover "  
                        /> 
                    </SwiperSlide>

                    <SwiperSlide> 
                        <img 
                            src="/nutricionista3.jpg" 
                            alt="" 
                            className="w-full h-[870px] object-cover "  
                        /> 
                    </SwiperSlide>

                    <SwiperSlide> 
                        <img 
                            src="/psicologo5.jpg" 
                            alt="" 
                            className="w-full h-[870px] object-cover "  
                        /> 
                    </SwiperSlide>
                </Swiper> 

    )
}