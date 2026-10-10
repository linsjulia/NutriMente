import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { api } from "@/app/lib/api";
import { requireRole } from "@/app/lib/dal";
import { deleteMeal } from "@/app/actions/patient";
import type { Page } from "@/app/lib/types";
import { DIARY_MEAL_TEXT, type Meal } from "@/app/lib/patients";
import MealList from "@/app/components/MealList";
import MealForm from "./MealForm";

export const metadata: Metadata = { title: "Diário alimentar | NutriMente" };

/** Diário alimentar do paciente: registrar refeições (com foto) e ver por dia */
export default async function DiaryPage() {
  const session = await requireRole("PATIENT");
  const result = await api<Page<Meal>>("/api/me/meals?size=50", { token: session.token });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-fraunces text-3xl font-medium sm:text-4xl">Diário alimentar</h1>
        <p className="mt-2 text-gray-700">O que você comeu e como se sentiu. Seu profissional acompanha por aqui.</p>
      </div>

      <section aria-labelledby="registrar" className="card flex flex-col gap-4">
        <h2 id="registrar" className="text-xl font-bold">Registrar refeição</h2>
        <MealForm />
      </section>

      {!result.ok ? (
        <p role="alert" className="card border-red-300 text-red-800">{result.error.detail}</p>
      ) : result.data.items.length === 0 ? (
        <p className="card text-gray-700">Nenhuma refeição registrada ainda.</p>
      ) : (
        <MealList
          meals={result.data.items}
          actions={(m, day) => (
            <form action={deleteMeal} className="self-start">
              <input type="hidden" name="id" value={m.id} />
              <button type="submit" className="flex min-h-11 items-center gap-2 rounded-full px-3 font-semibold text-red-700 hover:bg-red-50">
                <Trash2 aria-hidden size={18} /> Apagar<span className="sr-only"> {DIARY_MEAL_TEXT[m.mealType]} de {day}</span>
              </button>
            </form>
          )}
        />
      )}
    </div>
  );
}
