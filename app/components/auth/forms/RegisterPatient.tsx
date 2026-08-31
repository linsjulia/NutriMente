
"use client";
import { useState } from "react"
import Button from "../../buttons/Button"
import GenderButton from "../../buttons/GenderButton";


export default function RegisterPatient() {

    const [selected, setSelected] = useState("women");
    
    const options = [
        { id: "women", label: "Feminino" },
        { id: "men", label: "Masculino" },
    ];
    
  return (
    <div className="text-center flex flex-col items-center pt-22 gap-6 w-1/2 h-screen">

      {/* FLEX PAI 2 */}
      <form action="" className="flex flex-col justify-center gap-5">
        {" "}
        {/* FLEX PAI 3 */}
        <h1 className="text-5xl leading-1 font-medium font-fraunces text-start">
          Bem vindo!
        </h1>
        <p className="text-start">
          Para se cadastrar, preencha as informações abaixo
        </p>
        <div className="border-t-2 border-blue1"></div>
        <div className="flex flex-col gap-7 w-121.5 my-6">
          {" "}
          {/* FLEX PAI 4 */}
          <div className="flex flex-row justify-center gap-8">
            <div className="flex flex-col w-full gap-3">
              <div className="input-register">
                <label htmlFor="name">Nome completo:</label>
                <input type="text" />
              </div>

              <div className="input-register">
                <label htmlFor="birthdate">Data de nascimento:</label>
                <input type="date" />
              </div>
            </div>

            <div className="flex flex-col w-full gap-3">
              <div className="input-register">
                <label htmlFor="cpf">CPF:</label>
                <input type="text" />
              </div>

              <div className="input-register">
                <label htmlFor="numberphone">Número de celular:</label>
                <input type="text" />
              </div>
            </div>
          </div>

          <label htmlFor="gender" className="text-start font-bold">
            Selecione seu gênero
          </label>
            <GenderButton/>

          <div className="flex flex-col gap-3">
            <div className="input-register">
              <label htmlFor="email">E-mail:</label>
              <input type="text" />
            </div>

            <div className="input-register w-full flex flex-row">
              <div className="flex flex-row justify-between">
                <div className="flex flex-col">
                  <label htmlFor="password">Senha:</label>
                  <input type="text" />
                </div>

                <div className="flex flex-col">
                  <label htmlFor="password">Repita sua senha:</label>
                  <input type="text" />
                </div>
              </div>
            </div>
          </div>
          {/* </div> */}
        </div>
        <Button titulo="Cadastrar" />
        <div className="divider">
          <span></span>
          <p>Ou cadastre-se com</p>
          <span></span>
        </div>
        <div className="flex justify-center">
          <button className="flex items-center w-40 rounded-2xl p-2 font-bold bg-white cursor-pointer">
            <img src="/google.png" className="w-10 mx-2" />
            Google
          </button>
        </div>
        <p>
          Já possui uma conta?{" "}
          <span className="font-bold underline">Logar-se</span>
        </p>
      </form>
    </div>
  );
}
