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
import { Plus, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AbonosPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleExito = (numeroRegistro: string) => {
    setDialogOpen(false);
    setRefreshKey((k) => k + 1);
    toast({
      title: "Abono registrado",
      description: `Número de registro: ${numeroRegistro}`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
            <Wallet className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Abonos</h1>
            <p className="text-muted-foreground text-sm">
              Pagos y créditos a cuenta de socios
            </p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Nuevo Abono
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                Registrar Abono
              </DialogTitle>
            </DialogHeader>
            <MovimientoForm
              tipo="ABONO"
              onSuccess={handleExito}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <TablaMovimientos
        filtros={{ tipo: "ABONO" }}
        refreshKey={refreshKey}
      />
    </div>
  );
}
