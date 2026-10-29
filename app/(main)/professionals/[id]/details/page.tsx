import type { Metadata } from "next";
import { api } from "@/app/lib/api";
import ProfileView from "@/app/components/profile/ProfileView";
import type { ProfessionalProfile, PublicReview, SlotDay } from "@/app/lib/agenda";
import type { Page } from "@/app/lib/types";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Perfil do profissional | NutriMente" };

export default async function DetailsProfessional({ params }: PageProps<"/professionals/[id]/details">) {
    const { id } = await params;
    const professionalId = Number(id);
    if (!Number.isSafeInteger(professionalId) || professionalId <= 0) notFound();

    const [profileResult, reviewsResult, slotsResult] = await Promise.all([
      api<ProfessionalProfile>(`/api/professionals/${professionalId}`),
      api<Page<PublicReview>>(`/api/professionals/${professionalId}/reviews?size=5`),
      api<SlotDay[]>(`/api/professionals/${professionalId}/slots?days=14`),
    ]);

    if (!profileResult.ok) {
      if (profileResult.error.status === 404) notFound();
      throw new Error(profileResult.error.detail);
    }
    if (!reviewsResult.ok) throw new Error(reviewsResult.error.detail);
    if (!slotsResult.ok) throw new Error(slotsResult.error.detail);

    const p = {
      ...profileResult.data,
      audiences: profileResult.data.audiences ?? [],
      consultationMinutes: profileResult.data.consultationMinutes ?? 50,
    };
    const days = slotsResult.data.filter((day) => day.slots.length > 0);

  return (
    <main id="conteudo" className="flex-1 bg-blue3">
      <ProfileView p={p} days={days} reviews={reviewsResult.data.items} />
    </main>
  );
}