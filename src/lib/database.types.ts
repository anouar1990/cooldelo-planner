export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface ProjectRow {
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
}

export interface MaterialRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  thickness: number;
  cost_per_unit: number;
  created_at: string;
  updated_at: string;
}

export interface ClientRow {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string | null;
}

export interface MachineProfileRow {
  id: string;
  user_id: string;
  name: string;
  type: string | null;
  power: number | null;
  speed: number | null;
  notes: string | null;
  created_at: string | null;
}

export interface InvoiceRow {
  id: string;
  user_id: string;
  invoice_number: string;
  client_name: string;
  client_email: string | null;
  client_address: string | null;
  items: Json;
  tax_rate: number | null;
  total: number;
  status: string | null;
  due_date: string | null;
  billed: boolean | null;
  created_at: string | null;
}

export interface BusinessSettingsRow {
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  bank_details: string | null;
  updated_at: string | null;
}

export interface ProjectTimeLogRow {
  id: string;
  project_id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface UserSettingsRow {
  user_id: string;
  subscription_status: string;
  subscription_price_id: string | null;
  stripe_customer_id: string | null;
  hourly_rate: number;
  unbilled_invoices: number | null;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: Partial<ProjectRow> & { user_id: string; title: string };
        Update: Partial<ProjectRow>;
      };
      project_time_logs: {
        Row: ProjectTimeLogRow;
        Insert: Partial<ProjectTimeLogRow> & { project_id: string; start_time: string };
        Update: Partial<ProjectTimeLogRow>;
      };
      materials: {
        Row: MaterialRow;
        Insert: Partial<MaterialRow> & { user_id: string; name: string };
        Update: Partial<MaterialRow>;
      };
      clients: {
        Row: ClientRow;
        Insert: Partial<ClientRow> & { user_id: string; name: string };
        Update: Partial<ClientRow>;
      };
      machine_profiles: {
        Row: MachineProfileRow;
        Insert: Partial<MachineProfileRow> & { user_id: string; name: string };
        Update: Partial<MachineProfileRow>;
      };
      invoices: {
        Row: InvoiceRow;
        Insert: Partial<InvoiceRow> & { user_id: string; invoice_number: string; client_name: string; total: number };
        Update: Partial<InvoiceRow>;
      };
      business_settings: {
        Row: BusinessSettingsRow;
        Insert: Partial<BusinessSettingsRow> & { user_id: string; name: string };
        Update: Partial<BusinessSettingsRow>;
      };
      user_settings: {
        Row: UserSettingsRow;
        Insert: Partial<UserSettingsRow> & { user_id: string };
        Update: Partial<UserSettingsRow>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
