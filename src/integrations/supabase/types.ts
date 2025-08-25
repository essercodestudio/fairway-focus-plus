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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_type: string | null
          description: string | null
          earned_at: string
          id: string
          player_id: string
          title: string
          tournament_id: string | null
        }
        Insert: {
          achievement_type?: string | null
          description?: string | null
          earned_at?: string
          id?: string
          player_id: string
          title: string
          tournament_id?: string | null
        }
        Update: {
          achievement_type?: string | null
          description?: string | null
          earned_at?: string
          id?: string
          player_id?: string
          title?: string
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "achievements_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          id: string
          location: string | null
          name: string
          par: number | null
          total_holes: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          name: string
          par?: number | null
          total_holes?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          par?: number | null
          total_holes?: number | null
        }
        Relationships: []
      }
      group_players: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_captain: boolean | null
          player_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_captain?: boolean | null
          player_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_captain?: boolean | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_players_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tournament_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      holes: {
        Row: {
          course_id: string
          distance_meters: number | null
          handicap_index: number
          hole_number: number
          id: string
          par: number
        }
        Insert: {
          course_id: string
          distance_meters?: number | null
          handicap_index: number
          hole_number: number
          id?: string
          par: number
        }
        Update: {
          course_id?: string
          distance_meters?: number | null
          handicap_index?: number
          hole_number?: number
          id?: string
          par?: number
        }
        Relationships: [
          {
            foreignKeyName: "holes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cpf: string
          created_at: string
          full_name: string
          handicap: number | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cpf: string
          created_at?: string
          full_name: string
          handicap?: number | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cpf?: string
          created_at?: string
          full_name?: string
          handicap?: number | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scores: {
        Row: {
          confirmed: boolean | null
          created_at: string
          hole_id: string
          id: string
          net_strokes: number | null
          player_id: string
          recorded_by: string
          strokes: number
          tournament_id: string
        }
        Insert: {
          confirmed?: boolean | null
          created_at?: string
          hole_id: string
          id?: string
          net_strokes?: number | null
          player_id: string
          recorded_by: string
          strokes: number
          tournament_id: string
        }
        Update: {
          confirmed?: boolean | null
          created_at?: string
          hole_id?: string
          id?: string
          net_strokes?: number | null
          player_id?: string
          recorded_by?: string
          strokes?: number
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_hole_id_fkey"
            columns: ["hole_id"]
            isOneToOne: false
            referencedRelation: "holes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_groups: {
        Row: {
          access_code: string
          captain_id: string | null
          created_at: string
          group_name: string
          id: string
          starting_hole: number | null
          tournament_id: string
        }
        Insert: {
          access_code: string
          captain_id?: string | null
          created_at?: string
          group_name: string
          id?: string
          starting_hole?: number | null
          tournament_id: string
        }
        Update: {
          access_code?: string
          captain_id?: string | null
          created_at?: string
          group_name?: string
          id?: string
          starting_hole?: number | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_groups_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          course_id: string
          created_at: string
          created_by: string
          id: string
          name: string
          status: string | null
          tournament_date: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          status?: string | null
          tournament_date: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          status?: string | null
          tournament_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_scores: {
        Row: {
          created_at: string
          hole_id: string
          id: string
          session_id: string
          strokes: number
        }
        Insert: {
          created_at?: string
          hole_id: string
          id?: string
          session_id: string
          strokes: number
        }
        Update: {
          created_at?: string
          hole_id?: string
          id?: string
          session_id?: string
          strokes?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_scores_hole_id_fkey"
            columns: ["hole_id"]
            isOneToOne: false
            referencedRelation: "holes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_scores_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          completed: boolean | null
          course_id: string
          created_at: string
          id: string
          player_id: string
          session_date: string
        }
        Insert: {
          completed?: boolean | null
          course_id: string
          created_at?: string
          id?: string
          player_id: string
          session_date: string
        }
        Update: {
          completed?: boolean | null
          course_id?: string
          created_at?: string
          id?: string
          player_id?: string
          session_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      generate_access_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          role_name: Database["public"]["Enums"]["app_role"]
          user_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "player"
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
      app_role: ["super_admin", "admin", "player"],
    },
  },
} as const
