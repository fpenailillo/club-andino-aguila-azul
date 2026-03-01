import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  // ── Rutas siempre públicas ──────────────────────────────────────────────
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/portal/login") ||
    pathname.startsWith("/portal/verify") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // ── Sin sesión → redirigir al login apropiado ───────────────────────────
  if (!req.auth) {
    if (pathname.startsWith("/portal")) {
      return NextResponse.redirect(new URL("/portal/login", req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ── SOCIO intentando acceder al panel de administración ─────────────────
  if (
    role === "SOCIO" &&
    !pathname.startsWith("/portal") &&
    !pathname.startsWith("/api/portal")
  ) {
    return NextResponse.redirect(new URL("/portal/inicio", req.url));
  }

  // ── No-SOCIO intentando acceder al portal ───────────────────────────────
  if (
    role !== "SOCIO" &&
    pathname.startsWith("/portal") &&
    !pathname.startsWith("/portal/login") &&
    !pathname.startsWith("/portal/verify")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // ── Rutas /admin/usuarios — solo ADMIN ──────────────────────────────────
  if (pathname.startsWith("/admin/usuarios") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // ── Rutas /admin/ — ADMIN o TESORERO ────────────────────────────────────
  if (
    pathname.startsWith("/admin/") &&
    !["ADMIN", "TESORERO"].includes(role ?? "")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
