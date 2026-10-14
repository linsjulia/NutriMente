'use client';

import { useRef, useState, useEffect } from 'react';
import { Pause, Play } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';
import ReviewCard from '../cards/ReviewCards';

import 'swiper/css'
import 'swiper/css/pagination';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  crp: string;
  avatarLetter: string;
  quote: string;
  highlightedText?: string;
  bgLeftColor: string;
}

// Cores escuras o bastante para o texto branco (contraste >= 4,5:1, WCAG 1.4.3)
const testimonialsData: Testimonial[] = [
  {
    id: '1',
    name: 'Dra. Márcia',
    role: 'Nutricionista',
    crp: 'CRN 00/00000',
    avatarLetter: 'M',
    quote: 'Acompanhar a evolução dos pacientes ficou muito mais intuitivo e prático.',
    bgLeftColor: 'bg-[#8A5546]',
  },
  {
    id: '2',
    name: 'Dr. Roberto',
    role: 'Psicólogo',
    crp: 'CRP 00/00000',
    avatarLetter: 'R',
    quote: 'Ferramenta indispensável para alinhar o plano alimentar com o comportamento.',
    bgLeftColor: 'bg-[#4A6075]',
  },
  {
    id: '3',
    name: 'Dra. Camila',
    role: 'Nutricionista',
    crp: 'CRN 00/00000',
    avatarLetter: 'C',
    quote: 'Os relatórios facilitam demais a visualização do progresso semanal.',
    bgLeftColor: 'bg-[#4D6A4D]',
  },
  {
    id: '4',
    name: 'Dra. Helena',
    role: 'Psicóloga',
    crp: 'CRP 00/00000',
    avatarLetter: 'H',
    quote: 'Ter a rotina alimentar do paciente à mão muda a qualidade da sessão. Consigo trabalhar o que ele realmente viveu na semana.',
    highlightedText: 'muda a qualidade da sessão.',
    bgLeftColor: 'bg-[#6A48B0]',
  },
  {
    id: '5',
    name: 'Dr. Lucas',
    role: 'Nutricionista',
    crp: 'CRN 00/00000',
    avatarLetter: 'L',
    quote: 'Uma plataforma completa que revolucionou o meu atendimento clínico diário.',
    bgLeftColor: 'bg-[#3B6E64]',
  },
];

export default function ReviewsSection() {
  const swiperRef = useRef<SwiperClass | null>(null);
  const [activeIndex, setActiveIndex] = useState(1);
  // WCAG 2.2.2: o que se move sozinho por mais de 5 s precisa de um jeito de pausar
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const autoplay = swiperRef.current?.autoplay;
    if (!autoplay) return;
    if (paused) autoplay.stop();
    else autoplay.start();
  }, [paused]);

  return (
    <section className="w-full bg-[#E8EEF5] py-16 px-4 flex flex-col items-center justify-center font-sans">

      <div className="text-center max-w-2xl mb-12">
        <h2 className="text-3xl md:text-4xl font-fraunces mb-3">
          O que dizem sobre a NutriMente
        </h2>
        <p className="text-sm md:text-base">
          Uma plataforma criada para tornar o acompanhamento nutricional e psicológico mais acessível.
        </p>
      </div>

      <div className="w-full flex flex-col items-center">
          <div className="w-full max-w-4xl relative">
            <Swiper
              modules={[Navigation, Pagination, A11y, Autoplay]}
              onBeforeInit={(swiper) => {
                swiperRef.current = swiper;
              }}
              initialSlide={3}
              onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
              spaceBetween={0}
              slidesPerView={1}
              loop={true}
              autoplay={{
                delay: 4500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              className="w-full rounded-3xl"
            >
              {testimonialsData.map((item) => (
                <SwiperSlide key={item.id}>
                  <ReviewCard {...item} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          <div className="flex items-center justify-center space-x-4 mt-8">
            {testimonialsData.map((item, index) => {
              const isActive = activeIndex === index;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => swiperRef.current?.slideToLoop(index)}
                  aria-label={`Ver depoimento de ${item.name}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white transition-all duration-300 shadow-md ${
                    item.bgLeftColor
                  } ${
                    isActive
                      ? 'ring-4 ring-[#112233] scale-110 shadow-lg'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {item.avatarLetter}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 mt-4">
            {testimonialsData.map((_, index) => {
              const isActive = activeIndex === index;
              return (
                // Área de toque de 24px (WCAG 2.5.8); o ponto visível continua pequeno
                <button
                  key={index}
                  type="button"
                  onClick={() => swiperRef.current?.slideToLoop(index)}
                  className="flex h-6 min-w-6 items-center justify-center"
                  aria-label={`Ir para o depoimento ${index + 1}`}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span
                    aria-hidden
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isActive ? 'w-6 bg-[#112233]' : 'w-2 bg-[#A0AEC0]'
                    }`}
                  />
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPaused((current) => !current)}
              aria-label={paused ? 'Continuar depoimentos' : 'Pausar depoimentos'}
              className="ml-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-blue1 shadow-md"
            >
              {paused ? <Play aria-hidden size={18} /> : <Pause aria-hidden size={18} />}
            </button>
          </div>

      </div>

    </section>
  );
}