import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function proxy(req) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  if (!token && (pathname.startsWith("/porteiro") || pathname.startsWith("/morador"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const perfil = token?.perfil;

  // bloqueia por tipo de perfil
  if (pathname.startsWith("/porteiro") && perfil === "morador") {
    return NextResponse.redirect(new URL("/morador/encomendas", req.url));
  }

  if (pathname.startsWith("/morador") && perfil === "porteiro") {
    return NextResponse.redirect(new URL("/porteiro/encomendas", req.url));
  }

  if (pathname.startsWith("/porteiro/logs") && perfil !== "adminMaster") {
    return NextResponse.redirect(new URL("/acesso-negado", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/porteiro/:path*", 
    "/morador/:path*",
    "/api/porteiro/:path*",
    "/api/morador/:path*",
  ],
};
