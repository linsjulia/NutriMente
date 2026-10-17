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
  avatarSrc: string;
  quote: string;
  highlightedText?: string;
  bgLeftColor: string;
}

// Cores escuras o bastante para o texto branco (contraste >= 4,5:1, WCAG 1.4.3)
const testimonialsData: Testimonial[] = [
  {
    id: '1',
    name: 'Marina Santos',
    role: 'Paciente',
    crp: 'CRN 00/00000',
    avatarSrc: '/patient/marina-review.webp',
    quote: 'Eu fazia terapia e dieta em lugares separados e nada conversava entre si. Aqui o nutricionista e a psicóloga acompanham minha rotina, e os checklists me ajudam a manter o ritmo.',
    bgLeftColor: 'bg-blue-400',
  },
  {
    id: '2',
    name: 'Dra. Camila Ribeiro ',
    role: 'Psicóloga',
    crp: 'CRP 00/00000',
    avatarSrc: '/doctor/camila-review.webp',
    quote: 'Consigo organizar minha agenda, definir meus horários e valores e acompanhar a evolução de cada paciente em um só lugar. O cadastro com verificação do registro passa confiança.',
    bgLeftColor: 'bg-sky-400',
  },
  {
    id: '3',
    name: 'Rafael Torres',
    role: 'Paciente',
    crp: 'CRN 00/00000',
    avatarSrc: '/patient/rafael-review.webp',
    quote: 'Agendei, paguei com o saldo da conta e a confirmação veio na hora. A consulta por vídeo funcionou sem complicação e os lembretes me ajudam a não esquecer as metas.',
    bgLeftColor: 'bg-cyan-400',
  },
  {
    id: '4',
    name: 'Dr. André Menezes',
    role: 'Nutricionista',
    crp: 'CRP 00/00000',
    avatarSrc: '/doctor/andre-review.jpg',
    quote: 'Os planos personalizados e as metas quinzenais deixam o acompanhamento muito mais próximo. Trabalhar junto com a psicologia mostra resultados que a dieta sozinha não alcança.',
    bgLeftColor: 'bg-teal-600',
  },
  {
    id: '5',
    name: 'Beatriz Lima',
    role: 'Paciente',
    crp: 'CRN 00/00000',
    avatarSrc: '/patient/beatriz-review.webp',
    quote: 'Poder registrar minhas refeições com foto e anotações fez diferença. Meu profissional ajusta o plano conforme eu evoluo, e eu me sinto realmente acompanhada.',
    bgLeftColor: 'bg-emerald-400',
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
    <section className="w-full bg-blue-100 py-16 px-4 flex flex-col items-center justify-center font-sans">

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


          <div className="flex items-center gap-1 mt-4">
            {testimonialsData.map((_, index) => {
              const isActive = activeIndex === index;
              return (
                // Área de toque de 24px (WCAG 2.5.8); o ponto visível continua pequeno
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