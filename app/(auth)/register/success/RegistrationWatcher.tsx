"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkRegistration } from "@/app/actions/auth";

const INTERVAL_MS = 5000;

/**
 * Pergunta a cada 5 s se o e-mail já foi confirmado (pode ser pelo celular).
 * Quando foi, esta aba entra sozinha. Só pergunta com a aba visível, e para
 * se não houver cadastro neste navegador.
 */
export default function RegistrationWatcher() {
  const router = useRouter();
  const [watching, setWatching] = useState(true);

  useEffect(() => {
    if (!watching) return;
    let busy = false;
    const tick = async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const result = await checkRegistration();
        if (result.status === "done") router.replace(result.href);
        else if (result.status === "none") setWatching(false);
      } finally {
        busy = false;
      }
    };
    const id = window.setInterval(tick, INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [watching, router]);

  if (!watching) return null;
  return (
    <p className="rounded-xl bg-blue3 p-4 text-sm">
      Pode confirmar pelo celular: assim que o e-mail for confirmado, esta página entra sozinha.
    </p>
  );
}
