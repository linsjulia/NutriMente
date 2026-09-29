"use client";

import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";

const slides = [
  {
    src: "/patient/paciente.jpg",
    alt: "Paciente em atendimento",
  },
  {
    src: "/doctor/nutricionista2.jpg",
    alt: "Nutricionista realizando atendimento",
  },
  {
    src: "/doctor/psicologo6.jpg",
    alt: "Psicólogo realizando atendimento",
  },
  {
    src: "/doctor/nutricionista3.jpg",
    alt: "Nutricionista em consulta",
  },
  {
    src: "/doctor/psicologo5.jpg",
    alt: "Psicólogo em atendimento",
  },
];

export default function CarouselHeroSection() {
  return (
    <div className="h-90 w-full overflow-hidden sm:h-120 md:h-140 lg:h-screen">
      <Swiper
        className="h-full w-full"
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        loop
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.src} className="h-full w-full">
            <img
              src={slide.src}
              alt={slide.alt}
              className="h-full w-full object-cover object-center"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
