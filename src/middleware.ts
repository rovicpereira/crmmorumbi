import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { temAcessoCRM, temAcessoDiretrizes } from "@/lib/permissoes";

const ROTAS_CRM = ["/inbox", "/funil", "/clientes", "/lembretes", "/catalogo"];
const ROTAS_DIRETRIZES = ["/diretrizes"];

export default withAuth(function middleware(req) {
  const papel = req.nextauth.token?.papel as string | undefined;
  const path = req.nextUrl.pathname;

  if (ROTAS_DIRETRIZES.some((rota) => path.startsWith(rota)) && !temAcessoDiretrizes(papel)) {
    return NextResponse.redirect(new URL(temAcessoCRM(papel) ? "/catalogo" : "/chat", req.url));
  }

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
    "/catalogo/:path*",
    "/diretrizes/:path*",
    "/admin/:path*",
    "/chat/:path*",
  ],
};
