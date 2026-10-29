import { formatDate, type ProfessionalProfile, type PublicReview } from "@/app/lib/agenda";
import SpecialityBadge from "../badge/SpecialityBadge";
import Card from "./Card";
import Stars from "./Stars";

// Coluna da direita. Na aba "Sobre" mostra as avaliações;
// nas outras abas mostra um resumo + especialidades.
export default function ProfileSidebar({
  p,
  reviews,
  aba,
  onVerMais,
}: {
  p: ProfessionalProfile;
  reviews: PublicReview[];
  aba: string;
  onVerMais: () => void;
}) {
  if (aba === "sobre") {
    return (
      <Card className="flex flex-col gap-4 self-start">
        <h2 className="text-center text-sm font-bold">Avaliações de pacientes</h2>
        <div className="flex flex-col items-center">
          {p.ratingCount > 0 ? (
            <>
              <span className="text-3xl font-bold text-blue1">{p.ratingAverage.toFixed(1).replace(".", ",")}</span>
              <Stars value={p.ratingAverage} className="text-base" />
              <span className="text-xs text-gray-600">
                {p.ratingCount} {p.ratingCount === 1 ? "avaliação" : "avaliações"}
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-600">Ainda sem avaliações</span>
          )}
        </div>
        <ul>
          {reviews.slice(0, 2).map((review) => (
            <li key={review.id} className="border-t border-gray-200 py-3">
              <p className="text-xs font-bold text-blue1">{review.patientName}</p>
              <Stars value={review.rating} className="text-xs" />
              <p className="text-xs">{review.comment ?? "Avaliação sem comentário."}</p>
              <p className="mt-1 text-xs text-gray-500">{formatDate(review.createdAt)}</p>
            </li>
          ))}
        </ul>
        {reviews.length === 0 && <p className="text-center text-xs text-gray-600">Ainda não há avaliações.</p>}
        <button type="button" onClick={onVerMais} className="text-xs font-bold text-blue1 hover:underline">
          Ver mais
        </button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-5 self-start">
      <section>
        <h2 className="mb-2 text-sm font-bold">Sobre</h2>
        <p className="text-xs text-gray-700">{p.bio ?? "Este profissional ainda não escreveu uma apresentação."}</p>
      </section>
      <section>
        <h2 className="mb-2 text-sm font-bold">Especialidades</h2>
        <div className="flex flex-wrap gap-2">
          {p.specialties.slice(0, 3).map((e) => (
            <SpecialityBadge key={e.id}>{e.name}</SpecialityBadge>
          ))}
        </div>
      </section>
    </Card>
  );
}