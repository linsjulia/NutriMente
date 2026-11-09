"use client";

import { useActionState, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { Camera, Trash2 } from "lucide-react";
import { uploadPhoto, removePhoto } from "@/app/actions/account";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import type { FormState } from "@/app/lib/form";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

export default function PhotoUpload({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(uploadPhoto, {});
  const [removing, setRemoving] = useState(false);
  const [removeResult, setRemoveResult] = useState<FormState>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleRemove() {
    setRemoving(true);
    try {
      const result = await removePhoto();
      setRemoveResult(result);
    } finally {
      setRemoving(false);
    }
  }

  // Confere tipo e tamanho antes de enviar (o servidor valida de novo).
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setRemoveResult({});
    if (!file) {
      setFileName(null);
      setClientError(null);
      return;
    }
    if (!ACCEPTED.includes(file.type)) {
      setClientError("Use uma imagem JPG, PNG ou WebP.");
    } else if (file.size > MAX_BYTES) {
      setClientError("A foto precisa ter até 5 MB.");
    } else {
      setClientError(null);
      setFileName(file.name);
      return;
    }
    e.target.value = "";
    setFileName(null);
  }

  const alert: FormState = clientError
    ? { ok: false, message: clientError }
    : removeResult.message
      ? removeResult
      : state;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt="Sua foto de perfil"
          width={128}
          height={128}
          className="size-32 rounded-full border border-gray-200 object-cover ring-4 ring-blue-50"
          unoptimized
        />
      ) : (
        <div
          aria-hidden="true"
          className="font-fraunces flex size-32 items-center justify-center rounded-full bg-blue-50 text-4xl font-medium text-blue-800 ring-4 ring-blue-50"
        >
          {initials(name)}
        </div>
      )}

      <p className="font-fraunces text-xl font-medium">{name}</p>

      <div className="w-full">
        <FormAlert ok={alert.ok} message={alert.message} />
      </div>

      <form
        action={action}
        onReset={() => setFileName(null)}
        className="flex w-full flex-col gap-2"
      >
        <input
          ref={inputRef}
          type="file"
          name="photo"
          accept={ACCEPTED.join(",")}
          onChange={handleChange}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
        <button type="button" onClick={() => inputRef.current?.click()} className="btn-secondary w-full justify-center gap-2">
          <Camera size={18} aria-hidden="true" />
          {photoUrl || fileName ? "Escolher outra foto" : "Escolher foto"}
        </button>

        {fileName && (
          <>
            <p className="truncate text-sm text-gray-700" title={fileName}>
              {fileName}
            </p>
            <SubmitButton pending={pending} className="w-full justify-center">
              Enviar foto
            </SubmitButton>
          </>
        )}
        <p className="text-xs text-gray-500">JPG, PNG ou WebP. Até 5 MB.</p>
      </form>

      {photoUrl && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          className="inline-flex items-center gap-1.5 text-sm text-red-700 hover:underline disabled:opacity-50"
        >
          <Trash2 size={14} aria-hidden="true" />
          {removing ? "Removendo..." : "Remover foto"}
        </button>
      )}
    </div>
  );
}