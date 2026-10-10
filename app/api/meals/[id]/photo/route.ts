// GET /api/meals/{id}/photo (no site): repassa a foto da refeição.
//
// A foto na API exige o token, e o <img> do navegador não manda o token.
// Esta rota roda no servidor do Next: lê o token do cookie httpOnly, busca
// a imagem na API e devolve para o navegador, sem o token aparecer na página.

import { getSession } from "@/app/lib/session";

const API_URL = process.env.API_URL ?? "http://localhost:8080";

export async function GET(_request: Request, ctx: RouteContext<"/api/meals/[id]/photo">) {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return new Response(null, { status: 404 });

  const response = await fetch(`${API_URL}/api/meals/${id}/photo`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: "no-store",
  });
  if (!response.ok) return new Response(null, { status: response.status });
  return new Response(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
