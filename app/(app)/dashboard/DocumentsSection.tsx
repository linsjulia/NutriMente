"use client";

import { useActionState, useRef } from "react";
import { Trash2 } from "lucide-react";
import { deleteDocument, uploadDocument } from "@/app/actions/professional";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";
import type { FormState } from "@/app/lib/form";

export type ProfessionalDocument = {
  id: number;
  documentType: string;
  contentType: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNotes: string | null;
  createdAt: string;
};

const TYPES: Record<string, string> = {
  REGISTRO_CONSELHO: "Carteira ou certidão do conselho",
  DIPLOMA: "Diploma",
  IDENTIDADE: "Documento de identidade",
  OUTRO: "Outro",
};
const STATUS: Record<ProfessionalDocument["status"], [string, string]> = {
  PENDING: ["Em análise", "bg-gray-200 text-gray-900"],
  APPROVED: ["Aprovado", "bg-green-100 text-green-900"],
  REJECTED: ["Recusado", "bg-red-100 text-red-900"],
};

/** Documentos para a equipe conferir o registro profissional */
export default function DocumentsSection({ documents }: { documents: ProfessionalDocument[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(uploadDocument, {});
  const ref = useRef<HTMLFormElement>(null);
  useFocusOnError(ref, state);
  return (
    <div className="flex flex-col gap-5">
      {documents.length > 0 && (
        <ul className="flex flex-col gap-2">
          {documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-2">
              <span className="flex flex-col">
                <span className="font-semibold">{TYPES[d.documentType]}</span>
                <span className="text-sm text-gray-700">{d.contentType === "application/pdf" ? "PDF" : "Imagem"} · enviado em {new Date(d.createdAt).toLocaleDateString("pt-BR")}</span>
                {d.status === "REJECTED" && d.reviewNotes && <span className="text-sm text-red-800">Motivo: {d.reviewNotes}</span>}
              </span>
              <span className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${STATUS[d.status][1]}`}>{STATUS[d.status][0]}</span>
                {d.status !== "APPROVED" && (
                  <form action={deleteDocument}>
                    <input type="hidden" name="id" value={d.id} />
                    <button type="submit" aria-label={`Apagar ${TYPES[d.documentType]}`} className="flex h-11 w-11 items-center justify-center rounded-full text-red-700 hover:bg-red-50">
                      <Trash2 aria-hidden size={18} />
                    </button>
                  </form>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      <form ref={ref} action={action} className="flex flex-col gap-4" noValidate>
        <FormAlert ok={state.ok} message={state.message} />
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="documentType" className="font-semibold">Tipo</label>
            <select id="documentType" name="documentType" defaultValue="" className="form-input" aria-invalid={state.errors?.documentType ? true : undefined}>
              <option value="">Escolha</option>
              {Object.entries(TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {state.errors?.documentType && <p className="text-sm font-semibold text-red-700">{state.errors.documentType}</p>}
          </div>
          <div className="flex min-w-60 flex-1 flex-col gap-1.5">
            <label htmlFor="file" className="font-semibold">Arquivo</label>
            <input id="file" name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" aria-describedby="file-hint"
              aria-invalid={state.errors?.file ? true : undefined} className="form-input" />
            <p id="file-hint" className="text-sm text-gray-600">PDF, JPG, PNG ou WebP, até 5 MB. Guardado de forma criptografada.</p>
            {state.errors?.file && <p className="text-sm font-semibold text-red-700">{state.errors.file}</p>}
          </div>
        </div>
        <SubmitButton pending={pending} className="self-start">Enviar documento</SubmitButton>
      </form>
    </div>
  );
}
