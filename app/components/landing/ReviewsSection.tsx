'use client';

import { useRef, useState, useEffect } from 'react';
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

const testimonialsData: Testimonial[] = [
  {
    id: '1',
    name: 'Dra. Márcia',
    role: 'Nutricionista',
    crp: 'CRN 00/00000',
    avatarLetter: 'M',
    quote: 'Acompanhar a evolução dos pacientes ficou muito mais intuitivo e prático.',
    bgLeftColor: 'bg-[#C89B8D]',
  },
  {
    id: '2',
    name: 'Dr. Roberto',
    role: 'Psicólogo',
    crp: 'CRP 00/00000',
    avatarLetter: 'R',
    quote: 'Ferramenta indispensável para alinhar o plano alimentar com o comportamento.',
    bgLeftColor: 'bg-[#7C92A6]',
  },
  {
    id: '3',
    name: 'Dra. Camila',
    role: 'Nutricionista',
    crp: 'CRN 00/00000',
    avatarLetter: 'C',
    quote: 'Os relatórios facilitam demais a visualização do progresso semanal.',
    bgLeftColor: 'bg-[#9FB29F]',
  },
  {
    id: '4',
    name: 'Dra. Helena',
    role: 'Psicóloga',
    crp: 'CRP 00/00000',
    avatarLetter: 'H',
    quote: 'Ter a rotina alimentar do paciente à mão muda a qualidade da sessão. Consigo trabalhar o que ele realmente viveu na semana.',
    highlightedText: 'muda a qualidade da sessão.',
    bgLeftColor: 'bg-[#9370DB]',
  },
  {
    id: '5',
    name: 'Dr. Lucas',
    role: 'Nutricionista',
    crp: 'CRN 00/00000',
    avatarLetter: 'L',
    quote: 'Uma plataforma completa que revolucionou o meu atendimento clínico diário.',
    bgLeftColor: 'bg-[#7EAEA3]',
  },
];

export default function ReviewsSection() {
  const swiperRef = useRef<SwiperClass | null>(null);
  const [activeIndex, setActiveIndex] = useState(1);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

      {isClient && (
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
                  onClick={() => swiperRef.current?.slideToLoop(index)}
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

          <div className="flex items-center space-x-2 mt-4">
            {testimonialsData.map((_, index) => {
              const isActive = activeIndex === index;
              return (
                <button
                  key={index}
                  onClick={() => swiperRef.current?.slideToLoop(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive ? 'w-6 bg-[#112233]' : 'w-2 bg-[#A0AEC0]'
                  }`}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              );
            })}
          </div>

        </div>
      )}

    </section>
  );
}