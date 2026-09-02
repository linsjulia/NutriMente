"use client";
import { useState } from "react";
import GenderButton from "../../buttons/GenderButton";
import Button from "../../buttons/Button";
import RegisterIconNumbers from "../../icons/RegisterIconNumbers"

export default function RegisterProfessional() {
  return(
    <section className="min-h-screen flex flex-row">
      <div className="bg-blue1 flex flex-col gap-10 p-20 text-white w-150">
        <h1 className="text-green-400 font-fraunces text-3xl">Cadastro de Profissionais</h1>
        <p className="text-[18px]">Sua jornada profissional começa aqui</p>

        <div className="flex flex-col gap-10">
          <RegisterIconNumbers
          number="1"
          title='Acesso'
          />
          
          <RegisterIconNumbers
            number="2"
            title="Identificação"
          />

          <RegisterIconNumbers
            number="3"
            title="Atuação"
          />
        </div>
      </div>

      <div className="bg-blue-100 p-20 w-234">
        <div className="flex flex-col p-10 gap-5">
          <p className="tracking-widest text-green-600">ETAPA</p>

          <h2>Dados de Acesso</h2>

          <form action="" className="form-register ">
            <div>
              <label htmlFor="name">Nome Completo</label>
              <input type="text" name="name" id="name"/>
            </div>

            <div>
              <label htmlFor="email">E-mail</label>
              <input type="email" name="email" id="email"/>
            </div>

            <div>
              <label htmlFor="password">Senha</label>
              <input type="password" name="password" id="password"/>
            </div>

          </form>
        </div>
      </div>
    </section>
  )

}
