import {
  Navigation,
  Pagination,
  Scrollbar,
  A11y,
  Autoplay,
} from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";

export default function CarouselHeroSection() {
  return (
    <Swiper
      className="w-full h-full"
      modules={[Autoplay, Pagination]}
      slidesPerView={1}
      autoplay={{
        delay: 3000,
        disableOnInteraction: false,
      }}
      pagination
      loop={true}
    >
      <SwiperSlide>
        <img
          src="/patient/paciente.jpg"
          alt=""
          className="w-full h-217.5 object-cover "
        />
      </SwiperSlide>

      <SwiperSlide>
        <img
          src="/doctor/nutricionista2.jpg"
          alt=""
          className="w-full h-217.5 object-cover "
        />
      </SwiperSlide>

      <SwiperSlide>
        <img
          src="/doctor/psicologo6.jpg"
          alt=""
          className="w-full h-217.5 object-cover "
        />
      </SwiperSlide>

      <SwiperSlide>
        <img
          src="/doctor/nutricionista3.jpg"
          alt=""
          className="w-full h-217.5 object-cover "
        />
      </SwiperSlide>

      <SwiperSlide>
        <img
          src="/doctor/psicologo5.jpg"
          alt=""
          className="w-full h-217.5 object-cover "
        />
      </SwiperSlide>
    </Swiper>
  );
}
