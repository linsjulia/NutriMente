"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck } from "lucide-react";
import { registerProfessional } from "@/app/actions/auth";
import Field from "@/app/components/form/Field";
import { Checkbox, FormAlert, GenderField, SubmitButton } from "@/app/components/form/FormParts";
import type { FormState } from "@/app/lib/form";
import { applyMask, maskCpf, maskPhone, maxBirthDate } from "@/app/lib/masks";
import { COUNCIL, type ProfessionalType } from "@/app/lib/types";
import { useFocusOnError } from "@/app/components/form/useFocusOnError";

// Etapas e quais campos pertencem a cada uma (para voltar à etapa certa
// quando a API apontar erro num campo)
const STEPS = [
  { title: "Acesso", fields: ["name", "email", "password", "confirmPassword"] },
  { title: "Identificação", fields: ["cpf", "telephone", "birthDate", "gender"] },
  { title: "Atuação", fields: ["professionalType", "documentProfessional", "bio", "acceptTerms"] },
];

const PROFESSIONS: { type: ProfessionalType; label: string; description: string; image: string; placeholder: string }[] = [
  {
    type: "NUTRICIONISTA",
    label: "Nutricionista",
    description: "Acompanhamento alimentar e nutricional",
    image: "/doctor/nutricionista-register.png",
    placeholder: "Ex.: 3-12345",
  },
  {
    type: "PSICOLOGO",
    label: "Psicólogo(a)",
    description: "Acompanhamento psicológico",
    image: "/doctor/psicologo-register.png",
    placeholder: "Ex.: 06/123456",
  },
];

/**
 * Cadastro de PROFISSIONAL em 3 etapas.
 *
 * Todos os campos ficam no MESMO <form>; as etapas que não estão na tela
 * usam o atributo "hidden". Assim, ao enviar, vão todos juntos.
 *
 * O envio usa onSubmit + startTransition (e não <form action>) porque o
 * <form action> do React limpa os campos depois de enviar, e aqui a pessoa
 * pode precisar voltar a uma etapa anterior para corrigir algo.
 */
export default function RegisterProfessionalForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerProfessional, {});
  const [step, setStep] = useState(0);
  const [profession, setProfession] = useState<ProfessionalType | null>(null);
  const [document, setDocument] = useState("");
  const stepRefs = useRef<(HTMLFieldSetElement | null)[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const e = state.errors ?? {};

  // Se a API recusou algum campo, volta para a etapa dele. Feito durante a
  // renderização, quando chega uma resposta nova (padrão recomendado pelo
  // React em vez de useEffect + setState)
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    const firstWithError = STEPS.findIndex((s) => s.fields.some((field) => state.errors?.[field]));
    if (firstWithError >= 0) setStep(firstWithError);
  }

  // Ao trocar de etapa, o foco vai para o título (o leitor de tela anuncia).
  // Na primeira renderização não: a página acabou de abrir.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  // Depois do efeito acima: se a API apontou erro, o foco vai para o campo
  const resultRef = useRef<HTMLDivElement>(null);
  useFocusOnError(resultRef, state);

  /** Confere os campos da etapa atual com as regras do HTML (required, type=email...) */
  function currentStepIsValid() {
    const fieldset = stepRefs.current[step];
    if (!fieldset) return true;
    for (const input of fieldset.querySelectorAll<HTMLInputElement>("input, textarea")) {
      if (!input.checkValidity()) {
        input.reportValidity(); // mostra o aviso do navegador no campo
        return false;
      }
    }
    return true;
  }

  function next() {
    if (currentStepIsValid()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < STEPS.length - 1) return next(); // Enter nas primeiras etapas = avançar
    if (!currentStepIsValid()) return;
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <div ref={resultRef} className="flex flex-col gap-6">
      <div>
        <p className="font-bold tracking-widest text-green-700">CADASTRO PROFISSIONAL</p>
        <h1 className="mt-2 font-fraunces text-3xl font-medium sm:text-4xl">Sua jornada profissional começa aqui</h1>
        <p className="mt-3 text-gray-700">
          É paciente?{" "}
          <Link href="/register/patient" className="font-bold underline">
            Faça o cadastro de paciente
          </Link>
        </p>
      </div>

      {/* Indicador de etapas. aria-current="step" marca a etapa atual */}
      <ol className="flex gap-2" aria-label="Etapas do cadastro">
        {STEPS.map((s, index) => (
          <li
            key={s.title}
            aria-current={index === step ? "step" : undefined}
            className={`flex flex-1 flex-col gap-2 border-t-4 pt-2 text-sm font-bold ${index <= step ? "border-blue1 text-blue1" : "border-gray-300 text-gray-500"}`}
          >
            <span>
              {index + 1}. {s.title}
            </span>
          </li>
        ))}
      </ol>

      <FormAlert ok={false} message={state.message} />

      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
          Etapa {step + 1} de {STEPS.length}: {STEPS[step].title}
        </h2>

        {/* Etapa 1: acesso */}
        <fieldset ref={(el) => { stepRefs.current[0] = el; }} hidden={step !== 0} className="flex flex-col gap-5">
          <legend className="sr-only">Dados de acesso</legend>
          <Field label="Nome completo" name="name" autoComplete="name" required minLength={3} hint="Nome e sobrenome, como no documento." error={e.name} />
          <Field label="E-mail" name="email" type="email" autoComplete="email" required error={e.email} />
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
            <Field label="Repita a senha" name="confirmPassword" type="password" autoComplete="new-password" required error={e.confirmPassword} />
          </div>
        </fieldset>

        {/* Etapa 2: identificação */}
        <fieldset ref={(el) => { stepRefs.current[1] = el; }} hidden={step !== 1} className="flex flex-col gap-5">
          <legend className="sr-only">Identificação</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="CPF" name="cpf" inputMode="numeric" placeholder="000.000.000-00" required minLength={14} onInput={applyMask(maskCpf)} error={e.cpf} />
            <Field label="Celular" name="telephone" type="tel" autoComplete="tel-national" placeholder="(11) 99999-9999" hint="Com DDD." required minLength={15} onInput={applyMask(maskPhone)} error={e.telephone} />
          </div>
          <Field label="Data de nascimento" name="birthDate" type="date" autoComplete="bday" max={maxBirthDate()} required hint="É preciso ter 18 anos ou mais." error={e.birthDate} />
          <GenderField error={e.gender} />
        </fieldset>

        {/* Etapa 3: atuação */}
        <fieldset ref={(el) => { stepRefs.current[2] = el; }} hidden={step !== 2} className="flex flex-col gap-5">
          <legend className="mb-2 font-semibold">Qual é a sua profissão?</legend>
          {/* Radios com imagem: escolha única, funciona com Tab e setas */}
          <div className="grid gap-4 sm:grid-cols-2">
            {PROFESSIONS.map((p) => (
              <div key={p.type}>
                <input
                  type="radio"
                  id={`profession-${p.type}`}
                  name="professionalType"
                  value={p.type}
                  required
                  checked={profession === p.type}
                  onChange={() => {
                    setProfession(p.type);
                    setDocument(""); // CRN e CRP têm formatos diferentes
                  }}
                  className="peer sr-only"
                />
                <label htmlFor={`profession-${p.type}`} className="profession-card">
                  <span className="relative block h-32 w-full sm:h-40">
                    <Image src={p.image} alt="" fill sizes="(min-width: 640px) 288px, 100vw" className="object-cover" />
                  </span>
                  <span className="flex items-center justify-between p-3">
                    <span>
                      <span className="block font-bold">{p.label}</span>
                      <span className="block text-sm text-gray-700">{p.description}</span>
                    </span>
                    {profession === p.type && <BadgeCheck aria-hidden className="shrink-0 text-green-700" />}
                  </span>
                </label>
              </div>
            ))}
          </div>
          {e.professionalType && <p className="text-sm font-semibold text-red-700">{e.professionalType}</p>}

          {profession && (
            <Field
              label={`Número do ${COUNCIL[profession]}`}
              name="documentProfessional"
              required
              value={document}
              onChange={(event) => setDocument(event.target.value)}
              placeholder={PROFESSIONS.find((p) => p.type === profession)?.placeholder}
              hint="Vamos conferir o registro antes de liberar seu perfil para os pacientes."
              error={e.documentProfessional}
            />
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bio" className="font-semibold">
              Bio <span className="font-normal text-gray-600">(opcional)</span>
            </label>
            <textarea id="bio" name="bio" maxLength={500} rows={4} className="form-input" placeholder="Uma breve apresentação para seus pacientes" />
          </div>

          <Checkbox name="acceptTerms" error={e.acceptTerms}>
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
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-4">
          {step > 0 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-secondary">
              <ArrowLeft aria-hidden size={20} /> Voltar
            </button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="btn-primary">
              Continuar <ArrowRight aria-hidden size={20} />
            </button>
          ) : (
            <SubmitButton pending={pending}>
              Concluir cadastro <BadgeCheck aria-hidden size={22} />
            </SubmitButton>
          )}
        </div>
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
