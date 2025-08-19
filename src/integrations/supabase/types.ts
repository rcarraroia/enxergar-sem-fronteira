export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      asaas_transactions: {
        Row: {
          amount: number
          created_at: string
          event_id: string
          id: string
          payment_status: string
          split_data: Json
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          event_id: string
          id?: string
          payment_status?: string
          split_data: Json
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          event_id?: string
          id?: string
          payment_status?: string
          split_data?: Json
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asaas_transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          allow_custom_amount: boolean
          allow_subscriptions: boolean
          created_at: string
          created_by: string | null
          current_amount: number
          description: string | null
          end_date: string | null
          event_id: string | null
          goal_amount: number
          id: string
          image_url: string | null
          raised_amount: number
          slug: string
          start_date: string | null
          status: string
          suggested_amounts: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          allow_custom_amount?: boolean
          allow_subscriptions?: boolean
          created_at?: string
          created_by?: string | null
          current_amount?: number
          description?: string | null
          end_date?: string | null
          event_id?: string | null
          goal_amount: number
          id?: string
          image_url?: string | null
          raised_amount?: number
          slug: string
          start_date?: string | null
          status?: string
          suggested_amounts?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          allow_custom_amount?: boolean
          allow_subscriptions?: boolean
          created_at?: string
          created_by?: string | null
          current_amount?: number
          description?: string | null
          end_date?: string | null
          event_id?: string | null
          goal_amount?: number
          id?: string
          image_url?: string | null
          raised_amount?: number
          slug?: string
          start_date?: string | null
          status?: string
          suggested_amounts?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_subscriptions: {
        Row: {
          amount: number
          campaign_id: string
          created_at: string
          donor_email: string
          donor_name: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          campaign_id: string
          created_at?: string
          donor_email: string
          donor_name: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          campaign_id?: string
          created_at?: string
          donor_email?: string
          donor_name?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_subscriptions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          campaign_id: string
          created_at: string
          donation_type: string
          donor_email: string
          donor_name: string
          donor_phone: string | null
          id: string
          payment_status: string
          updated_at: string
        }
        Insert: {
          amount: number
          campaign_id: string
          created_at?: string
          donation_type?: string
          donor_email: string
          donor_name: string
          donor_phone?: string | null
          id?: string
          payment_status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          campaign_id?: string
          created_at?: string
          donation_type?: string
          donor_email?: string
          donor_name?: string
          donor_phone?: string | null
          id?: string
          payment_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      event_dates: {
        Row: {
          available_slots: number
          created_at: string
          date: string
          end_time: string
          event_id: string
          id: string
          start_time: string
          total_slots: number
          updated_at: string
        }
        Insert: {
          available_slots?: number
          created_at?: string
          date: string
          end_time: string
          event_id: string
          id?: string
          start_time: string
          total_slots?: number
          updated_at?: string
        }
        Update: {
          available_slots?: number
          created_at?: string
          date?: string
          end_time?: string
          event_id?: string
          id?: string
          start_time?: string
          total_slots?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_dates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string
          city: string
          created_at: string
          description: string | null
          id: string
          location: string
          organizer_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          address: string
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          location: string
          organizer_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string
          organizer_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      instituto_integration_queue: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          payload: Json
          processed_at: string | null
          retry_count: number
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          payload: Json
          processed_at?: string | null
          retry_count?: number
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          retry_count?: number
          status?: string
        }
        Relationships: []
      }
      organizers: {
        Row: {
          address: string | null
          asaas_api_key: string | null
          created_at: string
          email: string
          id: string
          invitation_expires_at: string | null
          invitation_token: string | null
          invited_by: string | null
          last_login: string | null
          name: string
          notification_preferences: Json | null
          organization: string | null
          phone: string | null
          profile_image_url: string | null
          status: string | null
          updated_at: string
          whatsapp_api_key: string | null
        }
        Insert: {
          address?: string | null
          asaas_api_key?: string | null
          created_at?: string
          email: string
          id?: string
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_by?: string | null
          last_login?: string | null
          name: string
          notification_preferences?: Json | null
          organization?: string | null
          phone?: string | null
          profile_image_url?: string | null
          status?: string | null
          updated_at?: string
          whatsapp_api_key?: string | null
        }
        Update: {
          address?: string | null
          asaas_api_key?: string | null
          created_at?: string
          email?: string
          id?: string
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_by?: string | null
          last_login?: string | null
          name?: string
          notification_preferences?: Json | null
          organization?: string | null
          phone?: string | null
          profile_image_url?: string | null
          status?: string | null
          updated_at?: string
          whatsapp_api_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizers_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_access_tokens: {
        Row: {
          created_at: string
          event_date_id: string
          expires_at: string | null
          id: string
          patient_id: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_date_id: string
          expires_at?: string | null
          id?: string
          patient_id: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_date_id?: string
          expires_at?: string | null
          id?: string
          patient_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_access_tokens_event_date_id_fkey"
            columns: ["event_date_id"]
            isOneToOne: false
            referencedRelation: "event_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_access_tokens_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          consentimento_lgpd: boolean
          cpf: string
          created_at: string
          data_nascimento: string | null
          diagnostico: string | null
          email: string
          id: string
          nome: string
          tags: Json | null
          telefone: string
          updated_at: string
        }
        Insert: {
          consentimento_lgpd?: boolean
          cpf: string
          created_at?: string
          data_nascimento?: string | null
          diagnostico?: string | null
          email: string
          id?: string
          nome: string
          tags?: Json | null
          telefone: string
          updated_at?: string
        }
        Update: {
          consentimento_lgpd?: boolean
          cpf?: string
          created_at?: string
          data_nascimento?: string | null
          diagnostico?: string | null
          email?: string
          id?: string
          nome?: string
          tags?: Json | null
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          created_at: string
          event_date_id: string
          id: string
          patient_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_date_id: string
          id?: string
          patient_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_date_id?: string
          id?: string
          patient_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_date_id_fkey"
            columns: ["event_date_id"]
            isOneToOne: false
            referencedRelation: "event_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_access_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}