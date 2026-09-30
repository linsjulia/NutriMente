// =============================================================
// Proxy (antigo "middleware" do Next.js): roda ANTES de cada página.
//
// Faz a checagem rápida ("otimista") de acesso, só olhando o cookie:
// - área logada sem sessão        -> manda para /login
// - área de admin sem ser ADMIN   -> manda para a página inicial do papel
// - login/cadastro já logado      -> manda para a página inicial do papel
//
// NÃO é a única proteção: as páginas conferem de novo (app/lib/dal.ts) e a
// API Java confere o token em toda requisição.
// =============================================================
import { NextResponse, type NextRequest } from "next/server";
import { decodeSession, homeFor, SESSION_COOKIE } from "@/app/lib/session";

const PRIVATE_ROUTES = ["/dashboard", "/account", "/admin"];
const ADMIN_ROUTES = ["/admin"];
const GUEST_ONLY_ROUTES = ["/login", "/register"];

const startsWithAny = (path: string, prefixes: string[]) =>
  prefixes.some((prefix) => path === prefix || path.startsWith(prefix + "/"));

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const session = await decodeSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (startsWithAny(path, PRIVATE_ROUTES) && !session) {
    const login = new URL("/login", request.nextUrl);
    return NextResponse.redirect(login);
  }
  if (session && startsWithAny(path, ADMIN_ROUTES) && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeFor(session.role), request.nextUrl));
  }
  if (session && startsWithAny(path, GUEST_ONLY_ROUTES)) {
    return NextResponse.redirect(new URL(homeFor(session.role), request.nextUrl));
  }
  return NextResponse.next();
}

// Não roda para arquivos estáticos (imagens, CSS, JS)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|jfif|svg|webp|ico)$).*)"],
};
