import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Mapeamento de rotas restritas por perfil (RNF02)
// Rotas não listadas aqui exigem apenas autenticação (qualquer perfil logado).
const ROTAS_RESTRITAS = [
  { prefixo: "/encomendas", perfis: ["porteiro", "sindico", "administrador", "adminMaster"] },
  { prefixo: "/reservas", perfis: ["morador", "sindico", "administrador", "adminMaster"] },
  { prefixo: "/moradores", perfis: ["sindico", "administrador", "adminMaster"] },
  { prefixo: "/apartamentos", perfis: ["sindico", "administrador", "adminMaster"] },
  { prefixo: "/areas-comuns", perfis: ["administrador", "adminMaster"] },
  { prefixo: "/administradores", perfis: ["administrador", "adminMaster"] },
  { prefixo: "/logs", perfis: ["adminMaster"] },
];

export default withAuth(
  function middleware(request) {
    const { pathname } = request.nextUrl;
    const perfil = request.nextauth.token?.perfil;

    const regra = ROTAS_RESTRITAS.find((r) => pathname.startsWith(r.prefixo));

    if (regra && !regra.perfis.includes(perfil)) {
      const url = request.nextUrl.clone();
      url.pathname = "/acesso-negado";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/encomendas/:path*",
    "/reservas/:path*",
    "/moradores/:path*",
    "/apartamentos/:path*",
    "/areas-comuns/:path*",
    "/administradores/:path*",
    "/logs/:path*",
  ],
};