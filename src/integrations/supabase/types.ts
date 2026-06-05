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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      join_requests: {
        Row: {
          created_at: string
          id: string
          phone: string | null
          player_names: string[] | null
          player_photos: string[] | null
          requested_by: string | null
          status: string
          team_logo_url: string | null
          team_name: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone?: string | null
          player_names?: string[] | null
          player_photos?: string[] | null
          requested_by?: string | null
          status?: string
          team_logo_url?: string | null
          team_name: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          phone?: string | null
          player_names?: string[] | null
          player_photos?: string[] | null
          requested_by?: string | null
          status?: string
          team_logo_url?: string | null
          team_name?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_red_cards: number
          away_score: number | null
          away_sets: number | null
          away_team_id: string | null
          away_yellow_cards: number
          created_at: string
          group_name: string | null
          home_red_cards: number
          home_score: number | null
          home_sets: number | null
          home_team_id: string | null
          home_yellow_cards: number
          id: string
          leg: number | null
          match_date: string | null
          match_order: number
          match_time: string | null
          next_match_id: string | null
          round: number
          scorers: Json
          sets_json: Json | null
          stage: string | null
          status: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          away_red_cards?: number
          away_score?: number | null
          away_sets?: number | null
          away_team_id?: string | null
          away_yellow_cards?: number
          created_at?: string
          group_name?: string | null
          home_red_cards?: number
          home_score?: number | null
          home_sets?: number | null
          home_team_id?: string | null
          home_yellow_cards?: number
          id?: string
          leg?: number | null
          match_date?: string | null
          match_order?: number
          match_time?: string | null
          next_match_id?: string | null
          round?: number
          scorers?: Json
          sets_json?: Json | null
          stage?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          away_red_cards?: number
          away_score?: number | null
          away_sets?: number | null
          away_team_id?: string | null
          away_yellow_cards?: number
          created_at?: string
          group_name?: string | null
          home_red_cards?: number
          home_score?: number | null
          home_sets?: number | null
          home_team_id?: string | null
          home_yellow_cards?: number
          id?: string
          leg?: number | null
          match_date?: string | null
          match_order?: number
          match_time?: string | null
          next_match_id?: string | null
          round?: number
          scorers?: Json
          sets_json?: Json | null
          stage?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_next_match_id_fkey"
            columns: ["next_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_organizer_id: string | null
          related_tournament_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_organizer_id?: string | null
          related_tournament_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_organizer_id?: string | null
          related_tournament_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_tournament_id_fkey"
            columns: ["related_tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          media_types: string[] | null
          media_urls: string[] | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          media_types?: string[] | null
          media_urls?: string[] | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          media_types?: string[] | null
          media_urls?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auto_draw_after_open: boolean
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_organizer: boolean | null
          pin_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_draw_after_open?: boolean
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_organizer?: boolean | null
          pin_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_draw_after_open?: boolean
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_organizer?: boolean | null
          pin_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      standings: {
        Row: {
          created_at: string
          drawn: number | null
          goal_difference: number | null
          goals_against: number | null
          goals_for: number | null
          group_name: string | null
          id: string
          lost: number | null
          played: number | null
          points: number | null
          position: number | null
          team_id: string
          tournament_id: string
          updated_at: string
          won: number | null
        }
        Insert: {
          created_at?: string
          drawn?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          group_name?: string | null
          id?: string
          lost?: number | null
          played?: number | null
          points?: number | null
          position?: number | null
          team_id: string
          tournament_id: string
          updated_at?: string
          won?: number | null
        }
        Update: {
          created_at?: string
          drawn?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          group_name?: string | null
          id?: string
          lost?: number | null
          played?: number | null
          points?: number | null
          position?: number | null
          team_id?: string
          tournament_id?: string
          updated_at?: string
          won?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          group_name: string | null
          id: string
          is_eliminated: boolean | null
          logo_url: string | null
          name: string
          player_info: Json
          player_names: string[] | null
          player_photos: string[] | null
          seed: number | null
          sport_type: Database["public"]["Enums"]["sport_type"] | null
          tournament_id: string
        }
        Insert: {
          created_at?: string
          group_name?: string | null
          id?: string
          is_eliminated?: boolean | null
          logo_url?: string | null
          name: string
          player_info?: Json
          player_names?: string[] | null
          player_photos?: string[] | null
          seed?: number | null
          sport_type?: Database["public"]["Enums"]["sport_type"] | null
          tournament_id: string
        }
        Update: {
          created_at?: string
          group_name?: string | null
          id?: string
          is_eliminated?: boolean | null
          logo_url?: string | null
          name?: string
          player_info?: Json
          player_names?: string[] | null
          player_photos?: string[] | null
          seed?: number | null
          sport_type?: Database["public"]["Enums"]["sport_type"] | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          accept_join_requests: boolean | null
          age_category: string | null
          auto_draw: boolean
          created_at: string
          current_round: number | null
          end_date: string | null
          has_playoff: boolean | null
          id: string
          is_open: boolean
          join_code: string | null
          league_legs: number | null
          logo_url: string | null
          max_teams: number | null
          name: string
          num_groups: number | null
          num_teams: number
          owner_id: string | null
          playoff_teams: number | null
          qualifiers_per_group: number | null
          referee_name: string | null
          registration_closed: boolean
          registration_deadline: string | null
          season: string | null
          sport_type: Database["public"]["Enums"]["sport_type"] | null
          start_date: string | null
          status: Database["public"]["Enums"]["tournament_status"]
          teams_per_group: number | null
          type: Database["public"]["Enums"]["tournament_type"]
          updated_at: string
          venue_address: string | null
          venue_name: string | null
          venue_photos: string[] | null
          volleyball_format: string | null
        }
        Insert: {
          accept_join_requests?: boolean | null
          age_category?: string | null
          auto_draw?: boolean
          created_at?: string
          current_round?: number | null
          end_date?: string | null
          has_playoff?: boolean | null
          id?: string
          is_open?: boolean
          join_code?: string | null
          league_legs?: number | null
          logo_url?: string | null
          max_teams?: number | null
          name: string
          num_groups?: number | null
          num_teams?: number
          owner_id?: string | null
          playoff_teams?: number | null
          qualifiers_per_group?: number | null
          referee_name?: string | null
          registration_closed?: boolean
          registration_deadline?: string | null
          season?: string | null
          sport_type?: Database["public"]["Enums"]["sport_type"] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          teams_per_group?: number | null
          type?: Database["public"]["Enums"]["tournament_type"]
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
          venue_photos?: string[] | null
          volleyball_format?: string | null
        }
        Update: {
          accept_join_requests?: boolean | null
          age_category?: string | null
          auto_draw?: boolean
          created_at?: string
          current_round?: number | null
          end_date?: string | null
          has_playoff?: boolean | null
          id?: string
          is_open?: boolean
          join_code?: string | null
          league_legs?: number | null
          logo_url?: string | null
          max_teams?: number | null
          name?: string
          num_groups?: number | null
          num_teams?: number
          owner_id?: string | null
          playoff_teams?: number | null
          qualifiers_per_group?: number | null
          referee_name?: string | null
          registration_closed?: boolean
          registration_deadline?: string | null
          season?: string | null
          sport_type?: Database["public"]["Enums"]["sport_type"] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          teams_per_group?: number | null
          type?: Database["public"]["Enums"]["tournament_type"]
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
          venue_photos?: string[] | null
          volleyball_format?: string | null
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
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
      venue_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          tournament_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          tournament_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_ratings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_league_tournament_full: {
        Args: {
          p_age_category?: string
          p_has_playoff?: boolean
          p_league_legs?: number
          p_logo_url?: string
          p_name: string
          p_owner_id?: string
          p_playoff_teams?: number
          p_referee_name?: string
          p_season?: string
          p_sport_type?: Database["public"]["Enums"]["sport_type"]
          p_start_date: string
          p_team_names: string[]
          p_venue_address?: string
          p_venue_name?: string
          p_venue_photos?: string[]
          p_volleyball_format?: string
        }
        Returns: string
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
      app_role: "organizer" | "viewer"
      match_status: "scheduled" | "live" | "completed"
      sport_type:
        | "football"
        | "basketball"
        | "volleyball"
        | "handball"
        | "tennis"
        | "padel"
      tournament_status: "draft" | "upcoming" | "live" | "completed"
      tournament_type: "knockout" | "league" | "groups"
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
      app_role: ["organizer", "viewer"],
      match_status: ["scheduled", "live", "completed"],
      sport_type: [
        "football",
        "basketball",
        "volleyball",
        "handball",
        "tennis",
        "padel",
      ],
      tournament_status: ["draft", "upcoming", "live", "completed"],
      tournament_type: ["knockout", "league", "groups"],
    },
  },
} as const
