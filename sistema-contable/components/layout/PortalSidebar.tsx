"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Home,
  Receipt,
  CalendarCheck,
  IdCard,
  Mountain,
  LogOut,
  Info,
} from "lucide-react";

const portalNav = [
  { href: "/portal/inicio", label: "Inicio", icon: Home },
  { href: "/portal/estado-cuenta", label: "Estado de Cuenta", icon: Receipt },
  { href: "/portal/reservas", label: "Reservas Refugio", icon: CalendarCheck },
  { href: "/portal/credencial", label: "Mi Credencial", icon: IdCard },
  { href: "/portal/club", label: "Info del Club", icon: Info },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Mountain className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Club Andino</p>
          <p className="text-xs text-muted-foreground">Águila Azul</p>
        </div>
      </div>

      {/* Nombre del socio */}
      {session?.user?.name && (
        <div className="px-6 py-3 border-b bg-muted/30">
          <p className="text-xs text-muted-foreground">Bienvenido</p>
          <p className="text-sm font-medium truncate">{session.user.name}</p>
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {portalNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t">
        <button
          onClick={() => signOut({ callbackUrl: "/portal/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
