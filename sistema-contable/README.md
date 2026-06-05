# Sistema Contable — Club Andino Águila Azul

Sistema de gestión contable moderno para el Club Andino Águila Azul, construido con Next.js 15, Prisma y PostgreSQL.

## Stack

- **Frontend:** Next.js 15 (App Router) + React 19 + Tailwind CSS
- **Backend:** Next.js API Routes
- **ORM:** Prisma
- **BD:** PostgreSQL
- **Auth:** NextAuth.js v5
- **Validación:** Zod

## Características

- Registro de ingresos y egresos con reglas de negocio
- Gestión de socios con búsqueda tolerante (tildes, orden de nombres)
- Dashboard con gráficos de evolución mensual
- Reportes exportables en CSV
- Detección automática de colecta Osvaldo y estadías en refugio
- Numeración automática de registros (ING-00000001, EGR-00000001)

## Inicio rápido

```bash
cd sistema-contable

# Instalar dependencias
npm install

# Configurar base de datos
cp .env.example .env
# Editar .env con tu DATABASE_URL

# Migrar BD y cargar datos de ejemplo
npx prisma migrate dev --name init
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

**Credenciales por defecto:**
- Email: `admin@club.cl`
- Contraseña: `cambiar_en_produccion`

## Reglas de negocio clave

| Situación | Comportamiento |
|-----------|---------------|
| Concepto: "Estadia en Refugio" | Socio = Sin asignar (Refugio) |
| Concepto: "Otros" + comentario con "osvaldo" | Socio = Sin asignar (Colecta Osvaldo) |
| Cualquier otro concepto | Socio requerido |
| Concepto de Refugio | Centro auto-asignado = Refugio |
| Resto de conceptos | Centro auto-asignado = Sede |

## Estructura

```
sistema-contable/
├── app/
│   ├── (auth)/             # Páginas autenticadas
│   │   ├── dashboard/
│   │   ├── ingresos/
│   │   ├── egresos/
│   │   ├── socios/
│   │   └── reportes/
│   ├── api/                # API Routes
│   └── login/
├── components/
│   ├── forms/
│   ├── tables/
│   ├── ui/                 # Componentes shadcn/ui
│   └── layout/
├── lib/
│   ├── reglas-negocio.ts   # Lógica de negocio central
│   ├── prisma.ts
│   ├── auth.ts
│   └── services/
├── types/
│   └── next-auth.d.ts      # Extensión de tipos de sesión
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

## Deploy

### Vercel + Railway (recomendado)

1. Crear BD en [Railway](https://railway.app) o [Supabase](https://supabase.com)
2. Configurar variables de entorno en Vercel:
   - `DATABASE_URL`
   - `AUTH_SECRET` (generado con `openssl rand -base64 32`)
   - `AUTH_URL` (ej: `https://tu-app.vercel.app`)
3. `vercel --prod`
