import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { temAcessoCRM } from "@/lib/permissoes";

const ROTAS_CRM = ["/inbox", "/funil", "/clientes", "/lembretes"];

export default withAuth(function middleware(req) {
  const papel = req.nextauth.token?.papel as string | undefined;
  const path = req.nextUrl.pathname;

  if (ROTAS_CRM.some((rota) => path.startsWith(rota)) && !temAcessoCRM(papel)) {
    return NextResponse.redirect(new URL("/chat", req.url));
  }
});

export const config = {
  matcher: [
    "/inbox/:path*",
    "/funil/:path*",
    "/clientes/:path*",
    "/lembretes/:path*",
    "/admin/:path*",
    "/chat/:path*",
  ],
};
