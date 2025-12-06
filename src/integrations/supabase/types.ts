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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_color: string
          condition_type: string
          condition_value: number
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          points: number
        }
        Insert: {
          badge_color?: string
          condition_type: string
          condition_value: number
          created_at?: string | null
          description: string
          icon: string
          id?: string
          name: string
          points?: number
        }
        Update: {
          badge_color?: string
          condition_type?: string
          condition_value?: number
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number
        }
        Relationships: []
      }
      ad_campaigns: {
        Row: {
          ad_type: string
          budget_spent: number
          budget_total: number
          cost_per_click: number
          cost_per_view: number
          created_at: string | null
          description: string | null
          id: string
          status: string
          target_interests: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ad_type: string
          budget_spent?: number
          budget_total?: number
          cost_per_click?: number
          cost_per_view?: number
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string
          target_interests?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ad_type?: string
          budget_spent?: number
          budget_total?: number
          cost_per_click?: number
          cost_per_view?: number
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string
          target_interests?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ad_clicks: {
        Row: {
          ad_id: string
          clicked_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          ad_id: string
          clicked_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          ad_id?: string
          clicked_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_clicks_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_impressions: {
        Row: {
          ad_id: string
          duration_viewed: number | null
          id: string
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          ad_id: string
          duration_viewed?: number | null
          id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          ad_id?: string
          duration_viewed?: number | null
          id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          campaign_id: string
          click_url: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          height: number | null
          id: string
          media_url: string | null
          title: string
          width: number | null
        }
        Insert: {
          campaign_id: string
          click_url?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          height?: number | null
          id?: string
          media_url?: string | null
          title: string
          width?: number | null
        }
        Update: {
          campaign_id?: string
          click_url?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          height?: number | null
          id?: string
          media_url?: string | null
          title?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_role_evaluations: {
        Row: {
          evaluated_at: string | null
          id: string
          reason: string
          suggested_role: string
          user_id: string
          was_applied: boolean | null
        }
        Insert: {
          evaluated_at?: string | null
          id?: string
          reason: string
          suggested_role: string
          user_id: string
          was_applied?: boolean | null
        }
        Update: {
          evaluated_at?: string | null
          id?: string
          reason?: string
          suggested_role?: string
          user_id?: string
          was_applied?: boolean | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          order_position: number | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          order_position?: number | null
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          order_position?: number | null
          slug?: string
        }
        Relationships: []
      }
      chat_participants: {
        Row: {
          chat_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_likes: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          is_edited: boolean | null
          reply_to_id: string | null
          repost_id: string | null
          repost_type: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          reply_to_id?: string | null
          repost_id?: string | null
          repost_type?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          reply_to_id?: string | null
          repost_id?: string | null
          repost_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      moderated_content: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          moderator_id: string | null
          reason: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          moderator_id?: string | null
          reason: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          moderator_id?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderated_content_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_words: {
        Row: {
          created_at: string | null
          id: string
          severity: string | null
          word: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          severity?: string | null
          word: string
        }
        Update: {
          created_at?: string | null
          id?: string
          severity?: string | null
          word?: string
        }
        Relationships: []
      }
      online_presence: {
        Row: {
          current_page: string | null
          id: string
          ip_hash: string | null
          last_seen_at: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
          user_type: string
        }
        Insert: {
          current_page?: string | null
          id?: string
          ip_hash?: string | null
          last_seen_at?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
          user_type?: string
        }
        Update: {
          current_page?: string | null
          id?: string
          ip_hash?: string | null
          last_seen_at?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
          user_type?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_hidden: boolean | null
          likes: number | null
          topic_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          likes?: number | null
          topic_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          likes?: number | null
          topic_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          id: string
          is_verified?: boolean | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string | null
          description: string
          downloads: number | null
          file_url: string | null
          id: string
          is_hidden: boolean | null
          rating: number | null
          resource_type: string
          title: string
          updated_at: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          downloads?: number | null
          file_url?: string | null
          id?: string
          is_hidden?: boolean | null
          rating?: number | null
          resource_type: string
          title: string
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          downloads?: number | null
          file_url?: string | null
          id?: string
          is_hidden?: boolean | null
          rating?: number | null
          resource_type?: string
          title?: string
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          category_id: string | null
          content: string
          created_at: string | null
          id: string
          is_hidden: boolean | null
          is_locked: boolean | null
          is_pinned: boolean | null
          title: string
          updated_at: string | null
          user_id: string | null
          views: number | null
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          views?: number | null
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_earnings: {
        Row: {
          ad_id: string | null
          amount: number
          crypto_tx_id: string | null
          earned_at: string | null
          id: string
          source: string
          user_id: string
          withdrawn: boolean | null
        }
        Insert: {
          ad_id?: string | null
          amount?: number
          crypto_tx_id?: string | null
          earned_at?: string | null
          id?: string
          source: string
          user_id: string
          withdrawn?: boolean | null
        }
        Update: {
          ad_id?: string | null
          amount?: number
          crypto_tx_id?: string | null
          earned_at?: string | null
          id?: string
          source?: string
          user_id?: string
          withdrawn?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_earnings_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          id: string
          interest: string
          score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          interest: string
          score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          interest?: string
          score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_reputation: {
        Row: {
          helpful_posts: number
          helpful_resources: number
          helpful_videos: number
          id: string
          likes_given: number
          likes_received: number
          reputation_points: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          helpful_posts?: number
          helpful_resources?: number
          helpful_videos?: number
          id?: string
          likes_given?: number
          likes_received?: number
          reputation_points?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          helpful_posts?: number
          helpful_resources?: number
          helpful_videos?: number
          id?: string
          likes_given?: number
          likes_received?: number
          reputation_points?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reputation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          can_moderate_resources: boolean | null
          can_moderate_topics: boolean | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          can_moderate_resources?: boolean | null
          can_moderate_topics?: boolean | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          can_moderate_resources?: boolean | null
          can_moderate_topics?: boolean | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_hidden: boolean | null
          likes: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
          video_url: string
          views: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_hidden?: boolean | null
          likes?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          video_url: string
          views?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_hidden?: boolean | null
          likes?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          video_url?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string | null
          crypto_address: string
          crypto_currency: string
          id: string
          processed_at: string | null
          status: string
          tx_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          crypto_address: string
          crypto_currency?: string
          id?: string
          processed_at?: string | null
          status?: string
          tx_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          crypto_address?: string
          crypto_currency?: string
          id?: string
          processed_at?: string | null
          status?: string
          tx_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_award_achievements: {
        Args: { _user_id: string }
        Returns: undefined
      }
      check_and_upgrade_role: { Args: { _user_id: string }; Returns: undefined }
      check_editor_to_moderator_upgrade: {
        Args: { _user_id: string }
        Returns: boolean
      }
      create_private_chat: {
        Args: { _user1: string; _user2: string }
        Returns: string
      }
      get_user_chat_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      randomly_assign_editor_role: { Args: never; Returns: undefined }
      update_reputation_on_like: {
        Args: { _author_id: string; _liker_id: string }
        Returns: undefined
      }
      update_reputation_on_unlike: {
        Args: { _author_id: string; _liker_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "newbie" | "pro" | "editor" | "moderator" | "admin"
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
      app_role: ["newbie", "pro", "editor", "moderator", "admin"],
    },
  },
} as const
