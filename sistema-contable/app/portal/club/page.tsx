import { Mountain, MapPin, Phone, Mail, Clock } from "lucide-react";

export default function ClubPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Mountain className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Información del Club</h1>
      </div>

      {/* Tarjeta principal */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="text-4xl">⛰</div>
            <div>
              <h2 className="text-xl font-bold">Club Andino Águila Azul</h2>
              <p className="text-blue-200 text-sm">Desde 1953 en los Andes</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Sede principal</p>
                <p className="text-sm text-muted-foreground">
                  Av. Ejemplo 1234, Piso 3<br />
                  Santiago, Chile
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Refugio de montaña</p>
                <p className="text-sm text-muted-foreground">
                  Camino al refugio s/n<br />
                  Sector cordillera
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Teléfono</p>
                <p className="text-sm text-muted-foreground">+56 2 XXXX XXXX</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">contacto@clubandinoaguilaazul.cl</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horarios de atención */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Horarios de atención
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Lunes a viernes</span>
            <span>18:00 – 21:00 hrs</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sábados</span>
            <span>10:00 – 13:00 hrs</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Domingos y festivos</span>
            <span className="text-muted-foreground">Cerrado</span>
          </div>
        </div>
      </div>

      {/* Directiva */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Directiva {new Date().getFullYear()}</h2>
        <p className="text-sm text-muted-foreground">
          Para información sobre la directiva actual del club, contacta a la secretaría.
        </p>
      </div>
    </div>
  );
}
