"use client";
import { useState } from "react";
import GenderButton from "../../buttons/GenderButton";
import Button from "../../buttons/Button";

export default function Login() {

    const [selected, setSelected] = useState("");

  return (
    <div className="text-center flex flex-row items-center gap-6 w-1/2 h-screen">
      {/* FLEX PAI 2 */}
      <form action="" className="flex flex-col justify-center gap-5 p-15">
        {" "}
        {/* FLEX PAI 3 */}
  
        <h1 className="text-start font-bold text-2xl">Login</h1>
        <div className="flex flex-col gap-7 w-[486px] ">
          {" "}
          {/* FLEX PAI 4 */}
          <div className="flex flex-row justify-center gap-8">
            <div className="flex flex-col w-full gap-3">
            </div>

            <div className="flex flex-col w-full gap-3">
            </div>
          </div>
          {/* </div> */}
          {/* <div> */}


          <div className="flex flex-col gap-3">
            <div className="input-register">
              <label htmlFor="email">E-mail:</label>
              <input type="text" />
            </div>


              <div className="input-register flex flex-row justify-between">
                <div className="flex flex-col">
                  <label htmlFor="password">Senha:</label>
                  <input type="text" />
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
            <img src="/logo/google.png" className="w-10 mx-2" />
            Google
          </button>
        </div>

        <p>
          Ainda não está cadastrado?{" "}
          <a href="/cadastro" className="font-bold underline">Cadastre-se aqui</a>
        </p>
      </form>

      <img src="/doctor/profissionais.jpg" alt="" className="w-full h-full object-cover"/>

    </div>
  );
}
