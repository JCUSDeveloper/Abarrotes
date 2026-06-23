# Deploy gratuito: Vercel + Render + Neon

Arquitectura recomendada:

```text
Usuario
  -> Vercel: frontend Next.js
  -> Render: backend NestJS
  -> Neon: PostgreSQL
```

## 1. Crear base de datos en Neon

1. Crea un proyecto en Neon.
2. Copia el connection string de PostgreSQL.
3. Usa la URL con SSL, por ejemplo:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require&schema=public"
```

> Recomendación: usa la URL pooled si Neon te la ofrece para apps serverless o plataformas con conexiones efímeras.

## 2. Subir el proyecto a GitHub

Antes de subirlo, verifica que no publiques archivos `.env` reales. El repositorio ya incluye `.gitignore` para ignorarlos.

```powershell
git init
git add .
git commit -m "Prepare deploy"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

## 3. Deploy del backend en Render

Puedes usar el archivo `render.yaml` desde la raíz del repositorio.

Variables necesarias en Render:

```env
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require&schema=public
CORS_ORIGIN=https://TU-FRONTEND.vercel.app
```

`JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` pueden ser generados por Render si usas `render.yaml`.

Render usará:

```bash
corepack enable && pnpm install --frozen-lockfile && pnpm deploy:build
pnpm start:deploy
```

El backend quedará disponible en algo como:

```text
https://abarrotes-backend.onrender.com/api/v1
```

Endpoint para revisar salud:

```text
https://abarrotes-backend.onrender.com/api/v1/health
```

## 4. Sembrar datos iniciales

Después del primer deploy, puedes ejecutar el seed una sola vez desde Render Shell:

```bash
pnpm prisma:seed
```

Usuario inicial del seed:

```text
admin@abarrotes.mx
admin123
```

Cámbialo inmediatamente desde la pestaña de usuarios.

## 5. Deploy del frontend en Vercel

Al importar el repo en Vercel:

1. Selecciona `frontend` como root directory.
2. Framework: Next.js.
3. Agrega variables:

```env
BACKEND_API_URL=https://abarrotes-backend.onrender.com/api/v1
AUTH_SECRET=un-secreto-largo-y-random
```

Cuando Vercel termine, copia su URL pública y vuelve a Render para ajustar:

```env
CORS_ORIGIN=https://TU-FRONTEND.vercel.app
```

Luego redeploy del backend.

## 6. Checklist de prueba

1. Abrir frontend en Vercel.
2. Iniciar sesión.
3. Crear un producto.
4. Editar precio.
5. Eliminar producto.
6. Crear usuario temporal.
7. Revisar dashboard.

## Notas del plan gratuito

- Render Free puede dormir el backend si no recibe tráfico; el primer request puede tardar.
- No expongas PostgreSQL públicamente fuera de Neon.
- No subas `.env` reales a GitHub.
