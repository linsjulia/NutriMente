import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Sobre nós | NutriMente" };

// Antes esta página era um <div> vazio (e o rodapé apontava para ela).
export default function AboutPage() {
  return (
    <main id="conteudo" className="prose-page">
      <h1>Sobre o NutriMente</h1>
      <p>
        O NutriMente é um Projeto Semestral do curso de Desenvolvimento de Software Multiplataforma (DSM) da FATEC
        Luigi Papaiz. A proposta é aproximar profissionais de Psicologia e Nutrição dos seus pacientes em um único
        lugar, reunindo consulta, acompanhamento e comunicação.
      </p>
      <h2>Por que saúde mental e alimentação juntas?</h2>
      <p>
        As duas áreas se encontram no dia a dia: ansiedade afeta a alimentação, e a alimentação afeta o bem-estar.
        Acompanhar as duas de forma integrada torna o cuidado mais completo.
      </p>
      <h2>Compromissos</h2>
      <ul>
        <li><strong>ODS 3, Saúde e Bem-Estar</strong>: ampliar o acesso a cuidado nutricional e psicológico.</li>
        <li><strong>ODS 16</strong>: segurança, privacidade e respeito à LGPD.</li>
        <li><strong>Acessibilidade</strong>: tamanho de texto ajustável, alto contraste e navegação por teclado.</li>
      </ul>
      <p>
        <Link href="/register" className="btn-primary not-prose">
          Criar minha conta
        </Link>
      </p>
    </main>
  );
}
