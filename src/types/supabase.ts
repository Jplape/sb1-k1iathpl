export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ads: {
        Row: {
          id: string
          title: string
          description: string
          price: number
          category_id: string | null
          user_id: string
          images: string[]
          featured: boolean
          urgent: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          price: number
          category_id?: string | null
          user_id: string
          images?: string[]
          featured?: boolean
          urgent?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          price?: number
          category_id?: string | null
          user_id?: string
          images?: string[]
          featured?: boolean
          urgent?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
      }
      collaborators: {
        Row: {
          project_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          project_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          project_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          role: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          created_at: string
          updated_at: string
          status: string
          visibility: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
          status?: string
          visibility?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
          status?: string
          visibility?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          created_at: string
          due_date: string | null
          project_id: string | null
          assigned_to: string | null
          created_by: string
          priority: string
          tags: string[]
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          created_at?: string
          due_date?: string | null
          project_id?: string | null
          assigned_to?: string | null
          created_by: string
          priority?: string
          tags?: string[]
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          created_at?: string
          due_date?: string | null
          project_id?: string | null
          assigned_to?: string | null
          created_by?: string
          priority?: string
          tags?: string[]
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
      [_ in never]: never
    }
  }
}