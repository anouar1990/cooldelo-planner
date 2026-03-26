// Supabase auto-generated types.
// Re-generate by running: npx supabase gen types typescript --project-id kfydsuuelaxaffntdjxh > src/lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: 'planned' | 'in-progress' | 'completed';
          image_uri: string | null;
          photo_url: string | null;
          machine: string | null;
          material_id: string | null;
          material_thickness: number | null;
          material_cost_per_unit: number | null;
          material_quantity: number | null;
          time_elapsed: number | null;
          client_id: string | null;
          due_date: string | null;
          is_template: boolean | null;
          template_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: 'planned' | 'in-progress' | 'completed';
          image_uri?: string | null;
          photo_url?: string | null;
          machine?: string | null;
          material_id?: string | null;
          material_thickness?: number | null;
          material_cost_per_unit?: number | null;
          material_quantity?: number | null;
          time_elapsed?: number | null;
          client_id?: string | null;
          due_date?: string | null;
          is_template?: boolean | null;
          template_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: 'planned' | 'in-progress' | 'completed';
          image_uri?: string | null;
          photo_url?: string | null;
          machine?: string | null;
          material_id?: string | null;
          material_thickness?: number | null;
          material_cost_per_unit?: number | null;
          material_quantity?: number | null;
          time_elapsed?: number | null;
          client_id?: string | null;
          due_date?: string | null;
          is_template?: boolean | null;
          template_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_time_logs: {
        Row: {
          id: string;
          project_id: string;
          start_time: string;
          end_time: string;
          duration_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          start_time: string;
          end_time: string;
          duration_seconds: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          start_time?: string;
          end_time?: string;
          duration_seconds?: number;
          created_at?: string;
        };
      };
      materials: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          thickness: number;
          cost_per_unit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: string;
          thickness: number;
          cost_per_unit: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          thickness?: number;
          cost_per_unit?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          hourly_rate: number;
          subscription_status: string | null;
          stripe_customer_id: string | null;
          subscription_price_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hourly_rate?: number;
          subscription_status?: string | null;
          stripe_customer_id?: string | null;
          subscription_price_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          hourly_rate?: number;
          subscription_status?: string | null;
          stripe_customer_id?: string | null;
          subscription_price_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      machine_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'laser' | 'cnc' | 'vinyl' | 'other';
          speed: number | null;
          power: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'laser' | 'cnc' | 'vinyl' | 'other';
          speed?: number | null;
          power?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'laser' | 'cnc' | 'vinyl' | 'other';
          speed?: number | null;
          power?: number | null;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
