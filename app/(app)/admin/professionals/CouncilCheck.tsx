"use client";

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { councilRegistration, formatCouncilNumber, type ProfessionalType } from "@/app/lib/types";

/**
 * Atalho para conferir o registro no site oficial do conselho. Os conselhos
 * não têm API pública (as buscas têm captcha), então a conferência é feita
 * por uma pessoa: abre a busca certa e copia o número para colar lá.
 */
const SEARCH: Record<ProfessionalType, { council: string; url: string; tip: string }> = {
  NUTRICIONISTA: {
    council: "CFN",
    url: "https://cnn.cfn.org.br/application/index/consulta-nacional",
    tip: "Na busca, escolha a região do CRN e cole o número.",
  },
  PSICOLOGO: {
    council: "CFP",
    url: "https://cadastro.cfp.org.br/",
    tip: "Busque pelo nome ou pelo número do CRP e confira se a situação é \"Ativo\".",
  },
};

export default function CouncilCheck({ type, document, name }: { type: ProfessionalType; document: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const search = SEARCH[type];
  // A busca do conselho pede só o número; a região é escolhida à parte
  const registration = councilRegistration(document);

  async function copy() {
    try {
      await navigator.clipboard.writeText(registration);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={search.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-blue1 px-4 font-semibold text-blue1 hover:bg-blue3"
        >
          <ExternalLink aria-hidden size={16} /> Consultar no {search.council}
          <span className="sr-only"> o registro de {name} (abre em nova aba)</span>
        </a>
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-semibold text-blue1 hover:bg-blue3"
        >
          <Copy aria-hidden size={16} /> Copiar número ({registration})
        </button>
        <span role="status" className="text-sm text-green-800">
          {copied ? "Número copiado" : ""}
        </span>
      </div>
      <p className="text-sm text-gray-700">
        {formatCouncilNumber(type, document)}. {search.tip}
      </p>
    </div>
  );
}
