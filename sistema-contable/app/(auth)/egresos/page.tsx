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
import { Plus, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EgresosPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleExito = (numeroRegistro: string) => {
    setDialogOpen(false);
    setRefreshKey((k) => k + 1);
    toast({
      title: "Egreso registrado",
      description: `Número de registro: ${numeroRegistro}`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
            <TrendingDown className="h-5 w-5 text-red-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Egresos</h1>
            <p className="text-muted-foreground text-sm">
              Gestión de egresos del club
            </p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4" />
              Nuevo Egreso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Registrar Egreso
              </DialogTitle>
            </DialogHeader>
            <MovimientoForm
              tipo="EGRESO"
              onSuccess={handleExito}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla */}
      <TablaMovimientos
        filtros={{ tipo: "EGRESO" }}
        refreshKey={refreshKey}
      />
    </div>
  );
}
