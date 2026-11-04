const API_URL = process.env.API_URL ?? "http://localhost:8080";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return new Response(null, { status: 404 });

  const response = await fetch(`${API_URL}/api/users/${id}/photo`, { cache: "no-store" });
  if (!response.ok) return new Response(null, { status: response.status });
  return new Response(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
