'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';
import ReviewCard from '../cards/ReviewCards';
import 'swiper/css';
import 'swiper/css/pagination';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  crp: string;
  avatarSrc: string;
  quote: string;
  highlightedText?: string;
}

const testimonialsData: Testimonial[] = [
  {
    id: '1',
    name: 'Marina Santos',
    role: 'Paciente',
    crp: 'CRN 00/00000',
    avatarSrc: '/patient/marina-review.webp',
    quote: 'Eu fazia terapia e dieta em lugares separados e nada conversava entre si. Aqui o nutricionista e a psicóloga acompanham minha rotina, e os checklists me ajudam a manter o ritmo.',
  },
  {
    id: '2',
    name: 'Dra. Camila Ribeiro',
    role: 'Psicóloga',
    crp: 'CRP 00/00000',
    avatarSrc: '/doctor/camila-review.webp',
    quote: 'Consigo organizar minha agenda, definir meus horários e valores e acompanhar a evolução de cada paciente em um só lugar. O cadastro com verificação do registro passa confiança.',
  },
  {
    id: '3',
    name: 'Rafael Torres',
    role: 'Paciente',
    crp: 'CRN 00/00000',
    avatarSrc: '/patient/rafael-review.webp',
    quote: 'Agendei, paguei com o saldo da conta e a confirmação veio na hora. A consulta por vídeo funcionou sem complicação e os lembretes me ajudam a não esquecer as metas.',
  },
  {
    id: '4',
    name: 'Dr. André Menezes',
    role: 'Nutricionista',
    crp: 'CRP 00/00000',
    avatarSrc: '/doctor/andre-review.jpg',
    quote: 'Os planos personalizados e as metas quinzenais deixam o acompanhamento muito mais próximo. Trabalhar junto com a psicologia mostra resultados que a dieta sozinha não alcança.',
  },
  {
    id: '5',
    name: 'Beatriz Lima',
    role: 'Paciente',
    crp: 'CRN 00/00000',
    avatarSrc: '/patient/beatriz-review.webp',
    quote: 'Poder registrar minhas refeições com foto e anotações fez diferença. Meu profissional ajusta o plano conforme eu evoluo, e eu me sinto realmente acompanhada.',
  },
];

function ArrowButton({
  direction,
  onClick,
  className = '',
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  className?: string;
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Depoimento anterior' : 'Próximo depoimento'}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:scale-110 hover:bg-slate-50 active:scale-95 transition-transform ${className}`}
    >
      <Icon aria-hidden size={22} />
    </button>
  );
}

export default function ReviewsSection() {
  const swiperRef = useRef<SwiperClass | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const autoplay = swiperRef.current?.autoplay;
    if (!autoplay) return;
    if (paused) autoplay.stop();
    else autoplay.start();
  }, [paused]);

  const prev = () => swiperRef.current?.slidePrev();
  const next = () => swiperRef.current?.slideNext();

  return (
    <section className="w-full bg-blue-100 py-16 px-4 flex flex-col items-center justify-center font-sans">
      <div className="text-center max-w-2xl mb-12">
        <h2 className="text-3xl md:text-4xl font-semibold font-fraunces mb-3 text-slate-800">
          O que dizem sobre o NutriMente
        </h2>
        <p className="text-slate-600 text-sm md:text-base">
          Uma plataforma criada para tornar o acompanhamento nutricional e psicológico mais acessível.
        </p>
      </div>

      <div className="w-full flex flex-col items-center">
        {/* Container principal */}
        <div className="w-full max-w-4xl relative px-2 md:px-0 ">
          {/* Seta esquerda no background */}
          <ArrowButton
            direction="prev"
            onClick={prev}
            className="absolute -left-6 md:-left-16 top-1/2 z-20 hidden -translate-y-1/2 md:flex"
          />
          {/* Seta direita no background */}
          <ArrowButton
            direction="next"
            onClick={next}
            className="absolute -right-6 md:-right-16 top-1/2 z-20 hidden -translate-y-1/2 md:flex"
          />

          <Swiper
            modules={[Navigation, Pagination, A11y, Autoplay]}
            onBeforeInit={(swiper) => {
              swiperRef.current = swiper;
            }}
            initialSlide={0}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            spaceBetween={0}
            slidesPerView={1}
            loop={true}
            autoHeight={false}
            autoplay={{
              delay: 4500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            /* As classes [&_.swiper-wrapper] e [&_.swiper-slide] nivelam a altura de todos os slides */
            className="w-full rounded-3xl shadow-xl shadow-blue-700/10 [&_.swiper-wrapper]:flex [&_.swiper-slide]:h-auto"
          >
            {testimonialsData.map((item) => (
              <SwiperSlide key={item.id} className="h-full">
                <ReviewCard {...item} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Paginação e pausa inferior */}
        <div className="flex items-center gap-1 mt-6">
          <ArrowButton direction="prev" onClick={prev} className="mr-2 md:hidden" />

          {testimonialsData.map((_, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={index}
                type="button"
                onClick={() => swiperRef.current?.slideToLoop(index)}
                className="flex h-6 min-w-6 items-center justify-center cursor-pointer"
                aria-label={`Ir para o depoimento ${index + 1}`}
                aria-current={isActive ? 'true' : undefined}
              >
                <span
                  aria-hidden
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive ? 'w-6 bg-slate-800' : 'w-2 bg-slate-300'
                  }`}
                />
              </button>
            );
          })}

          <ArrowButton direction="next" onClick={next} className="ml-2 md:hidden" />

          <button
            type="button"
            onClick={() => setPaused((current) => !current)}
            aria-label={paused ? 'Continuar depoimentos' : 'Pausar depoimentos'}
            className="ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-md hover:bg-slate-50 transition"
          >
            {paused ? <Play aria-hidden size={16} /> : <Pause aria-hidden size={16} />}
          </button>
        </div>
      </div>
    </section>
  );
}