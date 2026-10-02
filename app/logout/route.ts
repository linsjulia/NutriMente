// GET /logout: apaga o cookie de sessão e volta para o login.
// Usado quando a API avisa que a sessão não vale mais (ex.: conta excluída
// em outro aparelho). Páginas não podem apagar cookies durante a
// renderização, por isso existe esta rota.
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/app/lib/session";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login?expired=1", request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
