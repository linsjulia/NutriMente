// GET /api/users/{id}/photo (no site): repassa a foto de perfil enviada pelo usuário.
//
// Foto de profissional aprovado é pública. As outras (paciente, profissional
// em análise) a API só entrega com o token de quem tem permissão: a própria
// pessoa, um admin ou quem tem vínculo de atendimento. O <img> do navegador
// não manda o token; esta rota lê o cookie httpOnly e repassa.
//
// O Cache-Control vem da API: "public" só para foto pública; "private,
// no-store" nas outras, para nenhum cache compartilhado guardar a imagem.
// Por isso, nas telas onde a foto pode ser privada, o <Image> usa
// `unoptimized` (o otimizador do Next busca sem o cookie e receberia 404).

import { getSession } from "@/app/lib/session";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export async function GET(_request: Request, ctx: RouteContext<"/api/users/[id]/photo">) {
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return new Response(null, { status: 404 });

  const session = await getSession();
  const response = await fetch(`${API_URL}/api/users/${id}/photo`, {
    headers: session ? { Authorization: `Bearer ${session.token}` } : undefined,
    cache: "no-store",
  });
  if (!response.ok) return new Response(null, { status: response.status === 401 ? 404 : response.status });

  const apiCache = response.headers.get("Cache-Control") ?? "";
  return new Response(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": apiCache.includes("public") ? apiCache : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
