import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faCalendar, faChevronDown, faClose, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useState, type ReactNode } from "react";
import SearchProfessionalCard from "../../components/cards/SearchProfessionalCard"
import Checkbox from "../../components/inputs/checkbox";
import { Check } from "lucide-react";

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
   {
    id: 4,
    titulo: "Psicólogo(a)",
    nome: "Aline Souza",
    nota: 4.9,
    avaliacoes: 61,
    areas: ["Imagem corporal", "Ansiedade", "Comer emocional"],
    horarios: ["11:00", "14:30", "16:00", "17:00"],
    preco: 180,
  },
   {
    id: 5,
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
    <aside className="w-full shrink-0 rounded-2xl bg-white p-10 shadow-sm md:w-64 md:self-start lg:w-72 overflow-y-auto">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-blue-900">Filtros</h2>
        <button type="button" className="text-xs font-semibold text-green-600">
          Limpar filtros
        </button>
      </div>

      <Grupo titulo="Área">
        <Checkbox label="Psicologia" />
        <Checkbox label="Nutrição" />
        <Checkbox label="Psicologia nutricional" marcado />
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
        <Checkbox label="Comer emocional" marcado />
        <Checkbox label="Compulsão alimentar" />
        <Checkbox label="Anorexia e bulimia" />
        <Checkbox label="Imagem corporal" />
        <Checkbox label="Ansiedade" marcado />
        <button type="button" className="pt-1 text-xs font-semibold text-green-600">
          Ver todos os temas
        </button>
      </Grupo>

      <Grupo titulo="Público" resumo="adulto..." abertoInicial={false}>
        <Checkbox label="Adulto" />
        <Checkbox label="Adolescente" />
        <Checkbox label="Criança" />
        <Checkbox label="Casal" />
        <Checkbox label="Idoso" />
      </Grupo>

      <Grupo titulo="Preço da consulta">
        {/* Visual apenas: troque por um slider de verdade (ex.: rc-slider) */}
        <div className="relative w-fit">
          <input type="range"/>
        </div>
        <div className="flex justify-between pt-2 text-xs font-semibold text-slate-700">
          <span>R$ 80</span>
          <span>R$ 300</span>
        </div>
      </Grupo>

      <Grupo titulo="Horário disponível">
        <Checkbox label="Hoje" marcado />
        <Checkbox label="Esta semana" />
        <Checkbox label="Fim de Semana" />
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
        <Checkbox label="Feminino" marcado />
        <Checkbox label="Masculino" />
      </Grupo>
    </aside>
  );
}

/* ---------- página ---------- */
export default function BuscaProfissionais() {
  return (
    <div className="min-h-screen bg-sky-50 text-slate-800"> 
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:px-8">
        <Filtros/>
        <section className="min-w-0 flex-1">
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
              <SearchProfessionalCard key={p.id} p={p} />
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