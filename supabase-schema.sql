-- ============================================
-- PROMANAGER - SCHEMA COMPLETO DE SUPABASE
-- Sistema de gestión con roles: GOD, CLIENTE, CONTRATISTA, AYUDANTE
-- ============================================

-- Tipos ENUM para roles y estados
CREATE TYPE user_role AS ENUM ('god', 'cliente', 'contratista', 'ayudante');
CREATE TYPE stage_status AS ENUM ('pending', 'progress', 'completed', 'approved', 'rejected');
CREATE TYPE project_status AS ENUM ('active', 'paused', 'completed', 'cancelled');

-- ============================================
-- TABLA: profiles (Extensión de auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'ayudante',
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_created_by ON profiles(created_by);

-- ============================================
-- TABLA: projects (Proyectos)
-- ============================================
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  status project_status DEFAULT 'active',
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para projects
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_contractor ON projects(contractor_id);
CREATE INDEX idx_projects_status ON projects(status);

-- ============================================
-- TABLA: project_team (Equipo del proyecto)
-- ============================================
CREATE TABLE project_team (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  added_by UUID REFERENCES profiles(id) NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Índices para project_team
CREATE INDEX idx_project_team_project ON project_team(project_id);
CREATE INDEX idx_project_team_user ON project_team(user_id);

-- ============================================
-- TABLA: stages (Etapas del proyecto)
-- ============================================
CREATE TABLE stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status stage_status DEFAULT 'pending',
  order_index INTEGER NOT NULL DEFAULT 0,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para stages
CREATE INDEX idx_stages_project ON stages(project_id);
CREATE INDEX idx_stages_status ON stages(status);

-- ============================================
-- TABLA: evidences (Evidencias fotográficas)
-- ============================================
CREATE TABLE evidences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID REFERENCES stages(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para evidences
CREATE INDEX idx_evidences_stage ON evidences(stage_id);
CREATE INDEX idx_evidences_uploaded_by ON evidences(uploaded_by);

-- ============================================
-- TABLA: activity_logs (Registro de actividades)
-- ============================================
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para activity_logs
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_project ON activity_logs(project_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- ============================================
-- FUNCIONES TRIGGER
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stages_updated_at BEFORE UPDATE ON stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'ayudante')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil al registrarse
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS: profiles
-- ============================================

-- GOD ve todos los perfiles
CREATE POLICY "GOD can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'god'
    )
  );

-- Usuarios ven su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- GOD puede actualizar todos los perfiles
CREATE POLICY "GOD can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'god'
    )
  );

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- GOD puede crear perfiles
CREATE POLICY "GOD can create profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'god'
    )
  );

-- ============================================
-- POLÍTICAS RLS: projects
-- ============================================

-- GOD ve todos los proyectos
CREATE POLICY "GOD can view all projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'god'
    )
  );

-- Cliente ve sus proyectos
CREATE POLICY "Clients can view their projects"
  ON projects FOR SELECT
  USING (client_id = auth.uid());

-- Contratista y ayudantes ven proyectos donde están asignados
CREATE POLICY "Team members can view assigned projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_team
      WHERE project_team.project_id = projects.id
      AND project_team.user_id = auth.uid()
    )
  );

-- GOD puede crear/editar/eliminar proyectos
CREATE POLICY "GOD can manage all projects"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'god'
    )
  );

-- Contratistas pueden actualizar sus proyectos asignados
CREATE POLICY "Contractors can update assigned projects"
  ON projects FOR UPDATE
  USING (contractor_id = auth.uid());

-- ============================================
-- POLÍTICAS RLS: project_team
-- ============================================

-- Ver miembros del equipo si eres parte del proyecto o GOD
CREATE POLICY "View project team members"
  ON project_team FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM project_team WHERE project_id = project_team.project_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'god'
    )
  );

-- GOD y contratistas pueden agregar miembros al equipo
CREATE POLICY "GOD and contractors can add team members"
  ON project_team FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('god', 'contratista')
    )
  );

-- ============================================
-- POLÍTICAS RLS: stages
-- ============================================

-- Ver etapas si eres parte del proyecto o GOD
CREATE POLICY "View stages of accessible projects"
  ON stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = stages.project_id
      AND (
        projects.client_id = auth.uid()
        OR projects.contractor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_team
          WHERE project_team.project_id = projects.id
          AND project_team.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'god'
        )
      )
    )
  );

-- GOD y contratistas pueden crear/editar etapas
CREATE POLICY "GOD and contractors can manage stages"
  ON stages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('god', 'contratista')
    )
  );

-- Clientes pueden aprobar/rechazar etapas
CREATE POLICY "Clients can approve stages"
  ON stages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = stages.project_id
      AND projects.client_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS RLS: evidences
-- ============================================

-- Ver evidencias si tienes acceso al proyecto
CREATE POLICY "View evidences of accessible projects"
  ON evidences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = evidences.stage_id
      AND (
        projects.client_id = auth.uid()
        OR projects.contractor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_team
          WHERE project_team.project_id = projects.id
          AND project_team.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'god'
        )
      )
    )
  );

-- Todos los miembros del equipo pueden subir evidencias
CREATE POLICY "Team members can upload evidences"
  ON evidences FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = evidences.stage_id
      AND (
        projects.contractor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_team
          WHERE project_team.project_id = projects.id
          AND project_team.user_id = auth.uid()
        )
      )
    )
  );

-- GOD y quien subió la evidencia pueden eliminarla
CREATE POLICY "GOD and uploader can delete evidences"
  ON evidences FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'god'
    )
  );

-- ============================================
-- POLÍTICAS RLS: activity_logs
-- ============================================

-- GOD ve todos los logs
CREATE POLICY "GOD can view all logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'god'
    )
  );

-- Usuarios ven logs de sus proyectos
CREATE POLICY "Users can view project logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = activity_logs.project_id
      AND (
        projects.client_id = auth.uid()
        OR projects.contractor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_team
          WHERE project_team.project_id = projects.id
          AND project_team.user_id = auth.uid()
        )
      )
    )
  );

-- Todos pueden crear logs
CREATE POLICY "All can create logs"
  ON activity_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- STORAGE BUCKET PARA EVIDENCIAS
-- ============================================

-- Crear bucket para evidencias (ejecutar en Supabase Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('evidences', 'evidences', true);

-- Política de storage: subir si eres miembro del equipo
-- CREATE POLICY "Team members can upload evidences"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'evidences' AND
--   auth.role() = 'authenticated'
-- );

-- Política de storage: ver evidencias públicas
-- CREATE POLICY "Public can view evidences"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'evidences');

-- ============================================
-- DATOS INICIALES (OPCIONAL)
-- ============================================

-- Crear usuario GOD inicial (cambia el email y UUID según tu usuario)
-- UPDATE profiles SET role = 'god' WHERE email = 'admin@tudominio.com';

-- ============================================
-- VISTAS ÚTILES (OPCIONAL)
-- ============================================

CREATE OR REPLACE VIEW project_overview AS
SELECT 
  p.id,
  p.name,
  p.status,
  c.full_name as client_name,
  co.full_name as contractor_name,
  COUNT(DISTINCT s.id) as total_stages,
  COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_stages,
  COUNT(DISTINCT e.id) as total_evidences
FROM projects p
LEFT JOIN profiles c ON p.client_id = c.id
LEFT JOIN profiles co ON p.contractor_id = co.id
LEFT JOIN stages s ON p.id = s.project_id
LEFT JOIN evidences e ON s.id = e.stage_id
GROUP BY p.id, p.name, p.status, c.full_name, co.full_name;
