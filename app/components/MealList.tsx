import type { ReactNode } from "react";
import { DIARY_MEAL_TEXT, groupByDay, hourLabel, type Meal } from "@/app/lib/patients";

/**
 * Refeições do diário agrupadas por dia. Usada pelo paciente (com o botão
 * de apagar, em "actions") e pelo profissional (só leitura).
 * A foto passa pela rota do site (app/api/meals/[id]/photo), que põe o token.
 */
export default function MealList({ meals, actions, headingLevel = 2 }: {
  meals: Meal[];
  actions?: (meal: Meal, day: string) => ReactNode;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <>
      {groupByDay(meals).map(([day, items]) => (
        <section key={day} aria-label={day} className="flex flex-col gap-3">
          <Heading className="text-lg font-bold first-letter:uppercase">{day}</Heading>
          <ul className="flex flex-col gap-3">
            {items.map((m) => (
              <li key={m.id} className="card flex flex-col gap-3 sm:flex-row">
                {m.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/meals/${m.id}/photo`} alt={`Foto: ${m.description}`} className="h-28 w-28 shrink-0 rounded-xl object-cover" />
                )}
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-bold">{DIARY_MEAL_TEXT[m.mealType]} · {hourLabel(m.eatenAt)}</p>
                  <p>{m.description}</p>
                  {m.notes && <p className="text-gray-700">{m.notes}</p>}
                  {(m.hungerLevel || m.satisfactionLevel) && (
                    <p className="text-sm text-gray-700">
                      {[m.hungerLevel && `Fome: ${m.hungerLevel}/5`, m.satisfactionLevel && `Saciedade: ${m.satisfactionLevel}/5`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                {actions?.(m, day)}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
