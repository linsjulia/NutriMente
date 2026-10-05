// =============================================================
// Link "Pular para o conteúdo"
//
// É o PRIMEIRO item que recebe foco ao apertar Tab. Fica invisível até
// receber foco. Quem navega só pelo teclado (ou por leitor de tela) pula
// direto para o conteúdo, sem ter que passar por todo o menu em toda página.
//
// O destino é o elemento com id="conteudo" de cada página.
// Toda página nova precisa ter um: <main id="conteudo">...</main>
// =============================================================

export default function SkipLink() {
  return (
    <a
      href="#conteudo"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1001] focus:rounded-lg focus:bg-white focus:p-4 focus:font-bold focus:text-blue1 focus:shadow-lg"
    >
      Pular para o conteúdo principal
    </a>
  );
}
