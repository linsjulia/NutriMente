import type { Meal } from "@/app/lib/patients";
import { MEAL_LABEL } from "./meal-options";

const TZ = "America/Sao_Paulo";
const dayOf = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
const timeOf = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d);

export default function TodayMeals({ meals }: { meals: Meal[] }) {
  const today = dayOf(new Date());
  const items = meals
    .filter((m) => dayOf(new Date(m.eatenAt)) === today)
    .sort((a, b) => +new Date(a.eatenAt) - +new Date(b.eatenAt));

  return (
    <section aria-labelledby="hoje" className="relative rounded-[2rem] bg-white p-8 shadow-[0_20px_60px_-24px_rgba(0,80,176,0.25)]">
      <h2 id="hoje" className="mb-5 text-lg font-extrabold">Hoje</h2>
      {items.length === 0 ? (
        <p className="text-gray-600">Nenhuma refeição registrada hoje.</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {items.map((m) => {
            const when = new Date(m.eatenAt);
            return (
              <li
                key={m.id}
                tabIndex={m.photoUrl ? 0 : undefined}
                className="group relative flex items-start gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue1"
              >
                <span aria-hidden className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-[#00dc5a]" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{MEAL_LABEL[m.mealType] ?? m.mealType}</p>
                  <p className="truncate text-gray-600">{m.description}</p>
                </div>
                <time dateTime={when.toISOString()} className="text-gray-600">{timeOf(when)}</time>

                {m.photoUrl && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute right-full top-1/2 z-20 mr-8 hidden w-40 -translate-y-1/2 translate-x-3 overflow-hidden rounded-3xl bg-white p-2 opacity-0 shadow-[0_20px_50px_-12px_rgba(0,40,100,0.35)] transition duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 lg:block"
                  >
                    <img src={m.photoUrl} alt="" loading="lazy" className="aspect-square w-full rounded-2xl object-cover" />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}