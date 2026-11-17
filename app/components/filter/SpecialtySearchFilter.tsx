import type { Specialty } from "@/app/lib/types";

type Props = {
  action: string;
  specialties: Specialty[];
  query: string;
  type?: Specialty["type"];
  sort: string;
  specialtyId?: number;
};

export default function SpecialtySearchFilter({ action, specialties, query, type, sort, specialtyId }: Props) {
  return (
    <form action={action} method="get" className="my-4 flex flex-wrap items-end gap-3">
      {query && <input type="hidden" name="q" value={query} />}
      {type && <input type="hidden" name="type" value={type} />}
      {sort !== "RELEVANCE" && <input type="hidden" name="sort" value={sort} />}
      <div className="flex flex-col gap-1">
        <label htmlFor="specialty" className="font-semibold">Especialidade</label>
        <select id="specialty" name="specialty" defaultValue={specialtyId ? String(specialtyId) : ""} className="form-input shadow-md shadow-blue1/10">
          <option value="">Todas</option>
          {specialties
            .filter((specialty) => !type || specialty.type === type)
            .map((specialty) => (
              <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
            ))}
        </select>
      </div>
      <button type="submit" className="btn-secondary">Filtrar</button>
    </form>
  );
}
