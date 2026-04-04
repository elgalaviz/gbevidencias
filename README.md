# 🏗️ ProManager - Sistema de Gestión de Proyectos

Sistema profesional con **Next.js 14 + Supabase** para gestión de proyectos de contratistas con roles y permisos.

## 🎯 Roles del Sistema

| Rol | Permisos |
|-----|----------|
| 👑 **GOD** | Control total - crea usuarios, proyectos, ve todo |
| 🏢 **CLIENTE** | Ve sus proyectos, aprueba/rechaza etapas |
| 👷 **CONTRATISTA** | Gestiona proyectos, agrega ayudantes, sube evidencias |
| 🔧 **AYUDANTE** | Solo sube evidencias fotográficas |

## ⚡ Inicio Rápido

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Supabase
1. Crea cuenta en https://supabase.com
2. Crea un nuevo proyecto
3. Ve a **SQL Editor** → ejecuta `supabase-schema.sql`
4. Ve a **Storage** → crea bucket `evidences` (público)
5. Copia credenciales de **Settings → API**

### 3. Variables de Entorno
```bash
cp .env.local.example .env.local
# Edita .env.local con tus credenciales de Supabase
```

### 4. Ejecutar
```bash
npm run dev
```

### 5. Crear Usuario GOD
1. Regístrate en la app
2. En Supabase → **Table Editor** → `profiles`
3. Cambia tu `role` a `god`
4. Cierra sesión y vuelve a entrar

## 📖 Documentación Completa

Lee **GUIA-COMPLETA.md** para:
- Estructura detallada del proyecto
- Configuración paso a paso
- Sistema de permisos
- Troubleshooting
- Deploy a producción

## 🚀 Características

✅ Sistema de roles completo (GOD, Cliente, Contratista, Ayudante)  
✅ Gestión de proyectos y etapas  
✅ Subida de evidencias fotográficas  
✅ Generación de PDFs para firmas  
✅ Aprobación/rechazo de etapas por clientes  
✅ 100% responsive (móvil, tablet, desktop)  
✅ Real-time con Supabase  
✅ TypeScript + Tailwind CSS  

## 📁 Archivos Importantes

- `supabase-schema.sql` - Schema completo de la base de datos
- `GUIA-COMPLETA.md` - Documentación detallada
- `.env.local.example` - Plantilla de variables de entorno
- `types/database.ts` - Tipos TypeScript de Supabase

## 🐛 Problemas Comunes

**No puedo ver proyectos**: Verifica que ejecutaste el SQL y tienes el rol correcto  
**Error de autenticación**: Revisa `.env.local` con credenciales correctas  
**No puedo subir fotos**: Crea el bucket `evidences` en Supabase Storage

## 📄 Licencia

MIT - Úsalo libremente para tus proyectos
