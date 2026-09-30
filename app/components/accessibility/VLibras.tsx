"use client";

// =============================================================
// VLibras - tradução do conteúdo para Libras (Língua Brasileira de Sinais)
//
// Ferramenta gratuita do Governo Federal (https://www.gov.br/governodigital/pt-br/vlibras).
// Adiciona um botão azul no lado direito da tela; ao selecionar um texto,
// um avatar 3D traduz para Libras. Muitas pessoas surdas têm Libras como
// primeira língua e o português escrito como segunda, então legenda/texto
// não é suficiente.
//
// O HTML abaixo (atributos vw, vw-access-button, vw-plugin-wrapper) é o
// formato exigido pelo plugin, conforme a documentação oficial.
// =============================================================

import Script from "next/script";

declare global {
  interface Window {
    VLibras?: { Widget: new (url: string) => unknown };
  }
}

// Atributos personalizados que o TypeScript não conhece; o spread ({...})
// deixa passá-los para o HTML sem erro de tipo.
const vw = { vw: "" };
const vwAccessButton = { "vw-access-button": "" };
const vwPluginWrapper = { "vw-plugin-wrapper": "" };

export default function VLibras() {
  return (
    <>
      <div {...vw} className="enabled">
        <div {...vwAccessButton} className="active" />
        <div {...vwPluginWrapper}>
          <div className="vw-plugin-top-wrapper" />
        </div>
      </div>

      {/*
        next/script carrega o script externo sem travar a página.
        "lazyOnload" = só baixa quando o navegador estiver ocioso (o VLibras
        é pesado e não é necessário para a página aparecer).
      */}
      <Script
        src="https://vlibras.gov.br/app/vlibras-plugin.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (!window.VLibras) return;
          new window.VLibras.Widget("https://vlibras.gov.br/app");
          // O plugin se inicializa no evento "load" da janela, que já
          // aconteceu quando carregamos de forma tardia; chamamos manualmente.
          const onload = window.onload as ((this: Window, ev: Event) => void) | null;
          onload?.call(window, new Event("load"));
        }}
      />
    </>
  );
}
