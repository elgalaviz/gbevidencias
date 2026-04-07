export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'god' | 'cliente' | 'contratista' | 'ayudante'
export type ProjectStatus = 'active' | 'completed' | 'pending' | 'paused' | 'cancelled'
export type StageStatus = 'pending' | 'progress' | 'completed' | 'approved' | 'rejected'

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
          logo_url: string | null
          company_address: string | null
          company_phone: string | null
          company_website: string | null
          company_rfc: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role?: UserRole
          company_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          logo_url?: string | null
          company_address?: string | null
          company_phone?: string | null
          company_website?: string | null
          company_rfc?: string | null
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
          logo_url?: string | null
          company_address?: string | null
          company_phone?: string | null
          company_website?: string | null
          company_rfc?: string | null
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
          contractor_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
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
          order_index: number
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
      project_team: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          entity_type?: string
          entity_id?: string
          created_at?: string
        }
      }
      stage_links: {
        Row: {
          id: string
          stage_id: string
          link_title: string
          link_url: string
          link_type: string | null
          description: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          stage_id: string
          link_title: string
          link_url: string
          link_type?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          stage_id?: string
          link_title?: string
          link_url?: string
          link_type?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      project_status: ProjectStatus
      stage_status: StageStatus
    }
  }
}