import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, Video } from "lucide-react";
import { api } from "@/app/lib/api";
import { verifySession } from "@/app/lib/dal";
import { formatWhen, STATUS_TEXT, type Appointment } from "@/app/lib/agenda";

export const metadata: Metadata = { title: "Minhas consultas | NutriMente" };

const TZ = "America/Sao_Paulo";
const CARD = "rounded-[1.75rem] bg-white shadow-lg shadow-blue1/10";

const FILTERS = [
  ["todas", "Todas"],
  ["agendadas", "Agendadas"],
  ["confirmadas", "Confirmadas"],
  ["realizadas", "Realizadas"],
  ["avaliar", "Avaliar"],
] as const;
type Filter = (typeof FILTERS)[number][0];

type Tone = "blue" | "green" | "red" | "gray";
type Person = { name: string; photoUrl?: string | null };

const TONES: Record<Tone, { badge: string; chip: string; dot: string }> = {
  blue: { badge: "bg-[#1a6bff] text-white", chip: "bg-[#dcecff] text-blue1", dot: "bg-[#2f7bff]" },
  green: { badge: "bg-[#00dc5a] text-[#06402a]", chip: "bg-[#dcfbe8] text-green-900", dot: "bg-[#00dc5a]" },
  red: { badge: "bg-red-500 text-white", chip: "bg-red-100 text-red-900", dot: "bg-red-600" },
  gray: { badge: "bg-slate-400 text-white", chip: "bg-slate-200 text-slate-900", dot: "bg-slate-500" },
};

function toneOf(status: Appointment["status"]): Tone {
  if (status === "CONFIRMED") return "green";
  if (status === "CANCELLED") return "red";
  if (status === "COMPLETED") return "gray";
  return "blue"; // agendada / aguardando confirmação
}

/** Cada filtro decide quais consultas do histórico aparecem */
const FILTER_RULES: Record<Filter, (a: Appointment) => boolean> = {
  todas: () => true,
  agendadas: (a) => toneOf(a.status) === "blue",
  confirmadas: (a) => a.status === "CONFIRMED",
  realizadas: (a) => a.status === "COMPLETED",
  avaliar: (a) => Boolean(a.canReview),
};

function dayAndMonth(startsAt: Appointment["startsAt"]) {
  const parts = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "short" }).formatToParts(new Date(startsAt));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: get("day"), month: get("month").replace(".", "").toUpperCase() };
}

function initials(name: string) {
  const words = name.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

function Avatar({ name, photoUrl }: Person) {
  return (
    <span
      aria-hidden
      className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#dcfbe8] text-xs font-extrabold text-green-900"
    >
      {photoUrl ? (
        <Image src={photoUrl} alt="" fill sizes="32px" className="object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

function AppointmentRow({ appointment, person }: { appointment: Appointment; person: Person }) {
  const tone = TONES[toneOf(appointment.status)];
  const { day, month } = dayAndMonth(appointment.startsAt);
  const online = appointment.modality === "ONLINE";
  const extra = appointment.canReview ? "Avaliar" : appointment.canWriteRecord && appointment.status === "COMPLETED" ? "Registro" : null;

  return (
    <li>
      <Link
        href={`/appointments/${appointment.id}`}
        className={`${CARD} group flex flex-wrap items-center gap-x-5 gap-y-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue1 sm:p-5`}
      >
        <span aria-hidden className={`flex h-18 w-18 shrink-0 flex-col items-center justify-center rounded-2xl ${tone.badge}`}>
          <span className="text-3xl font-extrabold leading-none">{day}</span>
          <span className="mt-1 text-xs font-extrabold tracking-widest">{month}</span>
        </span>

        <span className="flex min-w-0 flex-1 basis-48 flex-col gap-1.5">
          <span className="text-lg font-bold text-[#14304a] first-letter:uppercase">{formatWhen(appointment.startsAt)}</span>
          <span className="flex items-center gap-2 text-slate-600">
            <Avatar name={person.name} photoUrl={person.photoUrl} />
            <span className="truncate">{person.name}</span>
          </span>
        </span>

        <span className="ml-auto flex flex-wrap items-center gap-2 text-sm font-semibold sm:gap-3">
          <span className="flex min-h-10 items-center gap-2 rounded-full bg-[#eef3fb] px-4 text-slate-700">
            {online ? <Video aria-hidden size={18} /> : <MapPin aria-hidden size={18} />}
            {online ? "Online" : "Presencial"}
          </span>
          <span className={`flex min-h-10 items-center gap-2 rounded-full px-4 ${tone.chip}`}>
            <span aria-hidden className={`h-2 w-2 rounded-full ${tone.dot}`} />
            {STATUS_TEXT[appointment.status]}
          </span>
          {extra && <span className="flex min-h-10 items-center rounded-full bg-amber-100 px-4 text-amber-900">{extra}</span>}
          <ChevronRight aria-hidden size={22} className="text-slate-500 transition group-hover:translate-x-0.5" />
        </span>
      </Link>
    </li>
  );
}

/** Próximas consultas e histórico, para paciente e profissional */
export default async function AppointmentsHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await verifySession();
  const { status } = await searchParams;
  const isPatient = session.role === "PATIENT";

  const filters: readonly (readonly [Filter, string])[] = isPatient
    ? FILTERS
    : FILTERS.filter(([key]) => key !== "avaliar");
  const filter: Filter = filters.some(([key]) => key === status) ? (status as Filter) : "todas";

  const [upcoming, past] = await Promise.all([
    api<Appointment[]>("/api/appointments?scope=UPCOMING", { token: session.token }),
    api<Appointment[]>("/api/appointments?scope=PAST", { token: session.token }),
  ]);
  const personOf = (a: Appointment): Person => (isPatient ? a.professional : a.patient);

  const rows = (items: Appointment[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((a) => <AppointmentRow key={a.id} appointment={a} person={personOf(a)} />)}
    </ul>
  );

  const pastItems = past.ok ? past.data.filter(FILTER_RULES[filter]) : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 text-[#14304a]">
      <header>
        <h1 className="mt-2 font-fraunces text-4xl font-medium sm:text-6xl">{isPatient ? "Minhas consultas" : "Agenda"}</h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          {isPatient
            ? "Acompanhe seus atendimentos de psicologia e nutrição em um só lugar."
            : "Acompanhe seus atendimentos com pacientes em um só lugar."}
        </p>
      </header>

      <section aria-labelledby="proximas" className="flex flex-col gap-5">
        <h2 id="proximas" className="text-2xl font-extrabold">Próximas</h2>
        {!upcoming.ok ? (
          <p role="alert" className="card border-red-300 text-red-800">{upcoming.error.detail}</p>
        ) : upcoming.data.length === 0 ? (
          <div className={`${CARD} flex flex-wrap items-center gap-5 p-5 sm:p-8`}>
            <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#dcecff] text-blue1">
              <CalendarDays size={28} />
            </span>
            <div className="min-w-0 flex-1 basis-56">
              <p className="text-xl font-bold">{isPatient ? "Você não tem consultas marcadas." : "Nenhuma consulta marcada."}</p>
              {isPatient && <p className="mt-1 text-slate-600">Que tal agendar um horário com um profissional?</p>}
            </div>
            {isPatient && (
              <Link
                href="/professionals"
                className="flex min-h-12 items-center rounded-full border-2 border-blue1 px-7 text-lg font-bold text-blue1 transition hover:bg-blue1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue1 focus-visible:ring-offset-2"
              >
                Ver profissionais
              </Link>
            )}
          </div>
        ) : (
          rows(upcoming.data)
        )}
      </section>

      <section aria-labelledby="historico" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="historico" className="text-2xl font-extrabold">Histórico</h2>
          <nav aria-label="Filtrar histórico" className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-white p-1.5 shadow-[0_10px_30px_-18px_rgba(0,80,176,0.35)]">
            {filters.map(([key, label]) => (
              <Link
                key={key}
                href={`?status=${key}`}
                scroll={false}
                aria-current={filter === key ? "true" : undefined}
                className={`flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full px-5 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue1 ${
                  filter === key ? "bg-[#dcecff] font-bold text-blue1" : "text-slate-600 hover:text-blue1"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {!past.ok ? (
          <p role="alert" className="card border-red-300 text-red-800">{past.error.detail}</p>
        ) : past.data.length === 0 ? (
          <p className={`${CARD} p-6 text-slate-600`}>Ainda não há consultas no histórico.</p>
        ) : pastItems.length === 0 ? (
          <p className={`${CARD} p-6 text-slate-600`}>Nenhuma consulta com esse filtro.</p>
        ) : (
          rows(pastItems)
        )}
      </section>
    </div>
  );
}