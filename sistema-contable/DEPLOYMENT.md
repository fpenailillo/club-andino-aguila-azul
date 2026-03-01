# Despliegue en Google Cloud — Club Andino Águila Azul

Guía paso a paso para montar el sistema contable en **Google Cloud Run + Cloud SQL**, aprovechando el programa **Google for Nonprofits** (créditos de $2.000 USD/mes).

---

## Arquitectura

```
Internet → Cloud Run (Next.js) → Cloud SQL PostgreSQL
                ↑
         Google OAuth (Workspace del club)
         Secret Manager (variables de entorno)
         Artifact Registry (imágenes Docker)
         Cloud Build (CI/CD automático)
```

**Costo estimado mensual** (cubierto por créditos GCP):
| Servicio | Costo |
|----------|-------|
| Cloud Run (min-instances=0) | ~$5 |
| Cloud SQL db-f1-micro | ~$10 |
| Cloud Build (CI/CD) | gratis (≤120 min/día) |
| **Total** | **~$15/mes** |

---

## Requisitos previos

- Cuenta Google Workspace del club (administrador)
- Proyecto en Google Cloud con créditos de Nonprofits activados
- `gcloud` CLI instalado y autenticado: `gcloud auth login`
- Docker instalado (para build local si es necesario)

---

## Paso 1 — Crear y configurar el proyecto GCP

```bash
# Crear proyecto (si no existe)
gcloud projects create club-andino-aguila-azul --name="Club Andino Águila Azul"
gcloud config set project club-andino-aguila-azul

# Habilitar las APIs necesarias
gcloud services enable \
  run.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudresourcemanager.googleapis.com
```

---

## Paso 2 — Crear la base de datos Cloud SQL

```bash
# Crear instancia PostgreSQL 15 (db-f1-micro = más económica)
gcloud sql instances create club-andino-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=HDD \
  --storage-size=10GB \
  --backup-start-time=03:00 \
  --availability-type=zonal

# Crear la base de datos
gcloud sql databases create club_andino_contable --instance=club-andino-db

# Crear usuario de la aplicación
gcloud sql users create app_user \
  --instance=club-andino-db \
  --password=CAMBIA_ESTA_CONTRASEÑA

# Obtener el connection name (lo usarás en DATABASE_URL)
gcloud sql instances describe club-andino-db --format="value(connectionName)"
# Resultado: club-andino-aguila-azul:us-central1:club-andino-db
```

La `DATABASE_URL` para Cloud Run (vía Cloud SQL Auth Proxy socket):
```
postgresql://app_user:CONTRASEÑA@localhost/club_andino_contable?host=/cloudsql/club-andino-aguila-azul:us-central1:club-andino-db
```

---

## Paso 3 — Crear credenciales Google OAuth

1. Ir a [console.cloud.google.com](https://console.cloud.google.com) → **APIs y servicios** → **Credenciales**
2. Clic en **+ Crear credencial** → **ID de cliente de OAuth 2.0**
3. Tipo de aplicación: **Aplicación web**
4. Nombre: `Sistema Contable Club Andino`
5. Orígenes JavaScript autorizados:
   - `https://sistema.clubandino.cl` (dominio personalizado)
   - `https://sistema-contable-XXXX-uc.a.run.app` (URL de Cloud Run)
6. URI de redirección autorizados:
   - `https://sistema.clubandino.cl/api/auth/callback/google`
   - `https://sistema-contable-XXXX-uc.a.run.app/api/auth/callback/google`
7. Guardar y anotar **Client ID** y **Client Secret**

> **Importante**: En OAuth consent screen, agregar el dominio `clubandino.cl` en "Dominios autorizados".

---

## Paso 4 — Configurar Secret Manager

```bash
# AUTH_SECRET (generar uno seguro)
openssl rand -base64 32 | gcloud secrets create AUTH_SECRET --data-file=-

# DATABASE_URL (con socket de Cloud SQL Auth Proxy)
echo -n "postgresql://app_user:CONTRASEÑA@localhost/club_andino_contable?host=/cloudsql/club-andino-aguila-azul:us-central1:club-andino-db" \
  | gcloud secrets create DATABASE_URL --data-file=-

# Google OAuth
echo -n "TU_CLIENT_ID.apps.googleusercontent.com" \
  | gcloud secrets create AUTH_GOOGLE_ID --data-file=-

echo -n "TU_CLIENT_SECRET" \
  | gcloud secrets create AUTH_GOOGLE_SECRET --data-file=-
```

### Dar permisos a Cloud Run para leer los secretos

```bash
# Obtener el service account de Cloud Run
PROJECT_NUMBER=$(gcloud projects describe club-andino-aguila-azul --format="value(projectNumber)")
SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

# Dar acceso a Secret Manager
gcloud projects add-iam-policy-binding club-andino-aguila-azul \
  --member="serviceAccount:$SA" \
  --role="roles/secretmanager.secretAccessor"

# Dar acceso a Cloud SQL
gcloud projects add-iam-policy-binding club-andino-aguila-azul \
  --member="serviceAccount:$SA" \
  --role="roles/cloudsql.client"
```

---

## Paso 5 — Configurar Artifact Registry

```bash
# Crear repositorio de imágenes Docker
gcloud artifacts repositories create sistema-contable \
  --repository-format=docker \
  --location=us-central1 \
  --description="Imágenes del sistema contable"

# Autorizar a Docker usar el registry de GCP
gcloud auth configure-docker us-central1-docker.pkg.dev
```

> **Nota**: El `cloudbuild.yaml` usa `gcr.io` (Container Registry legacy). Si prefieres Artifact Registry, cambia `_REPO` en `cloudbuild.yaml` a `us-central1-docker.pkg.dev/$PROJECT_ID/sistema-contable/sistema-contable`.

---

## Paso 6 — Conectar repositorio a Cloud Build

1. Ir a [console.cloud.google.com/cloud-build/triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Clic en **Conectar repositorio**
3. Seleccionar GitHub y autorizar
4. Seleccionar el repo `club-andino-aguila-azul`
5. Crear trigger:
   - Nombre: `deploy-sistema-contable`
   - Evento: Push a rama `main`
   - Carpeta base: `sistema-contable/`
   - Archivo de configuración: `cloudbuild.yaml`

> A partir de ahora, cada `git push` a `main` desplegará automáticamente.

---

## Paso 7 — Primer despliegue manual

Antes del primer push automático, hacer el despliegue inicial:

```bash
cd sistema-contable

# Build local
docker build -t gcr.io/club-andino-aguila-azul/sistema-contable:latest .

# Push al registry
docker push gcr.io/club-andino-aguila-azul/sistema-contable:latest

# Desplegar en Cloud Run
gcloud run deploy sistema-contable \
  --image=gcr.io/club-andino-aguila-azul/sistema-contable:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest \
  --set-secrets=AUTH_SECRET=AUTH_SECRET:latest \
  --set-secrets=AUTH_GOOGLE_ID=AUTH_GOOGLE_ID:latest \
  --set-secrets=AUTH_GOOGLE_SECRET=AUTH_GOOGLE_SECRET:latest \
  --set-env-vars=AUTH_URL=https://sistema.clubandino.cl \
  --set-env-vars=NODE_ENV=production \
  --add-cloudsql-instances=club-andino-aguila-azul:us-central1:club-andino-db \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3

# Obtener la URL del servicio
gcloud run services describe sistema-contable \
  --region=us-central1 \
  --format="value(status.url)"
```

---

## Paso 8 — Inicializar la base de datos

Una vez que Cloud Run está corriendo, ejecutar las migraciones y el seed desde local apuntando a Cloud SQL:

```bash
# Conectar al Cloud SQL usando Cloud SQL Auth Proxy
cloud-sql-proxy club-andino-aguila-azul:us-central1:club-andino-db &

# En otra terminal, con la BD accesible en localhost:5432
DATABASE_URL="postgresql://app_user:CONTRASEÑA@localhost/club_andino_contable" \
  npx prisma db push

# Seed inicial (categorías, conceptos, usuario admin)
DATABASE_URL="postgresql://app_user:CONTRASEÑA@localhost/club_andino_contable" \
  npm run db:seed

# Migración desde Kiwi (datos históricos)
DATABASE_URL="postgresql://app_user:CONTRASEÑA@localhost/club_andino_contable" \
  npm run db:migrate-kiwi
```

> Descargar Cloud SQL Auth Proxy: https://cloud.google.com/sql/docs/postgres/connect-auth-proxy

---

## Paso 9 — Dominio personalizado (opcional)

```bash
# Mapear dominio personalizado a Cloud Run
gcloud run domain-mappings create \
  --service=sistema-contable \
  --domain=sistema.clubandino.cl \
  --region=us-central1

# Obtener los registros DNS a configurar
gcloud run domain-mappings describe \
  --domain=sistema.clubandino.cl \
  --region=us-central1
```

Agregar los registros CNAME/A que devuelve el comando anterior en el panel DNS del dominio `clubandino.cl`.

---

## Paso 10 — Usuario administrador inicial

Después del seed, cambiar la contraseña del usuario admin:

```bash
# Conectado a Cloud SQL Auth Proxy
psql "postgresql://app_user:CONTRASEÑA@localhost/club_andino_contable" \
  -c "UPDATE \"Usuario\" SET \"passwordHash\" = crypt('NUEVA_CONTRASEÑA', gen_salt('bf')) WHERE email = 'admin@clubandino.cl';"
```

O usar el script de seed que ya crea el usuario `admin@clubandino.cl` con contraseña `admin123` (cambiar en producción).

---

## Variables de entorno de referencia

| Variable | Descripción | Origen |
|----------|-------------|--------|
| `DATABASE_URL` | URL de conexión PostgreSQL | Secret Manager |
| `AUTH_SECRET` | Clave secreta de NextAuth | Secret Manager |
| `AUTH_URL` | URL pública del sistema | `cloudbuild.yaml` (env var directa) |
| `AUTH_GOOGLE_ID` | Client ID de Google OAuth | Secret Manager |
| `AUTH_GOOGLE_SECRET` | Client Secret de Google OAuth | Secret Manager |
| `NODE_ENV` | Entorno de ejecución | `cloudbuild.yaml` (env var directa) |

---

## Flujo de CI/CD

```
git push origin main
       ↓
Cloud Build trigger
       ↓
1. docker build (con cache)
2. docker push → gcr.io/PROJECT_ID/sistema-contable
3. gcloud run deploy → Cloud Run actualiza sin downtime
```

**Tiempo estimado de despliegue**: 3-5 minutos por push.

---

## Monitoreo

```bash
# Ver logs del servicio en tiempo real
gcloud run services logs tail sistema-contable --region=us-central1

# Ver métricas de uso
gcloud run services describe sistema-contable --region=us-central1

# Ver historial de builds
gcloud builds list --filter="substitutions.TRIGGER_NAME=deploy-sistema-contable"
```
