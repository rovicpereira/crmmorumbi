export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/inbox/:path*",
    "/funil/:path*",
    "/clientes/:path*",
    "/lembretes/:path*",
    "/admin/:path*",
  ],
};
