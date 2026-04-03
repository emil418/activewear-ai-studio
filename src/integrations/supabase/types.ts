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
      admin_allowlist: {
        Row: {
          added_by: string | null
          created_at: string
          email: string
          id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          brand_id: string
          created_at: string
          file_url: string | null
          fit_score: number | null
          id: string
          metadata: Json | null
          motion_settings: Json | null
          name: string
          parent_asset_id: string | null
          physics_settings: Json | null
          project_id: string
          status: string
          thumbnail_url: string | null
          type: string
          updated_at: string
          version: number
        }
        Insert: {
          brand_id: string
          created_at?: string
          file_url?: string | null
          fit_score?: number | null
          id?: string
          metadata?: Json | null
          motion_settings?: Json | null
          name: string
          parent_asset_id?: string | null
          physics_settings?: Json | null
          project_id: string
          status?: string
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          version?: number
        }
        Update: {
          brand_id?: string
          created_at?: string
          file_url?: string | null
          fit_score?: number | null
          id?: string
          metadata?: Json | null
          motion_settings?: Json | null
          name?: string
          parent_asset_id?: string | null
          physics_settings?: Json | null
          project_id?: string
          status?: string
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "assets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_parent_asset_id_fkey"
            columns: ["parent_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_profiles: {
        Row: {
          body_fat_pct: number
          body_type: string
          brand_id: string
          brand_vibe: string
          created_at: string
          face_structure: string
          gender: string
          hair_color: string
          hair_style: string
          height_cm: number
          id: string
          identity_seed: string | null
          muscle_density: number
          name: string
          reference_portrait_url: string | null
          skin_tone: string
          updated_at: string
          weight_kg: number
        }
        Insert: {
          body_fat_pct?: number
          body_type?: string
          brand_id: string
          brand_vibe?: string
          created_at?: string
          face_structure?: string
          gender?: string
          hair_color?: string
          hair_style?: string
          height_cm?: number
          id?: string
          identity_seed?: string | null
          muscle_density?: number
          name: string
          reference_portrait_url?: string | null
          skin_tone?: string
          updated_at?: string
          weight_kg?: number
        }
        Update: {
          body_fat_pct?: number
          body_type?: string
          brand_id?: string
          brand_vibe?: string
          created_at?: string
          face_structure?: string
          gender?: string
          hair_color?: string
          hair_style?: string
          height_cm?: number
          id?: string
          identity_seed?: string | null
          muscle_density?: number
          name?: string
          reference_portrait_url?: string | null
          skin_tone?: string
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "athlete_profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_kits: {
        Row: {
          accent_color: string | null
          brand_id: string
          colors: Json | null
          created_at: string
          font_primary: string | null
          font_secondary: string | null
          fonts: Json | null
          guidelines: string | null
          id: string
          logo_primary_url: string | null
          logo_secondary_url: string | null
          logo_variants: Json | null
          overlay_style: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
          vibe: string | null
          watermark_opacity: number | null
        }
        Insert: {
          accent_color?: string | null
          brand_id: string
          colors?: Json | null
          created_at?: string
          font_primary?: string | null
          font_secondary?: string | null
          fonts?: Json | null
          guidelines?: string | null
          id?: string
          logo_primary_url?: string | null
          logo_secondary_url?: string | null
          logo_variants?: Json | null
          overlay_style?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
          vibe?: string | null
          watermark_opacity?: number | null
        }
        Update: {
          accent_color?: string | null
          brand_id?: string
          colors?: Json | null
          created_at?: string
          font_primary?: string | null
          font_secondary?: string | null
          fonts?: Json | null
          guidelines?: string | null
          id?: string
          logo_primary_url?: string | null
          logo_secondary_url?: string | null
          logo_variants?: Json | null
          overlay_style?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
          vibe?: string | null
          watermark_opacity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_kits_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          mood_preset: string | null
          name: string
          owner_id: string
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          mood_preset?: string | null
          name: string
          owner_id: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          mood_preset?: string | null
          name?: string
          owner_id?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      generation_job_items: {
        Row: {
          angle: string
          attempt_count: number
          completed_at: string | null
          created_at: string
          id: string
          image_url: string | null
          inline_image: string | null
          job_id: string
          last_error: string | null
          max_attempts: number
          size: string
          started_at: string | null
          status: string
          updated_at: string
          validation_passed: boolean | null
        }
        Insert: {
          angle: string
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          inline_image?: string | null
          job_id: string
          last_error?: string | null
          max_attempts?: number
          size: string
          started_at?: string | null
          status?: string
          updated_at?: string
          validation_passed?: boolean | null
        }
        Update: {
          angle?: string
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          inline_image?: string | null
          job_id?: string
          last_error?: string | null
          max_attempts?: number
          size?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          validation_passed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "generation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          batch_type: string
          completed_at: string | null
          created_at: string
          current_angle: string | null
          current_size: string | null
          id: string
          last_error: string | null
          master_scene: Json | null
          max_restarts: number
          processing_token: string | null
          request_payload: Json
          requested_angles: Json
          requested_sizes: Json
          restart_count: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          batch_type?: string
          completed_at?: string | null
          created_at?: string
          current_angle?: string | null
          current_size?: string | null
          id?: string
          last_error?: string | null
          master_scene?: Json | null
          max_restarts?: number
          processing_token?: string | null
          request_payload: Json
          requested_angles?: Json
          requested_sizes?: Json
          restart_count?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          batch_type?: string
          completed_at?: string | null
          created_at?: string
          current_angle?: string | null
          current_size?: string | null
          id?: string
          last_error?: string | null
          master_scene?: Json | null
          max_restarts?: number
          processing_token?: string | null
          request_payload?: Json
          requested_angles?: Json
          requested_sizes?: Json
          restart_count?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          brand_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          settings: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          settings?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          settings?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          brand_id: string
          created_at: string
          credits_total: number
          credits_used: number
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          credits_total?: number
          credits_used?: number
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          credits_total?: number
          credits_used?: number
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepted_at: string | null
          brand_id: string
          created_at: string
          id: string
          invited_email: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          brand_id: string
          created_at?: string
          id?: string
          invited_email?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          brand_id?: string
          created_at?: string
          id?: string
          invited_email?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          athlete_id: string | null
          brand_id: string
          brand_kit_id: string | null
          camera_presets: Json | null
          created_at: string
          id: string
          influencer_locked: boolean | null
          intensity: number | null
          movement_set: Json | null
          output_type: string | null
          phase_set: Json | null
          template_name: string
          updated_at: string
        }
        Insert: {
          athlete_id?: string | null
          brand_id: string
          brand_kit_id?: string | null
          camera_presets?: Json | null
          created_at?: string
          id?: string
          influencer_locked?: boolean | null
          intensity?: number | null
          movement_set?: Json | null
          output_type?: string | null
          phase_set?: Json | null
          template_name: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string | null
          brand_id?: string
          brand_kit_id?: string | null
          camera_presets?: Json | null
          created_at?: string
          id?: string
          influencer_locked?: boolean | null
          intensity?: number | null
          movement_set?: Json | null
          output_type?: string | null
          phase_set?: Json | null
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "brand_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_logs: {
        Row: {
          action: string
          brand_id: string
          created_at: string
          credits_used: number
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          brand_id: string
          created_at?: string
          credits_used?: number
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          brand_id?: string
          created_at?: string
          credits_used?: number
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_email: { Args: { check_email: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
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
      app_role: ["admin", "editor", "viewer"],
    },
  },
} as const
