"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Trash2 } from "lucide-react";
import { uploadPhoto, removePhoto } from "@/app/actions/account";
import { FormAlert, SubmitButton } from "@/app/components/form/FormParts";
import type { FormState } from "@/app/lib/form";

export default function PhotoUpload({ photoUrl }: { photoUrl: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(uploadPhoto, {});
  const [removing, setRemoving] = useState(false);
  const [removeResult, setRemoveResult] = useState<FormState>({});
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

  const alert = removeResult.message ? removeResult : state;

  return (
    <div className="flex flex-col gap-4">
      <FormAlert ok={alert.ok} message={alert.message} />
      <div className="flex items-center gap-5">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt="Sua foto"
            width={96}
            height={96}
            className="size-24 rounded-full object-cover border border-gray-300"
            unoptimized
          />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <Camera size={32} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <form action={action}>
            <input
              ref={inputRef}
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue1 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 file:cursor-pointer"
            />
            <p className="mt-1 text-xs text-gray-500">JPG, PNG ou WebP. Até 5 MB.</p>
            <SubmitButton pending={pending} className="mt-3">
              Enviar foto
            </SubmitButton>
          </form>
          {photoUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="inline-flex items-center gap-1.5 self-start text-sm text-red-700 hover:underline disabled:opacity-50"
            >
              <Trash2 size={14} />
              {removing ? "Removendo..." : "Remover foto"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
