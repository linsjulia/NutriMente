import type { Metadata } from "next";
import { UserCheck, BadgeDollarSign, MessageCirclePlus, ShieldCheck } from "lucide-react";
import Image from "next/image"
export const metadata: Metadata = { title: "Sobre nós | NutriMente" };

export default function AboutPage() {
  return (
    // id="conteudo": destino do link "Pular para o conteúdo" (SkipLink)
    <main id="conteudo" className="bg-white text-slate-800">
      <section className="flex min-h-screen flex-col justify-center bg-[#eaf6fd] px-4 py-10 md:py-14">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-8 text-center font-fraunces text-3xl font-bold text-[#0a3d8f] md:text-4xl">
            Sobre o NutriMente
          </h1>

          <div className="relative h-60 overflow-hidden rounded-2xl md:h-100">
            <Image
              src="/patient/consulta-paciente-profissional.png"
              width={1300}
              height={1300}
              alt="Duas mulheres conversando durante uma consulta"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#00286e] to-transparent opacity-80"></div>
            <p className="absolute bottom-4 left-0 right-0 px-4 text-center font-serif text-lg text-white md:bottom-8 md:text-2xl">
              Psicologia nutricional com abordagem humana, técnica e continuidade de cuidado.
            </p>
          </div>

          <div className="mt-20 flex flex-col rounded-2xl border-2 border-[#004aad] bg-white md:flex-row">
            <div className="flex-1 p-6 text-center font-serif text-xl font-bold text-green-700 md:text-2xl">
              + 1 mil pacientes já atendidos
            </div>
            <div className="flex-1 border-t-2 border-[#004aad] p-6 text-center font-serif text-xl font-bold text-green-700 md:border-l-2 md:border-t-0 md:text-2xl">
              +300 nutricionistas e psicólogos cadastrados
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#004aad] px-4 pt-10 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 font-serif text-2xl font-bold text-[#5eecd8] md:text-3xl">
            Propósito
          </h2>
          <p className="mb-6 text-base leading-8 md:text-xl md:leading-9">
            O NutriMente é uma plataforma de saúde multidisciplinar desenvolvida com o objetivo
            fundamental de unir, em um único ecossistema digital, o cuidado com a mente e com a
            alimentação.
          </p>
          <p className="mb-6 text-base leading-8 md:text-xl md:leading-9">
            Mais do que um sistema de agendamento, o projeto surge como uma solução para a
            fragmentação dos tratamentos de saúde, propondo uma abordagem onde a psicologia e a
            nutrição trabalham em total sinergia.
          </p>
        </div>
        {/* A logo fica metade dentro e metade fora do bloco azul */}
        <Image
          src="/logo/nutrimente-v1.png"
          width={100}
          height={100}
          alt="Logo NutriMente"
          className="relative top-8 mx-auto w-40 rounded-2xl md:w-52"
        />
      </section>

      {/* ---------- PARA QUEM É ---------- */}
      <section className="flex min-h-screen flex-col justify-center px-4 pt-36">
        <h2 className="text-center font-serif text-2xl font-bold text-[#0a3d8f] md:text-3xl">
          Para quem é
        </h2>
        <div className="mx-auto mt-6 max-w-5xl">
          <div className="mx-auto mt-6 flex max-w-3xl flex-col gap-10 pb-8 text-center text-lg text-[#0071c9] md:text-xl">
            <p className="text-blue2">Pessoas que buscam cuidar de sua:</p>
              <p className="font-bold">● Alimentação</p>
              <p className="font-bold">● Saúde mental</p>
              <p className="font-bold">● Rotina</p>
            <p className="text-blue2">Tudo isso com acompanhamento de um profissional especializado da nossa plataforma</p>
          </div>
        </div>
      </section>

      {/* ---------- O QUE NOS TORNA CONFIÁVEIS ---------- */}
      <section className="flex min-h-screen flex-col justify-center bg-[#d9f0fc] px-4 py-10 md:py-14">
        <h2 className="text-center font-serif text-2xl font-bold text-[#0a3d8f] md:text-3xl">
          O que nos torna confiáveis
        </h2>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-10 md:grid-cols-2 auto-rows-fr">
          <div className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl bg-white p-10 text-center shadow-lg shadow-blue-900/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00e060]">
              <UserCheck className="h-7 w-7 text-white" />
            </div>
            <p>
              <span className="text-[#0071c9] font-bold">Profissionais verificados</span> com formação e
              registro conferidos
            </p>
          </div>

          <div className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl bg-white p-10 text-center shadow-lg shadow-blue-900/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00e060]">
              <BadgeDollarSign className="h-7 w-7 text-white" />
            </div>
            <p>
              <span className="text-[#0071c9] font-bold">Simplifique seus pagamentos</span> adicionando saldo
              diretamente à sua conta no site
            </p>
          </div>

          <div className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl bg-white p-10 text-center shadow-lg shadow-blue-900/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00e060]">
              <MessageCirclePlus className="h-7 w-7 text-white" />
            </div>
            <p>
              <span className="text-[#0071c9] font-bold">Confirmação imediata</span> de atendimento
            </p>
          </div>

          <div className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl bg-white p-10 text-center shadow-lg shadow-blue-900/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20">
          
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00e060]">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <p>
              <span className="text-[#0071c9] font-bold">Dados protegidos</span> com sigilo e segurança
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}