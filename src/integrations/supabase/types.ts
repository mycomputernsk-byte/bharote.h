export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      constituencies: {
        Row: {
          constituency_number: number
          constituency_type: string
          created_at: string
          district: string | null
          id: string
          name: string
          reserved_category: string | null
          state: string
          total_voters: number | null
        }
        Insert: {
          constituency_number: number
          constituency_type?: string
          created_at?: string
          district?: string | null
          id?: string
          name: string
          reserved_category?: string | null
          state: string
          total_voters?: number | null
        }
        Update: {
          constituency_number?: number
          constituency_type?: string
          created_at?: string
          district?: string | null
          id?: string
          name?: string
          reserved_category?: string | null
          state?: string
          total_voters?: number | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
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
          background_image_url: string
          created_by: string
          creator: string
          date: string
          description: string
          id: string
          target_date: string
          time: string
          title: string
        }
        Insert: {
          address: string
          background_image_url: string
          created_by?: string
          creator: string
          date: string
          description: string
          id?: string
          target_date: string
          time: string
          title: string
        }
        Update: {
          address?: string
          background_image_url?: string
          created_by?: string
          creator?: string
          date?: string
          description?: string
          id?: string
          target_date?: string
          time?: string
          title?: string
        }
        Relationships: []
      }
      political_parties: {
        Row: {
          color: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_nota: boolean
          name: string
          short_name: string
          symbol_url: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_nota?: boolean
          name: string
          short_name: string
          symbol_url?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_nota?: boolean
          name?: string
          short_name?: string
          symbol_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vote_blocks: {
        Row: {
          block_hash: string
          block_number: number
          id: string
          is_verified: boolean
          merkle_root: string
          previous_block_hash: string | null
          timestamp: string
          vote_count: number
        }
        Insert: {
          block_hash: string
          block_number: number
          id?: string
          is_verified?: boolean
          merkle_root: string
          previous_block_hash?: string | null
          timestamp?: string
          vote_count?: number
        }
        Update: {
          block_hash?: string
          block_number?: number
          id?: string
          is_verified?: boolean
          merkle_root?: string
          previous_block_hash?: string | null
          timestamp?: string
          vote_count?: number
        }
        Relationships: []
      }
      voters: {
        Row: {
          address: string
          constituency: string
          constituency_id: string | null
          created_at: string
          date_of_birth: string
          email: string | null
          email_otp_code: string | null
          email_otp_expires_at: string | null
          email_verified: boolean | null
          full_name: string
          has_voted: boolean
          id: string
          otp_code: string | null
          otp_expires_at: string | null
          phone_number: string
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          voted_at: string | null
          voter_id: string
        }
        Insert: {
          address: string
          constituency: string
          constituency_id?: string | null
          created_at?: string
          date_of_birth: string
          email?: string | null
          email_otp_code?: string | null
          email_otp_expires_at?: string | null
          email_verified?: boolean | null
          full_name: string
          has_voted?: boolean
          id?: string
          otp_code?: string | null
          otp_expires_at?: string | null
          phone_number: string
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          voted_at?: string | null
          voter_id: string
        }
        Update: {
          address?: string
          constituency?: string
          constituency_id?: string | null
          created_at?: string
          date_of_birth?: string
          email?: string | null
          email_otp_code?: string | null
          email_otp_expires_at?: string | null
          email_verified?: boolean | null
          full_name?: string
          has_voted?: boolean
          id?: string
          otp_code?: string | null
          otp_expires_at?: string | null
          phone_number?: string
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          voted_at?: string | null
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voters_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          block_number: number
          created_at: string
          id: string
          ip_address: string | null
          nonce: number
          party_id: string
          previous_hash: string | null
          status: Database["public"]["Enums"]["vote_status"]
          timestamp: string
          user_agent: string | null
          vote_hash: string
          voter_id: string
        }
        Insert: {
          block_number: number
          created_at?: string
          id?: string
          ip_address?: string | null
          nonce?: number
          party_id: string
          previous_hash?: string | null
          status?: Database["public"]["Enums"]["vote_status"]
          timestamp?: string
          user_agent?: string | null
          vote_hash: string
          voter_id: string
        }
        Update: {
          block_number?: number
          created_at?: string
          id?: string
          ip_address?: string | null
          nonce?: number
          party_id?: string
          previous_hash?: string | null
          status?: Database["public"]["Enums"]["vote_status"]
          timestamp?: string
          user_agent?: string | null
          vote_hash?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "political_parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "voters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_voter_id: { Args: never; Returns: string }
      get_all_states: {
        Args: never
        Returns: {
          state: string
        }[]
      }
      get_constituencies_by_state: {
        Args: { p_state: string }
        Returns: {
          constituency_number: number
          constituency_type: string
          district: string
          id: string
          name: string
          state: string
        }[]
      }
      get_next_block_number: { Args: never; Returns: number }
      get_vote_counts: {
        Args: never
        Returns: {
          color: string
          is_nota: boolean
          party_id: string
          party_name: string
          short_name: string
          vote_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      verification_status: "unverified" | "otp_sent" | "verified"
      vote_status: "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      verification_status: ["unverified", "otp_sent", "verified"],
      vote_status: ["pending", "verified", "rejected"],
    },
  },
} as const
