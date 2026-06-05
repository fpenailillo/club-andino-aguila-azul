"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserCog, Plus, ShieldCheck, ShieldOff } from "lucide-react";

type Usuario = {
  id: number;
  email: string;
  nombre: string;
  rol: "ADMIN" | "TESORERO" | "USUARIO" | "SOCIO";
  activo: boolean;
  lastLogin: string | null;
  createdAt: string;
};

const ROL_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  TESORERO: "Tesorero",
  USUARIO: "Usuario",
  SOCIO: "Socio (portal)",
};

const ROL_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  TESORERO: "bg-blue-100 text-blue-700",
  USUARIO: "bg-green-100 text-green-700",
  SOCIO: "bg-purple-100 text-purple-700",
};

export default function UsuariosPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);

  const [form, setForm] = useState({
    email: "",
    nombre: "",
    rol: "USUARIO" as string,
    password: "",
  });

  const esAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    setLoading(true);
    const res = await fetch("/api/admin/usuarios");
    if (res.ok) {
      setUsuarios(await res.json());
    }
    setLoading(false);
  }

  function abrirCrear() {
    setEditando(null);
    setForm({ email: "", nombre: "", rol: "USUARIO", password: "" });
    setDialogOpen(true);
  }

  function abrirEditar(u: Usuario) {
    setEditando(u);
    setForm({ email: u.email, nombre: u.nombre, rol: u.rol, password: "" });
    setDialogOpen(true);
  }

  async function guardar() {
    if (editando) {
      const res = await fetch("/api/admin/usuarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editando.id, nombre: form.nombre, rol: form.rol }),
      });
      if (res.ok) {
        toast({ title: "Usuario actualizado" });
        setDialogOpen(false);
        cargarUsuarios();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } else {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: "Usuario creado" });
        setDialogOpen(false);
        cargarUsuarios();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    }
  }

  async function toggleActivo(u: Usuario) {
    const res = await fetch("/api/admin/usuarios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, activo: !u.activo }),
    });
    if (res.ok) {
      toast({ title: u.activo ? "Usuario desactivado" : "Usuario activado" });
      cargarUsuarios();
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error, variant: "destructive" });
    }
  }

  if (!esAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Sin permisos para acceder a esta sección.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCog className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Usuarios del sistema</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button
              onClick={abrirCrear}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nuevo usuario
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editando ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {!editando && (
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <input
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="usuario@ejemplo.cl"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="TESORERO">Tesorero</option>
                  <option value="USUARIO">Usuario</option>
                  <option value="SOCIO">Socio (portal)</option>
                </select>
              </div>
              {!editando && (
                <div className="space-y-1.5">
                  <Label>Contraseña (opcional para socios)</Label>
                  <input
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setDialogOpen(false)}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardar}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {editando ? "Guardar" : "Crear"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Rol</th>
                <th className="text-left px-4 py-3 font-medium">Último acceso</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-right px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{u.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROL_COLORS[u.rol]}`}>
                      {ROL_LABELS[u.rol]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.lastLogin
                      ? new Date(u.lastLogin).toLocaleDateString("es-CL", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                        })
                      : "Nunca"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${u.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => abrirEditar(u)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Editar"
                      >
                        <UserCog className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleActivo(u)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title={u.activo ? "Desactivar" : "Activar"}
                      >
                        {u.activo ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {usuarios.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">No hay usuarios registrados.</div>
          )}
        </div>
      )}
    </div>
  );
}
