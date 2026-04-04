# 🏗️ ProManager - Sistema Completo con Next.js y Supabase

Sistema profesional de gestión de proyectos para contratistas con sistema de roles completo.

## 📋 Sistema de Roles

### 👑 GOD (Super Admin)
- **Permisos totales**: Ver, crear, editar y eliminar TODO
- Crear usuarios (clientes y contratistas)
- Asignar proyectos
- Ver dashboard global con todos los proyectos
- Acceso a logs de actividad

### 🏢 CLIENTE
- Ver solo SUS proyectos asignados
- Ver todas las etapas y evidencias de sus proyectos
- **Aprobar o rechazar** etapas completadas
- Descargar PDFs de entrega
- No puede editar ni crear proyectos

### 👷 CONTRATISTA
- Ver proyectos donde está asignado como contratista
- Crear y editar etapas
- **Agregar ayudantes** a sus proyectos
- Subir evidencias
- Cambiar estado de etapas
- Generar PDFs para firmas
- Marcar etapas como completadas

### 🔧 AYUDANTE
- Ver proyectos donde está asignado
- **Solo subir evidencias** fotográficas
- Ver etapas asignadas
- No puede crear ni editar proyectos/etapas

---

## 🚀 Instalación Paso a Paso

### 1. Requisitos Previos
```bash
# Necesitas tener instalado:
- Node.js 18+ 
- npm o yarn
- Cuenta en Supabase (gratis en supabase.com)
```

### 2. Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Click en "New Project"
3. Elige un nombre, contraseña y región
4. **Espera 2-3 minutos** mientras se crea

### 3. Configurar Base de Datos

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Copia y pega TODO el contenido del archivo `supabase-schema.sql`
3. Click en **Run** (ejecutar)
4. Verifica que se crearon las tablas en **Table Editor**

### 4. Configurar Storage

1. Ve a **Storage** en Supabase
2. Click en "Create bucket"
3. Nombre: `evidences`
4. **Marcar como público** (Public bucket: ON)
5. Click en "Create bucket"

6. Configurar políticas de Storage:
   - Click en el bucket `evidences`
   - Ve a "Policies"
   - Click "New Policy"
   - Crear dos políticas:

**Política 1: Upload**
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidences');
```

**Política 2: View**
```sql
CREATE POLICY "Anyone can view evidences"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'evidences');
```

### 5. Obtener Credenciales de Supabase

1. Ve a **Project Settings** (ícono de engranaje)
2. Click en **API**
3. Copia:
   - `Project URL` → Esta es tu NEXT_PUBLIC_SUPABASE_URL
   - `anon public` key → Esta es tu NEXT_PUBLIC_SUPABASE_ANON_KEY

### 6. Clonar e Instalar el Proyecto

```bash
# Si tienes el código en un ZIP, descomprime
# O clona el repositorio

cd promanager-nextjs

# Instalar dependencias
npm install
```

### 7. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.local.example .env.local

# Editar .env.local y pegar tus credenciales
nano .env.local  # o usa tu editor favorito
```

Tu archivo `.env.local` debe verse así:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-aqui
```

### 8. Ejecutar el Proyecto

```bash
# Modo desarrollo
npm run dev

# Abrir en navegador
# http://localhost:3000
```

### 9. Crear Usuario GOD Inicial

**Opción A: Desde el registro**
1. Registra tu primera cuenta en la app
2. Ve a Supabase → **Table Editor** → tabla `profiles`
3. Encuentra tu usuario (busca por email)
4. Edita el campo `role` → cambia a `god`
5. Guarda cambios
6. Cierra sesión y vuelve a iniciar

**Opción B: Desde SQL Editor**
```sql
-- Reemplaza con TU email
UPDATE profiles 
SET role = 'god' 
WHERE email = 'tu@email.com';
```

---

## 📁 Estructura de Archivos del Proyecto

```
promanager-nextjs/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Layout principal
│   ├── page.tsx                 # Página de inicio (redirige)
│   ├── globals.css              # Estilos globales
│   │
│   ├── login/                   # Autenticación
│   │   └── page.tsx             # Login/Registro
│   │
│   ├── auth/callback/           # Callback de auth
│   │   └── route.ts
│   │
│   └── dashboard/               # Dashboard principal
│       ├── page.tsx             # Vista del dashboard
│       ├── layout.tsx           # Layout del dashboard
│       │
│       ├── projects/            # Gestión de proyectos
│       │   ├── page.tsx         # Lista de proyectos
│       │   ├── [id]/            # Detalle de proyecto
│       │   │   └── page.tsx
│       │   └── new/             # Crear proyecto
│       │       └── page.tsx
│       │
│       ├── users/               # Gestión de usuarios (solo GOD)
│       │   ├── page.tsx
│       │   └── new/
│       │       └── page.tsx
│       │
│       └── settings/            # Configuración perfil
│           └── page.tsx
│
├── components/                   # Componentes React
│   ├── ui/                      # Componentes UI base
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   │
│   ├── auth/
│   │   └── AuthGuard.tsx        # Protección de rutas
│   │
│   ├── dashboard/
│   │   ├── Navbar.tsx           # Barra de navegación
│   │   ├── Sidebar.tsx          # Menú lateral
│   │   └── StatsCards.tsx       # Tarjetas estadísticas
│   │
│   ├── projects/
│   │   ├── ProjectCard.tsx      # Tarjeta de proyecto
│   │   ├── ProjectForm.tsx      # Formulario proyecto
│   │   ├── ProjectList.tsx      # Lista proyectos
│   │   └── TeamManager.tsx      # Gestión equipo
│   │
│   ├── stages/
│   │   ├── StageCard.tsx        # Tarjeta etapa
│   │   ├── StageForm.tsx        # Formulario etapa
│   │   ├── StageList.tsx        # Lista etapas
│   │   └── ApprovalButtons.tsx  # Botones aprobar/rechazar
│   │
│   └── evidences/
│       ├── EvidenceUpload.tsx   # Subir evidencias
│       ├── EvidenceGallery.tsx  # Galería fotos
│       ├── ImageViewer.tsx      # Visor pantalla completa
│       └── PDFGenerator.tsx     # Generar PDF
│
├── lib/                          # Utilidades
│   ├── supabase.ts              # Cliente Supabase
│   ├── auth.ts                  # Helpers autenticación
│   ├── permissions.ts           # Lógica de permisos
│   └── pdf-generator.ts         # Generación PDFs
│
├── types/                        # Tipos TypeScript
│   └── database.ts              # Tipos DB Supabase
│
├── hooks/                        # Custom React Hooks
│   ├── useAuth.ts               # Hook autenticación
│   ├── useProjects.ts           # Hook proyectos
│   ├── useStages.ts             # Hook etapas
│   └── usePermissions.ts        # Hook permisos
│
├── utils/                        # Funciones utilidad
│   ├── format.ts                # Formateo fechas/texto
│   ├── validation.ts            # Validaciones
│   └── constants.ts             # Constantes app
│
├── public/                       # Archivos estáticos
│   └── logo.png
│
├── supabase-schema.sql          # ⭐ Schema completo DB
├── .env.local.example           # Ejemplo variables entorno
├── .env.local                   # TUS variables (no subir a git)
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

---

## 🎨 Características de la UI

### ✅ Responsive Design
- **Desktop**: Sidebar + contenido principal
- **Tablet**: Sidebar colapsable
- **Móvil**: Menú hamburguesa, tarjetas apiladas

### 🎨 Temas y Colores
- Gradiente principal: Púrpura/Violeta profesional
- Tarjetas con sombras suaves
- Animaciones smooth en hover
- Badges de estado con colores semánticos

### 📱 Componentes Móviles
- Botones grandes touch-friendly
- Modales ocupan pantalla completa en móvil
- Galería de fotos optimizada para táctil
- Formularios adaptados a teclado móvil

---

## 🔐 Flujo de Permisos

### Crear Proyecto (solo GOD)
1. GOD crea proyecto
2. Asigna cliente
3. Asigna contratista (opcional)

### Agregar Equipo (GOD o CONTRATISTA)
1. Contratista va a su proyecto
2. Click en "Agregar Ayudante"
3. Selecciona usuario con rol ayudante
4. Ayudante ahora ve el proyecto

### Subir Evidencias (CONTRATISTA o AYUDANTE)
1. Ir a etapa del proyecto
2. Click en "Subir Evidencias"
3. Seleccionar fotos
4. Fotos se suben a Supabase Storage
5. URLs se guardan en DB

### Aprobar Etapa (solo CLIENTE)
1. Cliente ve etapa con status "completed"
2. Revisa evidencias
3. Opciones:
   - ✅ Aprobar → status = "approved"
   - ❌ Rechazar → status = "rejected" + motivo

---

## 📄 Generación de PDFs

### Contenido del PDF:
```
┌─────────────────────────────────────┐
│    ACTA DE ENTREGA DE ETAPA        │
├─────────────────────────────────────┤
│ Proyecto: [Nombre]                 │
│ Cliente: [Nombre Cliente]          │
│ Contratista: [Nombre Contratista]  │
│ Dirección: [Dirección]             │
├─────────────────────────────────────┤
│ Etapa: [Nombre Etapa]              │
│ Estado: [Completada/Aprobada]      │
│ Descripción: [Descripción]         │
├─────────────────────────────────────┤
│ EVIDENCIAS FOTOGRÁFICAS            │
│ [Miniatura 1] [Miniatura 2]        │
│ [Miniatura 3] [Miniatura 4]        │
│                                     │
│ Total: X evidencias adjuntas       │
├─────────────────────────────────────┤
│ FIRMAS DE CONFORMIDAD              │
│                                     │
│ ____________________               │
│ Firma Contratista                  │
│                                     │
│ ____________________               │
│ Firma Cliente                      │
│ Fecha: [Fecha actual]              │
└─────────────────────────────────────┘
```

---

## 🔧 Scripts Útiles de Supabase

### Ver todos los usuarios con sus roles
```sql
SELECT 
  email,
  full_name,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC;
```

### Cambiar rol de un usuario
```sql
UPDATE profiles 
SET role = 'contratista'  -- o 'god', 'cliente', 'ayudante'
WHERE email = 'usuario@email.com';
```

### Ver proyectos con estadísticas
```sql
SELECT 
  p.name as proyecto,
  c.full_name as cliente,
  co.full_name as contratista,
  COUNT(DISTINCT s.id) as total_etapas,
  COUNT(DISTINCT e.id) as total_evidencias
FROM projects p
LEFT JOIN profiles c ON p.client_id = c.id
LEFT JOIN profiles co ON p.contractor_id = co.id
LEFT JOIN stages s ON p.id = s.project_id
LEFT JOIN evidences e ON s.id = e.stage_id
GROUP BY p.id, p.name, c.full_name, co.full_name;
```

### Eliminar proyecto y todo su contenido
```sql
-- Esto eliminará automáticamente stages, evidences, team por CASCADE
DELETE FROM projects WHERE id = 'uuid-del-proyecto';
```

---

## 🐛 Troubleshooting

### Error: "relation does not exist"
➡️ No ejecutaste el SQL. Ve a SQL Editor y ejecuta `supabase-schema.sql`

### Error: "Failed to fetch"
➡️ Verifica las variables en `.env.local` y que Supabase esté activo

### No puedo subir imágenes
➡️ Verifica que el bucket `evidences` existe y es público

### Usuario no puede ver proyectos
➡️ Verifica las políticas RLS y que el usuario esté en `project_team`

### "Permission denied" al crear proyecto
➡️ Solo GOD puede crear proyectos. Cambia el rol en la DB.

---

## 🚀 Deploy a Producción

### Opción 1: Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en Vercel:
# Settings → Environment Variables
# Agregar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Opción 2: Netlify
```bash
# Build command: npm run build
# Publish directory: .next
# Agregar variables de entorno en Netlify
```

---

## 📊 Próximas Mejoras Sugeridas

- [ ] Notificaciones push cuando cambia estado de etapa
- [ ] Chat en tiempo real por proyecto
- [ ] Modo offline con sync
- [ ] Exportar reportes Excel
- [ ] Firma digital en PDFs
- [ ] Geolocalización de evidencias
- [ ] Timeline de actividades del proyecto
- [ ] Plantillas de proyectos
- [ ] Integración con WhatsApp
- [ ] App móvil nativa (React Native)

---

## 📞 Soporte

Para dudas o problemas:
1. Revisa esta documentación
2. Verifica los logs de Supabase (Logs → Database)
3. Revisa la consola del navegador (F12)

---

**¡Tu sistema está listo para usar! 🎉**

Recuerda:
- Crear tu usuario GOD primero
- Configurar bien las variables de entorno
- Ejecutar el SQL completo en Supabase
- Crear el bucket `evidences` en Storage
