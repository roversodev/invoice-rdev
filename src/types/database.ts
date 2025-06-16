export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          description: string
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          country: string | null
          cnpj: string | null
          logo_url: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          cnpj?: string | null
          logo_url?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          cnpj?: string | null
          logo_url?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          current_company_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          current_company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          current_company_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          company_id: string
          name: string
          email: string | null
          phone: string | null
          whatsapp: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          country: string | null
          cpf_cnpj: string | null
          notes: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          email?: string | null
          phone?: string | null
          whatsapp?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          cpf_cnpj?: string | null
          notes?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          whatsapp?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          cpf_cnpj?: string | null
          notes?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          company_id: string
          client_id: string
          created_by: string
          template_id: string | null  // ✅ Adicionar este campo
          invoice_number: string
          title: string
          description: string | null
          status: string | null
          issue_date: string | null
          due_date: string | null
          subtotal: number | null
          discount_percentage: number | null
          discount_amount: number | null
          tax_percentage: number | null
          tax_amount: number | null
          total_amount: number | null
          currency: string | null
          notes: string | null
          terms_conditions: string | null
          pdf_url: string | null
          sent_at: string | null
          accepted_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          client_id: string
          created_by: string
          template_id?: string | null  // ✅ Adicionar este campo
          invoice_number: string
          title: string
          description?: string | null
          status?: string | null
          issue_date?: string | null
          due_date?: string | null
          subtotal?: number | null
          discount_percentage?: number | null
          discount_amount?: number | null
          tax_percentage?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          currency?: string | null
          notes?: string | null
          terms_conditions?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          accepted_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          client_id?: string
          created_by?: string
          template_id?: string | null  // ✅ Adicionar este campo
          invoice_number?: string
          title?: string
          description?: string | null
          status?: string | null
          issue_date?: string | null
          due_date?: string | null
          subtotal?: number | null
          discount_percentage?: number | null
          discount_amount?: number | null
          tax_percentage?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          currency?: string | null
          notes?: string | null
          terms_conditions?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          accepted_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          service_id: string | null
          description: string
          quantity: number
          unit_price: number
          total_price: number  // ✅ Correct column name
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          invoice_id: string
          service_id?: string | null
          description: string
          quantity: number
          unit_price: number
          total_price: number
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          service_id?: string | null
          description?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          sort_order?: number | null
          created_at?: string | null
        }
      }
      invoice_templates: {
        Row: {
          id: string
          company_id: string
          name: string
          is_default: boolean | null
          header_config: any | null
          footer_config: any | null
          colors: any | null
          fonts: any | null
          layout_config: any | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          is_default?: boolean | null
          header_config?: any | null
          footer_config?: any | null
          colors?: any | null
          fonts?: any | null
          layout_config?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          is_default?: boolean | null
          header_config?: any | null
          footer_config?: any | null
          colors?: any | null
          fonts?: any | null
          layout_config?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      service_categories: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          color: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          color?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          color?: string | null
          created_at?: string | null
        }
      }
      services: {
        Row: {
          id: string
          company_id: string
          category_id: string | null
          name: string
          description: string | null
          unit_price: number
          unit: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          category_id?: string | null
          name: string
          description?: string | null
          unit_price?: number
          unit?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          unit_price?: number
          unit?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_companies: {
        Row: {
          id: string
          user_id: string
          company_id: string
          role: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          role?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          role?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}