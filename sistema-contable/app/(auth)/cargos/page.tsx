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
import { Plus, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CargosPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleExito = (numeroRegistro: string) => {
    setDialogOpen(false);
    setRefreshKey((k) => k + 1);
    toast({
      title: "Cargo registrado",
      description: `Número de registro: ${numeroRegistro}`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
            <CreditCard className="h-5 w-5 text-orange-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cargos</h1>
            <p className="text-muted-foreground text-sm">
              Cargos a cuenta de socios (cuotas, deudas)
            </p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4" />
              Nuevo Cargo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-600" />
                Registrar Cargo
              </DialogTitle>
            </DialogHeader>
            <MovimientoForm
              tipo="CARGO"
              onSuccess={handleExito}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <TablaMovimientos
        filtros={{ tipo: "CARGO" }}
        refreshKey={refreshKey}
      />
    </div>
  );
}
