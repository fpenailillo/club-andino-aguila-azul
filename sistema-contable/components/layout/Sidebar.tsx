"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  Mountain,
  LogOut,
  CreditCard,
  Wallet,
  CalendarCheck,
  IdCard,
  UserCog,
  Settings,
  ScrollText,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navGroups = [
  {
    label: "Contabilidad",
    roles: ["ADMIN", "TESORERO", "USUARIO"],
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "TESORERO", "USUARIO"] },
      { href: "/ingresos", label: "Ingresos", icon: TrendingUp, roles: ["ADMIN", "TESORERO", "USUARIO"] },
      { href: "/egresos", label: "Egresos", icon: TrendingDown, roles: ["ADMIN", "TESORERO", "USUARIO"] },
      { href: "/cargos", label: "Cargos", icon: CreditCard, roles: ["ADMIN", "TESORERO", "USUARIO"] },
      { href: "/abonos", label: "Abonos", icon: Wallet, roles: ["ADMIN", "TESORERO", "USUARIO"] },
      { href: "/reportes", label: "Reportes", icon: BarChart3, roles: ["ADMIN", "TESORERO", "USUARIO"] },
    ],
  },
  {
    label: "Club",
    roles: ["ADMIN", "TESORERO", "USUARIO"],
    items: [
      { href: "/socios", label: "Socios", icon: Users, roles: ["ADMIN", "TESORERO", "USUARIO"] },
      { href: "/credenciales", label: "Credenciales", icon: IdCard, roles: ["ADMIN", "TESORERO", "USUARIO"] },
    ],
  },
  {
    label: "Refugio",
    roles: ["ADMIN", "TESORERO", "USUARIO"],
    items: [
      { href: "/reservas", label: "Reservas", icon: CalendarCheck, roles: ["ADMIN", "TESORERO", "USUARIO"] },
    ],
  },
  {
    label: "Administración",
    roles: ["ADMIN", "TESORERO"],
    items: [
      { href: "/admin/usuarios", label: "Usuarios", icon: UserCog, roles: ["ADMIN"] },
      { href: "/admin/configuracion", label: "Configuración", icon: Settings, roles: ["ADMIN", "TESORERO"] },
      { href: "/admin/auditoria", label: "Auditoría", icon: ScrollText, roles: ["ADMIN", "TESORERO"] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";

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

      {/* Navegación agrupada */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => {
          if (!group.roles.includes(role)) return null;
          const visibleItems = group.items.filter((item) =>
            item.roles.includes(role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label}>
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
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
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
