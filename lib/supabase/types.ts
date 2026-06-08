export type CoupleState =
  | 'drafted'
  | 'invited'
  | 'mutual'
  | 'pending_admin'
  | 'approved'
  | 'rejected';

export type WhisperFeeling =
  | 'unseen'
  | 'distant'
  | 'tender'
  | 'weary'
  | 'anxious'
  | 'small'
  | 'alone'
  | 'frustrated'
  | 'hurt'
  | 'longing';

export type WhisperResponse = 'heard' | 'tell_more' | 'lets_talk';

export type PlaceKind = 'visited' | 'dream' | 'first_date' | 'anniversary' | 'home';

export type PromiseCadence = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type CapsuleRecipient = 'partner' | 'both' | 'future_us';

export interface Database {
  public: {
    Tables: {
      couples: {
        Row: {
          id: string;
          state: CoupleState;
          name_a: string | null;
          name_b: string | null;
          name_a_ar: string | null;
          name_b_ar: string | null;
          wedding_date: string | null;
          invite_code: string | null;
          invite_email: string | null;
          initiator_id: string;
          partner_id: string | null;
          admin_note: string | null;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          state?: CoupleState;
          name_a?: string | null;
          name_b?: string | null;
          name_a_ar?: string | null;
          name_b_ar?: string | null;
          wedding_date?: string | null;
          invite_code?: string | null;
          invite_email?: string | null;
          initiator_id: string;
          partner_id?: string | null;
          admin_note?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          state?: CoupleState;
          name_a?: string | null;
          name_b?: string | null;
          name_a_ar?: string | null;
          name_b_ar?: string | null;
          wedding_date?: string | null;
          invite_code?: string | null;
          invite_email?: string | null;
          initiator_id?: string;
          partner_id?: string | null;
          admin_note?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      couple_members: {
        Row: {
          user_id: string;
          couple_id: string;
          role: 'initiator' | 'partner';
          display_name: string | null;
          avatar_url: string | null;
          confirmed_at: string | null;
        };
        Insert: {
          user_id: string;
          couple_id: string;
          role: 'initiator' | 'partner';
          display_name?: string | null;
          avatar_url?: string | null;
          confirmed_at?: string | null;
        };
        Update: {
          user_id?: string;
          couple_id?: string;
          role?: 'initiator' | 'partner';
          display_name?: string | null;
          avatar_url?: string | null;
          confirmed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'couple_members_couple_id_fkey';
            columns: ['couple_id'];
            isOneToOne: false;
            referencedRelation: 'couples';
            referencedColumns: ['id'];
          },
        ];
      };
      admins: {
        Row: { user_id: string; added_at: string };
        Insert: { user_id: string; added_at?: string };
        Update: { user_id?: string; added_at?: string };
        Relationships: [];
      };
      memories: {
        Row: {
          id: string;
          couple_id: string;
          occurred_at: string;
          caption: string;
          body: string | null;
          image_url: string | null;
          place_id: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          occurred_at: string;
          caption: string;
          body?: string | null;
          image_url?: string | null;
          place_id?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          occurred_at?: string;
          caption?: string;
          body?: string | null;
          image_url?: string | null;
          place_id?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      bucket_items: {
        Row: {
          id: string;
          couple_id: string;
          title: string;
          category: string | null;
          notes: string | null;
          position: number;
          completed_at: string | null;
          memory_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          title: string;
          category?: string | null;
          notes?: string | null;
          position?: number;
          completed_at?: string | null;
          memory_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          title?: string;
          category?: string | null;
          notes?: string | null;
          position?: number;
          completed_at?: string | null;
          memory_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_prompts: {
        Row: { id: string; prompt_en: string; prompt_ar: string; depth: number };
        Insert: { id?: string; prompt_en: string; prompt_ar: string; depth?: number };
        Update: { id?: string; prompt_en?: string; prompt_ar?: string; depth?: number };
        Relationships: [];
      };
      prompt_answers: {
        Row: {
          id: string;
          couple_id: string;
          prompt_id: string;
          user_id: string;
          answer: string;
          for_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          prompt_id: string;
          user_id: string;
          answer: string;
          for_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          prompt_id?: string;
          user_id?: string;
          answer?: string;
          for_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      capsule_letters: {
        Row: {
          id: string;
          couple_id: string;
          author_id: string;
          recipient: CapsuleRecipient;
          ciphertext: string;
          nonce: string;
          unlock_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          author_id: string;
          recipient: CapsuleRecipient;
          ciphertext: string;
          nonce: string;
          unlock_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          author_id?: string;
          recipient?: CapsuleRecipient;
          ciphertext?: string;
          nonce?: string;
          unlock_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      vibe_pings: {
        Row: {
          couple_id: string;
          user_id: string;
          mood: string | null;
          energy: number | null;
          craving: string | null;
          custom_mood: string | null;
          updated_at: string;
        };
        Insert: {
          couple_id: string;
          user_id: string;
          mood?: string | null;
          energy?: number | null;
          craving?: string | null;
          custom_mood?: string | null;
          updated_at?: string;
        };
        Update: {
          couple_id?: string;
          user_id?: string;
          mood?: string | null;
          energy?: number | null;
          craving?: string | null;
          custom_mood?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      places: {
        Row: {
          id: string;
          couple_id: string;
          name: string;
          lat: number;
          lng: number;
          kind: PlaceKind;
          visited_at: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          name: string;
          lat: number;
          lng: number;
          kind: PlaceKind;
          visited_at?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          name?: string;
          lat?: number;
          lng?: number;
          kind?: PlaceKind;
          visited_at?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      whispers: {
        Row: {
          id: string;
          couple_id: string;
          author_id: string;
          recipient_id: string;
          body_what: string;
          feeling: WhisperFeeling;
          body_wish: string;
          sent_at: string;
          deliver_at: string;
          read_at: string | null;
          response: WhisperResponse | null;
          response_text: string | null;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id: string;
          author_id: string;
          recipient_id: string;
          body_what: string;
          feeling: WhisperFeeling;
          body_wish: string;
          sent_at?: string;
          deliver_at: string;
          read_at?: string | null;
          response?: WhisperResponse | null;
          response_text?: string | null;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string;
          author_id?: string;
          recipient_id?: string;
          body_what?: string;
          feeling?: WhisperFeeling;
          body_wish?: string;
          sent_at?: string;
          deliver_at?: string;
          read_at?: string | null;
          response?: WhisperResponse | null;
          response_text?: string | null;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      mirror_questions: {
        Row: { id: string; question_en: string; question_ar: string; category: string | null };
        Insert: { id?: string; question_en: string; question_ar: string; category?: string | null };
        Update: { id?: string; question_en?: string; question_ar?: string; category?: string | null };
        Relationships: [];
      };
      mirror_sessions: {
        Row: {
          id: string;
          couple_id: string;
          question_id: string;
          week_of: string;
          revealed_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id: string;
          question_id: string;
          week_of: string;
          revealed_at?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string;
          question_id?: string;
          week_of?: string;
          revealed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'mirror_sessions_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'mirror_questions';
            referencedColumns: ['id'];
          },
        ];
      };
      mirror_answers: {
        Row: {
          session_id: string;
          user_id: string;
          answer: string;
          submitted_at: string;
        };
        Insert: {
          session_id: string;
          user_id: string;
          answer: string;
          submitted_at?: string;
        };
        Update: {
          session_id?: string;
          user_id?: string;
          answer?: string;
          submitted_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mirror_answers_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'mirror_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      promises: {
        Row: {
          id: string;
          couple_id: string;
          author_id: string;
          text: string;
          cadence: PromiseCadence;
          next_check_at: string | null;
          kept_count: number;
          broken_count: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          author_id: string;
          text: string;
          cadence: PromiseCadence;
          next_check_at?: string | null;
          kept_count?: number;
          broken_count?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          author_id?: string;
          text?: string;
          cadence?: PromiseCadence;
          next_check_at?: string | null;
          kept_count?: number;
          broken_count?: number;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      promise_checks: {
        Row: {
          id: string;
          promise_id: string;
          kept: boolean;
          note: string | null;
          checked_at: string;
        };
        Insert: {
          id?: string;
          promise_id: string;
          kept: boolean;
          note?: string | null;
          checked_at?: string;
        };
        Update: {
          id?: string;
          promise_id?: string;
          kept?: boolean;
          note?: string | null;
          checked_at?: string;
        };
        Relationships: [];
      };
      heartbeats: {
        Row: {
          id: string;
          couple_id: string;
          from_user: string;
          to_user: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          from_user: string;
          to_user: string;
          sent_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      gratitudes: {
        Row: {
          id: string;
          couple_id: string;
          user_id: string;
          for_text: string;
          for_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          user_id: string;
          for_text: string;
          for_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          user_id?: string;
          for_text?: string;
          for_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      blueprint_items: {
        Row: {
          id: string;
          couple_id: string;
          user_id: string;
          category: string;
          label: string;
          value: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          user_id: string;
          category: string;
          label: string;
          value: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          user_id?: string;
          category?: string;
          label?: string;
          value?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      missions: {
        Row: {
          id: string;
          couple_id: string;
          assigned_to: string;
          text: string;
          deadline_at: string;
          completed_at: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          assigned_to: string;
          text: string;
          deadline_at: string;
          completed_at?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          assigned_to?: string;
          text?: string;
          deadline_at?: string;
          completed_at?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      truce_sessions: {
        Row: {
          id: string;
          couple_id: string;
          triggered_by: string;
          expires_at: string;
          i_feel: string | null;
          partner_i_feel: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          triggered_by: string;
          expires_at: string;
          i_feel?: string | null;
          partner_i_feel?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          triggered_by?: string;
          expires_at?: string;
          i_feel?: string | null;
          partner_i_feel?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      dinner_options: {
        Row: {
          id: string;
          couple_id: string;
          name: string;
          category: 'restaurant' | 'home_cook';
          note: string | null;
          swipe_a: 'yes' | 'no' | null;
          swipe_b: 'yes' | 'no' | null;
          matched_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          name: string;
          category?: 'restaurant' | 'home_cook';
          note?: string | null;
          swipe_a?: 'yes' | 'no' | null;
          swipe_b?: 'yes' | 'no' | null;
          matched_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          name?: string;
          category?: 'restaurant' | 'home_cook';
          note?: string | null;
          swipe_a?: 'yes' | 'no' | null;
          swipe_b?: 'yes' | 'no' | null;
          matched_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      canvas_strokes: {
        Row: {
          id: string;
          couple_id: string;
          author_id: string;
          points: number[];
          color: string;
          width: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          author_id: string;
          points: number[];
          color?: string;
          width?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          author_id?: string;
          points?: number[];
          color?: string;
          width?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      queue_items: {
        Row: {
          id: string;
          couple_id: string;
          title: string;
          category: 'movie' | 'show' | 'book' | 'place';
          url: string | null;
          image_url: string | null;
          position: number;
          watched_at: string | null;
          rating_a: number | null;
          rating_b: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          title: string;
          category: 'movie' | 'show' | 'book' | 'place';
          url?: string | null;
          image_url?: string | null;
          position?: number;
          watched_at?: string | null;
          rating_a?: number | null;
          rating_b?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          title?: string;
          category?: 'movie' | 'show' | 'book' | 'place';
          url?: string | null;
          image_url?: string | null;
          position?: number;
          watched_at?: string | null;
          rating_a?: number | null;
          rating_b?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      voice_notes: {
        Row: {
          id: string;
          couple_id: string;
          author_id: string;
          storage_path: string;
          duration_sec: number;
          played_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          author_id: string;
          storage_path: string;
          duration_sec: number;
          played_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          author_id?: string;
          storage_path?: string;
          duration_sec?: number;
          played_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      device_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          platform?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: { uid: string }; Returns: boolean };
      current_couple_id: { Args: Record<string, never>; Returns: string };
      accept_invite: {
        Args: { p_code: string; p_name_b?: string | null; p_name_b_ar?: string | null };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
