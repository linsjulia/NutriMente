export default function Footer() {
  return (
    <section className="border-t border-gray-300">
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
      </div>
    </section>
  );
}
