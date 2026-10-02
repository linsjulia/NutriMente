"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { registerPatient } from "@/app/actions/auth";
import Field from "@/app/components/form/Field";
import { Checkbox, FormAlert, GenderField, SubmitButton } from "@/app/components/form/FormParts";
import type { FormState } from "@/app/lib/form";
import { applyMask, maskCpf, maskPhone, maxBirthDate } from "@/app/lib/masks";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";

/**
 * Cadastro de PACIENTE (cliente).
 * Diferente do profissional: não pede conselho de classe, mas pede o
 * consentimento para uso de dados de saúde (LGPD, art. 11), porque o
 * acompanhamento envolve informações de saúde da pessoa.
 *
 * defaultValue={state.values?.x}: se a API recusar, o formulário volta
 * preenchido com o que a pessoa digitou (menos as senhas).
 */
export default function RegisterPatientForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerPatient, {});
  const resultRef = useRef<HTMLDivElement>(null);
  useFocusOnError(resultRef, state);
  const v = state.values ?? {};
  const e = state.errors ?? {};

  return (
    <div ref={resultRef} className="flex flex-col gap-8">
      <div>
        <p className="font-bold tracking-widest text-green-700">CADASTRO DE PACIENTE</p>
        <h1 className="mt-2 font-fraunces text-4xl font-medium">Comece seu cuidado</h1>
        <p className="mt-3 text-gray-700">
          É profissional?{" "}
          <Link href="/register/professional" className="font-bold underline">
            Faça o cadastro profissional
          </Link>
        </p>
      </div>

      <FormAlert ok={false} message={state.message} />

      <form action={action} className="flex flex-col gap-5" noValidate>
        <Field label="Nome completo" name="name" autoComplete="name" required hint="Nome e sobrenome, como no documento." defaultValue={v.name} error={e.name} />
        <Field label="E-mail" name="email" type="email" autoComplete="email" required defaultValue={v.email} error={e.email} />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="CPF"
            name="cpf"
            inputMode="numeric"
            placeholder="000.000.000-00"
            required
            onInput={applyMask(maskCpf)}
            defaultValue={v.cpf}
            error={e.cpf}
          />
          <Field
            label="Celular"
            hint="Com DDD."
            name="telephone"
            type="tel"
            autoComplete="tel-national"
            placeholder="(11) 99999-9999"
            required
            onInput={applyMask(maskPhone)}
            defaultValue={v.telephone}
            error={e.telephone}
          />
        </div>

        <Field
          label="Data de nascimento"
          name="birthDate"
          type="date"
          autoComplete="bday"
          max={maxBirthDate()}
          required
          hint="É preciso ter 18 anos ou mais."
          defaultValue={v.birthDate}
          error={e.birthDate}
        />

        <GenderField defaultValue={v.gender} error={e.gender} />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Senha"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            hint="Mínimo de 8 caracteres, com letras e números."
            error={e.password}
          />
          <Field
            label="Repita a senha"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            error={e.confirmPassword}
          />
        </div>

        <Checkbox name="acceptTerms" defaultChecked={v.acceptTerms === "on"} error={e.acceptTerms}>
          Li e aceito os{" "}
          <Link href="/terms" target="_blank" className="underline">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacy" target="_blank" className="underline">
            Política de Privacidade
          </Link>
          .
        </Checkbox>
        <Checkbox name="acceptHealthData" defaultChecked={v.acceptHealthData === "on"} error={e.acceptHealthData}>
          Autorizo o uso dos meus dados de saúde pelos profissionais que eu escolher, só para o meu atendimento.
        </Checkbox>

        <SubmitButton pending={pending}>Criar conta</SubmitButton>
      </form>

      <p className="text-center">
        Já tem conta?{" "}
        <Link href="/login" className="font-bold underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
