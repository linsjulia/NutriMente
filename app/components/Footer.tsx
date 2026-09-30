import Link from "next/link";

// Rodapé do site. <footer> (e não <section>) avisa ao leitor de tela que
// aqui é o rodapé. Em celular as colunas ficam uma embaixo da outra.
export default function Footer() {
  return (
    <footer className="border-t border-gray-300">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-3 md:py-20">
        {/* Contato */}
        <div className="flex flex-col gap-5">
          <h2 className="titulo-footer font-bold">Contato</h2>
          <p className="flex items-center gap-3">
            <img src="/icons/email.png" alt="" className="w-8" />
            <a href="mailto:nutrimente@gmail.com" className="a-footer">nutrimente@gmail.com</a>
          </p>
          <img src="/logo/nutrimente-v1.png" alt="NutriMente" className="w-32" />
        </div>

        {/* Navegue */}
        <nav aria-label="Rodapé: navegação" className="flex flex-col gap-4">
          <h2 className="titulo-footer font-bold">Navegue</h2>
          <Link className="a-footer" href="/">Home</Link>
          <Link className="a-footer" href="/professionals">Profissionais</Link>
          <Link className="a-footer" href="/register">Cadastre-se</Link>
        </nav>

        {/* Institucional */}
        <nav aria-label="Rodapé: institucional" className="flex flex-col gap-4">
          <h2 className="titulo-footer font-bold">Institucional</h2>
          <Link className="a-footer" href="/privacy">Política de Privacidade</Link>
          <Link className="a-footer" href="/terms">Termos de Uso</Link>
          <Link className="a-footer" href="/about">Sobre nós</Link>
        </nav>
      </div>
      <div className="border-t border-gray-300 px-6 py-6 text-sm">
        <p>© {new Date().getFullYear()} NutriMente. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
