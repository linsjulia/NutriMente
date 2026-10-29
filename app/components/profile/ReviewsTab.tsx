"use client";

import { useState } from "react";
import Card from "./Card";
import Stars from "./Stars";
import type { ProfessionalProfile, PublicReview } from "@/app/lib/agenda";
import { formatDate } from "@/app/lib/agenda";

// Aba "Avaliações": resumo com barras, filtro por nota e lista.
export default function ReviewsTab({ p, reviews }: { p: ProfessionalProfile; reviews: PublicReview[] }) {
  const [filtro, setFiltro] = useState<number | null>(null);
  const lista = filtro === null ? reviews : reviews.filter((review) => review.rating === filtro);

  return (
    <Card className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold">Avaliações</h2>
        <p className="mt-1 text-sm text-gray-700">Veja o que os pacientes dizem</p>
      </div>

      {/* Resumo */}
      <div className="flex flex-wrap items-center gap-8 rounded-xl bg-blue3 p-6">
        <div className="flex flex-col items-center">
          {p.ratingCount > 0 ? (
            <>
              <span className="text-4xl font-bold text-blue1">{p.ratingAverage.toFixed(1).replace(".", ",")}</span>
              <Stars value={p.ratingAverage} className="text-lg" />
              <span className="text-xs text-gray-600">
                {p.ratingCount} {p.ratingCount === 1 ? "avaliação" : "avaliações"}
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-600">Ainda sem avaliações</span>
          )}
        </div>
        <p className="max-w-md text-sm text-gray-700">
          {reviews.length > 0
            ? `Exibindo ${reviews.length} avaliações recentes.`
            : "As avaliações dos pacientes aparecerão aqui."}
        </p>
      </div>

      {/* Filtro */}
      <div className="flex flex-wrap gap-2">
        {[null, 5, 4, 3, 2, 1].map((n) => (
          <button
            key={n ?? "todas"}
            type="button"
            aria-pressed={filtro === n}
            onClick={() => setFiltro(n)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
              filtro === n ? "border-blue1 bg-blue1 text-white" : "border-gray-200 hover:border-blue1"
            }`}
          >
            {n === null ? "Todas" : `${n} ★`}
          </button>
        ))}
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <p className="text-sm text-gray-600">Nenhuma avaliação com essa nota.</p>
      ) : (
        <ul className="flex flex-col">
          {lista.map((a) => (
            <li key={a.id} className="flex gap-3 border-t border-gray-200 py-4">
              <span aria-hidden className="size-8 shrink-0 rounded-full bg-gray-300" />
              <div className="flex flex-col gap-1">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <strong className="text-blue1">{a.patientName}</strong>
                  <span className="text-xs text-gray-500">{formatDate(a.createdAt)}</span>
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">Consulta realizada</span>
                </p>
                <Stars value={a.rating} className="text-xs" />
                {a.comment && <p className="text-sm">“{a.comment}”</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}