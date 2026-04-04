export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'god' | 'cliente' | 'contratista' | 'ayudante'
export type StageStatus = 'pending' | 'progress' | 'completed' | 'approved' | 'rejected'
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'cancelled'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: UserRole
          company_name: string | null
          phone: string | null
          avatar_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: UserRole
          company_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: UserRole
          company_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          address: string | null
          status: ProjectStatus
          client_id: string
          contractor_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          address?: string | null
          status?: ProjectStatus
          client_id: string
          contractor_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          address?: string | null
          status?: ProjectStatus
          client_id?: string
          contractor_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      project_team: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: UserRole
          added_by: string
          added_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: UserRole
          added_by: string
          added_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: UserRole
          added_by?: string
          added_at?: string
        }
      }
      stages: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          status: StageStatus
          order_index: number
          approved_by: string | null
          approved_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          status?: StageStatus
          order_index?: number
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string | null
          status?: StageStatus
          order_index?: number
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      evidences: {
        Row: {
          id: string
          stage_id: string
          image_url: string
          image_path: string
          caption: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          stage_id: string
          image_url: string
          image_path: string
          caption?: string | null
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          stage_id?: string
          image_url?: string
          image_path?: string
          caption?: string | null
          uploaded_by?: string
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          project_id: string | null
          action: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          project_id?: string | null
          action: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          project_id?: string | null
          action?: string
          details?: Json | null
          created_at?: string
        }
      }
    }
  }
}

// Tipos extendidos para uso en la app
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row'] & {
  client?: Profile
  contractor?: Profile
  stages?: Stage[]
  team?: ProjectTeam[]
}
export type ProjectTeam = Database['public']['Tables']['project_team']['Row'] & {
  user?: Profile
}
export type Stage = Database['public']['Tables']['stages']['Row'] & {
  evidences?: Evidence[]
}
export type Evidence = Database['public']['Tables']['evidences']['Row'] & {
  uploader?: Profile
}
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
