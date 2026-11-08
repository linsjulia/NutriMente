import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { api } from "@/app/lib/api";
import { requireRole } from "@/app/lib/dal";
import { deleteMeal } from "@/app/actions/patient";
import type { Page } from "@/app/lib/types";
import { DIARY_MEAL_TEXT, type Meal } from "@/app/lib/patients";
import MealList from "@/app/components/MealList";
import MealForm from "./MealForm";
import TodayMeals from "./TodayMeals";

export const metadata: Metadata = { title: "Diário alimentar | NutriMente" };

/** Diário alimentar do paciente: registrar refeições (com foto) e ver por dia */
export default async function DiaryPage() {
  const session = await requireRole("PATIENT");
  const result = await api<Page<Meal>>("/api/me/meals?size=50", { token: session.token });
  const meals = result.ok ? result.data.items : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-8">
          <header>
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-blue1">Diário alimentar</p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#14304a] sm:text-[2.75rem] sm:leading-tight">
              Como foi sua refeição?
            </h1>
            <p className="mt-3 max-w-lg text-lg text-slate-600">
              Conte com calma. Seu registro ajuda o profissional que te atende a ajustar o seu plano.
            </p>
          </header>

          <section aria-labelledby="registrar" className="rounded-[1.75rem] bg-white p-6 shadow-[0_24px_60px_-28px_rgba(0,80,176,0.3)] sm:p-9">
            <h2 id="registrar" className="sr-only">Registrar refeição</h2>
            <MealForm />
          </section>
        </div>

        <aside className="flex flex-col gap-6 lg:mt-24 lg:sticky lg:top-32 lg:self-start">
          <TodayMeals meals={meals} />
          <section className="rounded-[1rem] bg-blue1 p-8 text-white">
            <h2 className="text-lg font-extrabold">Sem julgamentos</h2>
            <p className="mt-3 text-md leading-relaxed">
              Não existe resposta certa. Anotar como você se sentiu é tão importante quanto anotar o que comeu.
            </p>
          </section>
        </aside>
      </div>

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