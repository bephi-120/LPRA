# LPRA - Music Review Platform

Sistema de reseñas de música estilo RateYourMusic con integración de YouTube Music.

## 🚀 Setup Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Base de Datos en Supabase

**IMPORTANTE:** Ejecutá el archivo `schema.sql` completo en el SQL Editor de Supabase.

1. Entrá a tu proyecto de Supabase
2. Andá a SQL Editor
3. Copiá y pegá TODO el contenido de `schema.sql`
4. Ejecutá el script

Esto va a:
- Eliminar las tablas viejas mal hechas (`albumes`, `resenas`)
- Crear las nuevas tablas correctas en inglés
- Configurar todos los índices y políticas de seguridad
- Crear vistas para estadísticas

### 3. Variables de Entorno

Creá un archivo `.env.local` con tus credenciales de Supabase (ya las tenés en Vercel):

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Ejecutar el proyecto

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
src/
├── app/              # Next.js App Router
├── components/       # Componentes reutilizables
├── lib/             # Utilidades y configuraciones
└── types/           # TypeScript types
```

## 🗄️ Esquema de Base de Datos

- **profiles**: Usuarios del sistema
- **albums**: Álbumes de música (con datos de YouTube Music)
- **songs**: Canciones individuales de cada álbum
- **song_ratings**: Calificaciones 0-10 por canción + reseña opcional
- **album_reviews**: Reseñas generales de álbumes

## ✨ Features

- ✅ Búsqueda de música usando ytmusic-api
- ✅ Reproductor de YouTube integrado
- ✅ Calificación individual por canción (0-10)
- ✅ Promedio automático del álbum
- ✅ Reseñas por canción
- ✅ Autenticación con Supabase
- ✅ Solo acceso autorizado

## 🔧 Stack Tecnológico

- **Framework:** Next.js 14 (App Router)
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Música:** ytmusic-api
- **Estilos:** Tailwind CSS
- **TypeScript:** Tipado completo
