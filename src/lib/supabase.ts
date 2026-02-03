import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["clients"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
      };
      email_accounts: {
        Row: {
          id: string;
          email: string;
          password: string;
          provider: string;
          status: string;
          tags: string[] | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["email_accounts"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["email_accounts"]["Insert"]>;
      };
      projects: {
        Row: {
          id: string;
          client_id: string | null;
          project_name: string;
          domain_name: string | null;
          domain_provider: string | null;
          domain_email_id: string | null;
          domain_username: string | null;
          deployment_email_id: string | null;
          deployment_username: string | null;
          hosting_platform: string | null;
          domain_purchase_date: string | null;
          domain_renewal_date: string | null;
          hosting_start_date: string | null;
          hosting_renewal_date: string | null;
          status: string;
          project_amount: number | null;
          payment_status: string | null;
          pending_amount: number | null;
          completed_date: string | null;
          attention_state: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          client_id: string | null;
          project_id: string | null;
          invoice_date: string;
          due_date: string | null;
          subtotal: number;
          tax_rate: number | null;
          tax_amount: number | null;
          discount_amount: number | null;
          grand_total: number;
          paid_amount: number | null;
          balance_due: number | null;
          payment_status: string;
          notes: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["invoices"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          rate: number;
          total: number;
        };
        Insert: Omit<Database["public"]["Tables"]["invoice_items"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["invoice_items"]["Insert"]>;
      };
      ai_subscriptions: {
        Row: {
          id: string;
          project_id: string | null;
          tool_name: string;
          platform: string | null;
          platform_other: string | null;
          subscription_type: string;
          email_id: string | null;
          password: string | null;
          start_date: string | null;
          end_date: string | null;
          cancel_by_date: string | null;
          cost: number | null;
          manual_status: string | null;
          attention_state: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["ai_subscriptions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["ai_subscriptions"]["Insert"]>;
      };
      action_items: {
        Row: {
          id: string;
          text: string;
          due_date: string | null;
          completed: boolean;
          context_type: string;
          context_id: string;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["action_items"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["action_items"]["Insert"]>;
      };
      project_logs: {
        Row: {
          id: string;
          project_id: string;
          text: string;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["project_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["project_logs"]["Insert"]>;
      };
      business_branding: {
        Row: {
          id: string;
          business_name: string;
          tagline: string | null;
          logo_url: string | null;
          upi_qr_url: string | null;
          upi_id: string | null;
          mobile: string | null;
          address: string | null;
          email: string | null;
          default_hourly_rate: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["business_branding"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["business_branding"]["Insert"]>;
      };
      effort_logs: {
        Row: {
          id: string;
          project_id: string;
          date: string;
          hours: number;
          notes: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["effort_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["effort_logs"]["Insert"]>;
      };
    };
  };
};
