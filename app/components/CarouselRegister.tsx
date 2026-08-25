
import {Swiper, SwiperSlide} from "swiper/react"
import {Autoplay, Pagination} from "swiper/modules"



export default function CarouselRegister(){
                <Swiper 
                    className='w-full h-full'
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
                            className="w-full h-[950px] object-cover rounded-4xl" 
                        /> 
                    </SwiperSlide> 
    
                    <SwiperSlide> 
                        <img 
                            src="/psicologo2.jpg" 
                            alt="" 
                            className="w-full h-[950px] object-cover rounded-4xl"  
                        /> 
                    </SwiperSlide>
                </Swiper> 
}