export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      chat: {
        Row: {
          created_at: string | null
          function: string | null
          id: number
          text: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          function?: string | null
          id?: number
          text?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          function?: string | null
          id?: number
          text?: string | null
          type?: string | null
          user_id?: string | null
        }
      }
      explore_function_tasks: {
        Row: {
          created_at: string | null
          function_id: number
          id: number
          task: number | null
          task_description: string
        }
        Insert: {
          created_at?: string | null
          function_id: number
          id?: number
          task?: number | null
          task_description?: string
        }
        Update: {
          created_at?: string | null
          function_id?: number
          id?: number
          task?: number | null
          task_description?: string
        }
      }
      explore_functions: {
        Row: {
          created_at: string | null
          function: string | null
          id: number
          system_prompt: string | null
        }
        Insert: {
          created_at?: string | null
          function?: string | null
          id?: number
          system_prompt?: string | null
        }
        Update: {
          created_at?: string | null
          function?: string | null
          id?: number
          system_prompt?: string | null
        }
      }
      user_explore_function_tasks: {
        Row: {
          closed: boolean | null
          completed: boolean | null
          created_at: string | null
          function_id: number | null
          id: number
          result: string | null
          session_id: string | null
          task: number
          user_id: string | null
        }
        Insert: {
          closed?: boolean | null
          completed?: boolean | null
          created_at?: string | null
          function_id?: number | null
          id?: number
          result?: string | null
          session_id?: string | null
          task: number
          user_id?: string | null
        }
        Update: {
          closed?: boolean | null
          completed?: boolean | null
          created_at?: string | null
          function_id?: number | null
          id?: number
          result?: string | null
          session_id?: string | null
          task?: number
          user_id?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
