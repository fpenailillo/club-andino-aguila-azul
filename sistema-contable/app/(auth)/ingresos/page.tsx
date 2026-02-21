"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MovimientoForm } from "@/components/forms/MovimientoForm";
import { TablaMovimientos } from "@/components/tables/TablaMovimientos";
import { Plus, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function IngresosPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleExito = (numeroRegistro: string) => {
    setDialogOpen(false);
    setRefreshKey((k) => k + 1);
    toast({
      title: "Ingreso registrado",
      description: `Número de registro: ${numeroRegistro}`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
            <TrendingUp className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Ingresos</h1>
            <p className="text-muted-foreground text-sm">
              Gestión de ingresos del club
            </p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4" />
              Nuevo Ingreso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Registrar Ingreso
              </DialogTitle>
            </DialogHeader>
            <MovimientoForm
              tipo="INGRESO"
              onSuccess={handleExito}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla */}
      <TablaMovimientos
        filtros={{ tipo: "INGRESO" }}
        refreshKey={refreshKey}
      />
    </div>
  );
}
