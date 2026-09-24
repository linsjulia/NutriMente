"use client";
import Button from "../../buttons/Button";
 
export default function Login() {
  return (
    // Container raiz ocupa a tela toda: coluna no mobile, duas metades no desktop
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* LADO DO FORMULÁRIO */}
      <div className="flex w-full flex-col px-6 py-8 sm:px-10 lg:w-1/2">
        {/* Logo fixa no topo, alinhada à esquerda */}
        <header className="flex flex-row items-center gap-5 justify-center">
          <img
            src="/logo/nutrimente-v2.png"
            alt="Nutrimente"
            className="w-30"
          />
          <h1 className="font-fraunces text-4xl text-blue1">NutriMente</h1>
        </header>
 
        {/* Formulário centralizado no espaço que sobra abaixo da logo */}
        <div className="flex flex-1 items-center justify-center py-10">
          <form action="" className="flex w-full max-w-121.5 flex-col gap-12">
            <div className="flex flex-col">
              <p className="text-center text-5xl font-bold">Bem-vindo de volta</p>
            </div>
 
            <div className="flex flex-col gap-5">
              <div className="input-register">
                <label htmlFor="email">E-mail:</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Seu e-mail"
                />
              </div>
 
              <div className="input-register">
                <label htmlFor="password">Senha:</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Sua senha"
                />
              </div>
            </div>
 
            <Button titulo="Entrar" />

            <div className="flex flex-row justify-between">
              <label htmlFor="checkbox" className="custom-checkbox">
                <input type="checkbox" id="checkbox"/>
                <span className="checkmark"></span>
                Lembrar de mim
              </label>

              <a href="/password-forgot" className="font-bold underline">Esqueceu sua senha?</a>
            </div>
 
            <div className="divider">
              <span></span>
              <p>Ou entre com</p>
              <span></span>
            </div>
 
            <div className="flex justify-center">
              <button
                type="button"
                className="flex justify-center w-40 cursor-pointer items-center rounded-[13px] border border-gray-200 bg-gray-100 p-2 font-bold"
              >
                <img src="/logo/google.png" alt="" className="mx-2 w-7" />
                Google
              </button>
            </div>
 
            <p className="text-center">
              Ainda não está cadastrado?{" "}
              <a href="/register" className="font-bold underline">
                 Cadastre-se aqui
              </a>
            </p>
          </form>
        </div>
      </div>
 

      <div className="relative hidden p-5 lg:block lg:w-1/2">
        <img
          src="/doctor/profissionais.jpg"
          alt="Profissionais de saúde"
          className=" h-full w-full object-cover  rounded-2xl"
        />
      </div>
    </div>
  );
}
 
