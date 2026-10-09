"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faCalendar, faChevronDown, faClose, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useState, type ReactNode } from "react";

/* ---------- dados de exemplo (troque pela sua API) ---------- */
type Profissional = {
  id: number;
  titulo: string;
  nome: string;
  nota: number;
  avaliacoes: number;
  areas: string[];
  horarios: string[];
  preco: number;
  foto?: string; // se não vier foto, mostra as iniciais
};

const filtrosAtivos = ["Psicologia nutricional", "Ansiedade", "Comer emocional"];

const profissionais: Profissional[] = [
  {
    id: 1,
    titulo: "Psicólogo(a)",
    nome: "Nayara Santos",
    nota: 5.0,
    avaliacoes: 15,
    areas: ["Psicologia nutricional", "Ansiedade", "Comer emocional"],
    horarios: ["10:30", "12:00", "14:00", "15:00"],
    preco: 150,
  },
  {
    id: 2,
    titulo: "Nutricionista",
    nome: "Rafael Mota",
    nota: 4.8,
    avaliacoes: 94,
    areas: ["Psicologia nutricional", "Compulsão alimentar"],
    horarios: ["14:00", "15:00", "16:30", "18:00"],
    preco: 160,
  },
  {
    id: 3,
    titulo: "Psicólogo(a)",
    nome: "Aline Souza",
    nota: 4.9,
    avaliacoes: 61,
    areas: ["Imagem corporal", "Ansiedade", "Comer emocional"],
    horarios: ["11:00", "14:30", "16:00", "17:00"],
    preco: 180,
  },
];



/* ---------- peças dos filtros ---------- */
function Opcao({ label, marcado = false }: { label: string; marcado?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        defaultChecked={marcado}
        className="h-4 w-4 rounded border-slate-300 accent-green-600"
      />
      {label}
    </label>
  );
}

function Segmentos({ opcoes, inicial }: { opcoes: string[]; inicial?: string }) {
  const [selecionado, setSelecionado] = useState(inicial);
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => setSelecionado(o)}
          className={`rounded border px-2 py-1 text-xs ${
            selecionado === o
              ? "border-green-600 bg-green-100 text-green-800"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Grupo({
  titulo,
  resumo,
  abertoInicial = true,
  children,
}: {
  titulo: string;
  resumo?: string;
  abertoInicial?: boolean;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(abertoInicial);
  return (
    <section className="border-t border-slate-200 py-4 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between text-left font-semibold text-blue-900"
      >
        <span>{titulo}</span>
        <span className="flex items-center gap-2">
          {!aberto && resumo && (
            <span className="text-xs font-normal text-slate-400">{resumo}</span>
          )}
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`h-4 w-4 transition-transform ${aberto ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {aberto && <div className="mt-3 space-y-2">{children}</div>}
    </section>
  );
}

function Filtros() {
  return (
    <aside className="w-full shrink-0 rounded-2xl bg-white p-10 shadow-sm md:w-64 md:self-start lg:w-72">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-blue-900">Filtros</h2>
        <button type="button" className="text-xs font-semibold text-green-600">
          Limpar filtros
        </button>
      </div>

      <Grupo titulo="Área">
        <Opcao label="Psicologia" />
        <Opcao label="Nutrição" />
        <Opcao label="Psicologia nutricional" marcado />
      </Grupo>

      <Grupo titulo="Tema">
        <div className="flex items-center rounded-md border border-slate-300 px-2 py-1.5">
          <input
            type="text"
            placeholder="Buscar tema..."
            className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
          />
          <FontAwesomeIcon icon={faSearch} className="h-4 w-4 text-blue-700" />
        </div>
        <Opcao label="Comer emocional" marcado />
        <Opcao label="Compulsão alimentar" />
        <Opcao label="Anorexia e bulimia" />
        <Opcao label="Imagem corporal" />
        <Opcao label="Ansiedade" marcado />
        <button type="button" className="pt-1 text-xs font-semibold text-green-600">
          Ver todos os temas
        </button>
      </Grupo>

      <Grupo titulo="Público" resumo="adulto..." abertoInicial={false}>
        <Opcao label="Adulto" />
        <Opcao label="Adolescente" />
        <Opcao label="Criança" />
        <Opcao label="Casal" />
        <Opcao label="Idoso" />
      </Grupo>

      <Grupo titulo="Preço da consulta">
        {/* Visual apenas: troque por um slider de verdade (ex.: rc-slider) */}
        <div className="relative mx-2 mt-4 h-1 rounded bg-slate-200">
          <div className="absolute inset-y-0 left-[10%] right-[15%] rounded bg-green-600" />
          <span className="absolute -top-1.5 left-[10%] h-4 w-4 -translate-x-1/2 rounded-full border-2 border-green-600 bg-white" />
          <span className="absolute -top-1.5 right-[15%] h-4 w-4 translate-x-1/2 rounded-full border-2 border-green-600 bg-white" />
        </div>
        <div className="flex justify-between pt-2 text-xs font-semibold text-slate-700">
          <span>R$ 80</span>
          <span>R$ 300</span>
        </div>
      </Grupo>

      <Grupo titulo="Horário disponível">
        <Opcao label="Hoje" marcado />
        <Opcao label="Esta semana" />
        <Opcao label="Fim de Semana" />
        <Segmentos opcoes={["Manhã", "Tarde", "Noite"]} inicial="Tarde" />
        <button
          type="button"
          className="flex items-center gap-2 pt-1 text-xs font-semibold text-green-600"
        >
          <FontAwesomeIcon icon={faCalendar} />
          Selecionar data
        </button>
      </Grupo>

      <Grupo titulo="Duração da consulta">
        <Segmentos opcoes={["Até 30 min", "Até 60 min", "Mais de 60 min"]} inicial="Até 60 min" />
      </Grupo>

      <Grupo titulo="Perfil do profissional">
        <Opcao label="Feminino" marcado />
        <Opcao label="Masculino" />
        <Opcao label="Atende pessoas LGBTQIA+" />
      </Grupo>
    </aside>
  );
}

/* ---------- card do profissional ---------- */
function CardProfissional({ p }: { p: Profissional }) {
  const iniciais = p.nome.split(" ").map((parte) => parte[0]).slice(0, 2).join("");

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:justify-between">
      {/* esquerda: foto, nome e áreas */}
      <div className="flex gap-4">
        {p.foto ? (
          <img
            src={p.foto}
            alt={p.nome}
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-blue-900"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-blue-900 ring-2 ring-blue-900">
            {iniciais}
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-sky-500">{p.titulo}</p>
          <h3 className="font-bold text-slate-900">{p.nome}</h3>
          <p className="text-xs text-slate-500">
            <span className="text-yellow-400">★</span> {p.nota.toFixed(1)} ({p.avaliacoes})
          </p>

          <p className="mt-3 text-[11px] text-slate-500">Principais áreas de atuação:</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {p.areas.map((area) => (
              <span
                key={area}
                className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] text-green-900"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* direita: horários, preço e botão */}
      <div className="sm:w-44 sm:shrink-0 sm:text-right">
        <p className="mb-2 text-sm font-semibold text-sky-500">Hoje</p>
        <div className="grid grid-cols-2 gap-2">
          {p.horarios.map((h) => (
            <button
              key={h}
              type="button"
              className="rounded bg-sky-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-sky-200"
            >
              {h}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm font-bold text-slate-900">R$ {p.preco}</p>
        <p className="text-[11px] text-slate-500">por consulta</p>
        <button
          type="button"
          className="mt-2 w-full rounded-full bg-linear-to-r from-cyan-500 to-teal-400 px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          Agendar Consulta
        </button>
      </div>
    </article>
  );
}

/* ---------- página ---------- */
export default function BuscaProfissionais() {
  return (
    <div className="min-h-screen bg-sky-50 text-slate-800">
      {/* cabeçalho com busca */} 

      {/* conteúdo */}
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:px-8">
        <Filtros />

        <section className="min-w-0 flex-1">
          {/* filtros ativos e ordenação */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {filtrosAtivos.map((f) => (
                <span
                  key={f}
                  className="flex items-center gap-2 rounded-full border border-green-600 bg-emerald-50 px-3 py-1 text-xs text-slate-700"
                >
                  {f}
                  <button type="button" aria-label={`Remover ${f}`}>
                    <FontAwesomeIcon icon={faClose} className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button type="button" className="text-xs font-semibold text-green-600">
                Limpar tudo
              </button>
            </div>

            <button type="button" className="flex items-center gap-1 text-xs text-slate-600">
              Ordenar: Mais relevantes
              <FontAwesomeIcon icon={faChevronDown} />
            </button>
          </div>

          {/* lista */}
          <div className="space-y-4">
            {profissionais.map((p) => (
              <CardProfissional key={p.id} p={p} />
            ))}
          </div>

          {/* paginação */}
          <nav className="mt-6 flex items-center justify-between text-sm">
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50"
            >
              <FontAwesomeIcon icon={faArrowLeft} /> Voltar
            </button>
            <span className="text-xs text-slate-400">1...2</span>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50"
            >
              Próximo <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </nav>
        </section>
      </main>
    </div>
  );
}