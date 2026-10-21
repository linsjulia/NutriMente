import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Star, Video } from "lucide-react";
import { api } from "@/app/lib/api";
import { getSession } from "@/app/lib/session";
import { formatBRL } from "@/app/lib/money";
import { COUNCIL, PROFESSION_LABELS, type Page } from "@/app/lib/types";
import { formatDate, type ProfessionalProfile, type PublicReview, type SlotDay } from "@/app/lib/agenda";
import BookingForm from "./BookingForm";

export async function generateMetadata({ params }: PageProps<"/professionals/[id]">): Promise<Metadata> {
  const { id } = await params;
  const result = await api<ProfessionalProfile>(`/api/professionals/${Number(id)}`);
  return { title: `${result.ok ? result.data.name : "Profissional"} | NutriMente` };
}

/**
 * Perfil público do profissional ("Ver perfil" na busca): apresentação,
 * avaliações e, para o paciente logado, os horários livres para agendar.
 */
export default async function ProfessionalPage({ params }: PageProps<"/professionals/[id]">) {
  const { id } = await params;
  const professionalId = Number(id);
  if (!Number.isInteger(professionalId)) notFound();

  const [profile, reviews, slots, session] = await Promise.all([
    api<ProfessionalProfile>(`/api/professionals/${professionalId}`),
    api<Page<PublicReview>>(`/api/professionals/${professionalId}/reviews?size=5`),
    api<SlotDay[]>(`/api/professionals/${professionalId}/slots?days=14`),
    getSession(),
  ]);
  if (!profile.ok) {
    if (profile.error.status === 404) notFound();
    return (
      <main id="conteudo" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-fraunces text-3xl font-medium">Profissional</h1>
        <p role="alert" className="card mt-6 border-red-300 text-red-800">{profile.error.detail}</p>
      </main>
    );
  }
  const p = profile.data;
  const days = slots.ok ? slots.data.filter((d) => d.slots.length > 0) : [];

  return (
    <main id="conteudo" className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <Link href="/professionals" className="inline-block py-2.5 font-semibold text-blue1 underline-offset-4 hover:underline">
        ← Voltar para a busca
      </Link>

      <section aria-labelledby="perfil" className="card flex flex-col gap-5 sm:flex-row">
        {p.photoUrl ? (
          <Image src={p.photoUrl} alt="" width={128} height={128} className="h-32 w-32 shrink-0 rounded-2xl object-cover" />
        ) : (
          <div aria-hidden className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-4xl font-bold text-blue1">
            {p.name[0]}
          </div>
        )}
        <div className="flex flex-col gap-3">
          <h1 id="perfil" className="font-fraunces text-3xl font-medium">{p.name}</h1>
          <p className="text-gray-700">
            {PROFESSION_LABELS[p.type]} · {COUNCIL[p.type]} {p.document}
          </p>
          <p className="flex items-center gap-1.5">
            <Star aria-hidden size={18} className="fill-amber-400 text-amber-500" />
            {p.ratingCount > 0 ? (
              <span>
                <strong>{p.ratingAverage.toFixed(1).replace(".", ",")}</strong> ({p.ratingCount}{" "}
                {p.ratingCount === 1 ? "avaliação" : "avaliações"})
              </span>
            ) : (
              <span>Ainda sem avaliações</span>
            )}
          </p>
          <ul aria-label="Como atende" className="flex flex-wrap gap-2">
            {p.offersOnline && (
              <li className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-900">
                <Video aria-hidden size={16} /> Atende online
              </li>
            )}
            {p.offersInPerson && (
              <li className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-900">
                <MapPin aria-hidden size={16} /> Presencial em {p.officeCity}/{p.officeState}
              </li>
            )}
          </ul>
          {p.specialties.length > 0 && (
            <ul aria-label="Especialidades" className="flex flex-wrap gap-1.5">
              {p.specialties.map((s) => (
                <li key={s.id} className="specialty-tag">{s.name}</li>
              ))}
            </ul>
          )}
          <p>{p.bio ?? "Este profissional ainda não escreveu uma apresentação."}</p>
          <p className="text-lg font-semibold">
            {p.consultationPrice != null ? `R$ ${formatBRL(p.consultationPrice)} por consulta` : "Valor a combinar"}
          </p>
        </div>
      </section>

      <section aria-labelledby="agendar" className="card flex flex-col gap-4">
        <h2 id="agendar" className="text-xl font-bold">Agendar consulta</h2>
        {!session ? (
          <p>
            <Link href={`/login?next=/professionals/${p.id}`} className="btn-primary inline-flex">
              Entrar para agendar
            </Link>
          </p>
        ) : session.role !== "PATIENT" ? (
          <p className="text-gray-700">Só pacientes agendam consultas.</p>
        ) : !p.offersOnline && !p.offersInPerson ? (
          <p className="text-gray-700">Este profissional ainda não informou como atende.</p>
        ) : days.length === 0 ? (
          <p className="text-gray-700">Não há horários livres nos próximos 14 dias.</p>
        ) : (
          <BookingForm
            professionalId={p.id}
            days={days}
            offersOnline={p.offersOnline}
            offersInPerson={p.offersInPerson}
            price={p.consultationPrice}
          />
        )}
      </section>

      <section aria-labelledby="avaliacoes" className="flex flex-col gap-3">
        <h2 id="avaliacoes" className="text-xl font-bold">Avaliações</h2>
        {!reviews.ok || reviews.data.items.length === 0 ? (
          <p className="text-gray-700">Ainda não há avaliações.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {reviews.data.items.map((r) => (
              <li key={r.id} className="card flex flex-col gap-2">
                <span role="img" aria-label={`${r.rating} de 5 estrelas`} className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} aria-hidden size={18} className={n <= r.rating ? "fill-amber-400 text-amber-500" : "text-gray-300"} />
                  ))}
                </span>
                {r.comment && <p>“{r.comment}”</p>}
                <p className="text-sm text-gray-700">
                  {r.patientName} · {formatDate(r.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
