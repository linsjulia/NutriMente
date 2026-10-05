import Image from "next/image";
import Link from "next/link";

// Rodapé do site. <footer> (e não <section>) avisa ao leitor de tela que
// aqui é o rodapé. Em celular as colunas ficam uma embaixo da outra.
export default function Footer() {
  return (
    <footer className="border-t border-gray-300">
      <div className="min-h-screen gap-50 flex flex-col">
        <div className="p-20">
          <div className="flex flex-row gap-60 p-20 justify-center ">
            {/* Contato */}
            <div className="flex flex-col gap-10">
              <h1 className="font-bold titulo-footer">Contato</h1>
              <div className="flex flex-row gap-5 items-center">
                <img src="/icons/email.png" className="w-10" />
                <p>nutrimente@gmail.com</p>
              </div>
              <img src="/logo/nutrimente-v1.png" className="w-40" />
            </div>

            {/* Navegue */}
            <div className="flex flex-col gap-5">
              <h1 className="font-bold titulo-footer">Navegue</h1>
              <a className="a-footer" href="#">Home</a>
              <a className="a-footer" href="#">Profissionais</a>
              <a className="a-footer" href="#">Serviços</a>
            </div>

            {/* Institucional */}
            <div className="flex flex-col gap-5">
              <h1 className="font-bold titulo-footer">Institucional</h1>
              <a className="a-footer" href="#">Privacidade & Política</a>
              <a className="a-footer" href="#">Termos & Condições</a>
              <a className="a-footer" href="#">Sobre nós</a>
            </div>
          </div>
        </div>
        <div className="p-10 text-[14px] border-t border-gray-300">
          <p>@Copyrights NutriMente todos os direitos reservados 2026</p>
        </div>

        {/* Navegue */}
        <nav aria-label="Rodapé: navegação" className="flex flex-col gap-1">
          <h2 className="titulo-footer font-bold">Navegue</h2>
          <Link className="a-footer" href="/">Início</Link>
          <Link className="a-footer" href="/professionals">Profissionais</Link>
          <Link className="a-footer" href="/register">Cadastre-se</Link>
        </nav>

        {/* Institucional */}
        <nav aria-label="Rodapé: institucional" className="flex flex-col gap-1">
          <h2 className="titulo-footer font-bold">Institucional</h2>
          <Link className="a-footer" href="/privacy">Política de Privacidade</Link>
          <Link className="a-footer" href="/terms">Termos de Uso</Link>
          <Link className="a-footer" href="/about">Sobre nós</Link>
        </nav>
      </div>
    </footer>
  );
}
