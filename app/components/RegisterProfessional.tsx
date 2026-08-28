"use client";
import { useState } from "react";
import ButtonGender from "./ButtonGender";
import Button from "./Button";

export default function RegisterProfessional() {

    const [selected, setSelected] = useState("");

  return (
    <div className="text-center flex flex-col items-center pt-22 gap-6 w-1/2 h-screen overflow-y-auto p-10">
      {/* FLEX PAI 2 */}
      <form action="" className="flex flex-col justify-center gap-5">
        {" "}
        {/* FLEX PAI 3 */}
  
        <div className="border-t-2 border-blue1"></div>
        <div className="flex flex-col gap-7 w-[486px] my-6">
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
          {/* </div> */}
          {/* <div> */}
          <label htmlFor="gender" className="text-start font-bold">
            Selecione seu gênero
          </label>

          <ButtonGender />

            <label htmlFor="type-professional" className="text-start font-bold">Você é: </label>
            <div className="input-type-professional">
                <div>
                    <input
                    type="radio"
                    name="type-professional"
                    id="nutritionist"
                    checked={selected == "nutritionist"}
                    onChange={() => setSelected("nutritionist")}
                    />
                    <label htmlFor="nutritionist">Nutricionista</label>
                </div>

                <div>
                    <input
                    type="radio"
                    name="type-professional"
                    id="psychologist"
                    checked={selected == "psychologist"}
                    onChange={() => setSelected("psychologist")}
                    />
                    <label htmlFor="psychologist">Psicólogo</label>
                </div>
            </div>


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
          <button className="flex items-center w-40 rounded-2xl border border-gray-400 p-2 font-bold bg-white cursor-pointer">
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
