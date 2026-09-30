"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Autoplay, Pagination, A11y, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import { useAccessibility } from "./accessibility/AccessibilityProvider";

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
  const { prefs } = useAccessibility();
  const swiperRef = useRef<SwiperInstance | null>(null);
  // Pausa manual pelo botão. Regra WCAG 2.2.2: todo conteúdo que se move
  // sozinho por mais de 5 segundos precisa de um jeito de pausar.
  const [pausedByUser, setPausedByUser] = useState(false);
  // Também para quando a pessoa ativa "Pausar animações" no menu de acessibilidade
  const paused = pausedByUser || prefs.reduceMotion;

  useEffect(() => {
    const autoplay = swiperRef.current?.autoplay;
    if (!autoplay) return;
    if (paused) autoplay.stop();
    else autoplay.start();
  }, [paused]);

  return (
    <div className="relative h-90 w-full overflow-hidden sm:h-120 md:h-140 lg:h-screen">
      <Swiper
        className="h-full w-full"
        // A11y: o Swiper adiciona rótulos para leitores de tela ("slide 1 de 5")
        // Keyboard: permite trocar de slide com as setas do teclado
        modules={[Autoplay, Pagination, A11y, Keyboard]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          if (paused) swiper.autoplay.stop();
        }}
        slidesPerView={1}
        loop
        keyboard={{ enabled: true }}
        a11y={{
          prevSlideMessage: "Slide anterior",
          nextSlideMessage: "Próximo slide",
          paginationBulletMessage: "Ir para o slide {{index}}",
          slideLabelMessage: "{{index}} de {{slidesLength}}",
        }}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          // Pausa enquanto o mouse está em cima, dando tempo de ver a imagem
          pauseOnMouseEnter: true,
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

      <button
        type="button"
        onClick={() => setPausedByUser((current) => !current)}
        // Com "Pausar animações" ligado o carrossel fica sempre parado
        disabled={prefs.reduceMotion}
        aria-label={paused ? "Continuar carrossel" : "Pausar carrossel"}
        className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-blue1 shadow-md disabled:opacity-50"
      >
        {paused ? <Play aria-hidden size={20} /> : <Pause aria-hidden size={20} />}
      </button>
    </div>
  );
}
