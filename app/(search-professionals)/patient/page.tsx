// API
import { api } from "@/app/lib/api";
import { PROFESSION_LABELS, type Page, type PublicProfessional } from "@/app/lib/types";
import { SlotDay } from "@/app/lib/agenda";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faChevronDown, faClose, } from "@fortawesome/free-solid-svg-icons";
import SearchProfessionalCard from "../../components/cards/SearchProfessionalCard"
import SearchProfessionalFilter from "../../components/filter/SearchProfessionalFilter";

// type Profissional = {
//   id: number;
//   titulo: string;
//   nome: string;
//   nota: number;
//   avaliacoes: number;
//   areas: string[];
//   horarios: string[];
//   preco: number;
//   foto?: string; // se não vier foto, mostra as iniciais
// };

const filtrosAtivos = ["Psicologia nutricional", "Ansiedade", "Comer emocional"];

// const profissionais: Profissional[] = [
//   {
//     id: 1,
//     titulo: "Psicólogo(a)",
//     nome: "Nayara Santos",
//     nota: 5.0,
//     avaliacoes: 15,
//     areas: ["Psicologia nutricional", "Ansiedade", "Comer emocional"],
//     horarios: ["10:30", "12:00", "14:00", "15:00"],
//     preco: 150,
//   },
//   {
//     id: 2,
//     titulo: "Nutricionista",
//     nome: "Rafael Mota",
//     nota: 4.8,
//     avaliacoes: 94,
//     areas: ["Psicologia nutricional", "Compulsão alimentar"],
//     horarios: ["14:00", "15:00", "16:30", "18:00"],
//     preco: 160,
//   },
//   {
//     id: 3,
//     titulo: "Psicólogo(a)",
//     nome: "Aline Souza",
//     nota: 4.9,
//     avaliacoes: 61,
//     areas: ["Imagem corporal", "Ansiedade", "Comer emocional"],
//     horarios: ["11:00", "14:30", "16:00", "17:00"],
//     preco: 180,
//   },
//    {
//     id: 4,
//     titulo: "Psicólogo(a)",
//     nome: "Aline Souza",
//     nota: 4.9,
//     avaliacoes: 61,
//     areas: ["Imagem corporal", "Ansiedade", "Comer emocional"],
//     horarios: ["11:00", "14:30", "16:00", "17:00"],
//     preco: 180,
//   },
//    {
//     id: 5,
//     titulo: "Psicólogo(a)",
//     nome: "Aline Souza",
//     nota: 4.9,
//     avaliacoes: 61,
//     areas: ["Imagem corporal", "Ansiedade", "Comer emocional"],
//     horarios: ["11:00", "14:30", "16:00", "17:00"],
//     preco: 180,
//   },
// ];




/* ---------- página ---------- */
export default async function BuscaProfissionais({ searchParams }: PageProps<"/patient">) {
  const { type, speciality, minPrice, maxPrice, online, sort, page } = await searchParams;

  const query = new URLSearchParams();
  if(type === "NUTRICIONISTA" || type === "PSICOLOGO") query.set("type", type);
  if(Number(speciality) > 0) query.set("speciality", String(speciality));
  if(typeof minPrice === "string") query.set("minPrice", minPrice);
  if(typeof maxPrice === "string") query.set("maxPrice", maxPrice);
  if(online === "true") query.set("online", "true");
  if(typeof sort === "string") query.set("sort", sort);
  query.set("page", String(Math.max(Number(page) || 0, 0)));
  query.set("size", "10");

  const result =  await api<Page<PublicProfessional>>(`/api/professionals?${query}`);
  const items = result.ok ? result.data.items : [];

  const hoje = new Date().toISOString().slice(0, 10);
  const profissionais = await Promise.all(
    items.map(async (p) => {
      const slots = await api<SlotDay[]>(`/api/professionals/${p.id}/slots?from=${hoje}&days=1`);
      const horarios = slots.ok ? (slots.data[0]?.slots.map((s) => s.time) ?? []) : [];
      return {
        id: p.id,
        titulo: PROFESSION_LABELS[p.type],
        nome: p.name,
        nota: p.ratingAverage,
        avaliacoes: p.ratingCount,
        areas: p.specialties.map((s) => s.name),
        horarios: horarios.slice(0, 4),
        preco: p.consultationPrice,
      };
    }),
  );
  return (
    <div className="min-h-screen bg-sky-50 text-slate-800"> 
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:px-8">
        <SearchProfessionalFilter/>
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