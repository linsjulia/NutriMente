import Image from "next/image";

// Logo do cabeçalho público.
// - width/height: mesma proporção do arquivo (490x494), no tamanho em que a logo
//   aparece (~64px). O Next usa isso para escolher o arquivo certo (64px e 128px
//   para telas de alta densidade); o tamanho final vem do CSS (h-full w-auto).
// - loading="eager": a logo aparece no topo de todas as páginas e costuma ser o
//   maior elemento visível no início (LCP). Carregar "preguiçosamente" atrasava a página.
export default function Logo() {
  return (
    <Image
      src="/logo/nutrimente-v1.png"
      width={64}
      height={65}
      loading="eager"
      draggable={false}
      alt="Logo do NutriMente"
      className="select-none"
    />
  );
}
