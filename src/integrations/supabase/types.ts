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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assignment_confusions: {
        Row: {
          accepted_reasons: Json
          answer_if_fixed: string
          answer_if_not: string
          assignment_id: string
          code: string
          hint: string
          id: string
          nour_says: string
          nudge: string
          original_confusion_id: string | null
          quiz_question: string
          short_explanation: string
          sort_order: number
          title: string
        }
        Insert: {
          accepted_reasons?: Json
          answer_if_fixed: string
          answer_if_not: string
          assignment_id: string
          code: string
          hint?: string
          id?: string
          nour_says: string
          nudge?: string
          original_confusion_id?: string | null
          quiz_question: string
          short_explanation: string
          sort_order: number
          title: string
        }
        Update: {
          accepted_reasons?: Json
          answer_if_fixed?: string
          answer_if_not?: string
          assignment_id?: string
          code?: string
          hint?: string
          id?: string
          nour_says?: string
          nudge?: string
          original_confusion_id?: string | null
          quiz_question?: string
          short_explanation?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_confusions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_confusions_original_confusion_id_fkey"
            columns: ["original_confusion_id"]
            isOneToOne: false
            referencedRelation: "confusions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          created_at: string
          due_at: string | null
          grade_level: number
          id: string
          is_active: boolean
          mode: string
          test_questions: Json
          time_limit_minutes: number
          title: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          grade_level?: number
          id?: string
          is_active?: boolean
          mode?: string
          test_questions?: Json
          time_limit_minutes?: number
          title: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          grade_level?: number
          id?: string
          is_active?: boolean
          mode?: string
          test_questions?: Json
          time_limit_minutes?: number
          title?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      confusions: {
        Row: {
          accepted_reasons: Json
          answer_if_fixed: string
          answer_if_not: string
          code: string
          created_at: string
          hint: string
          id: string
          nour_says: string
          nudge: string
          quiz_question: string
          short_explanation: string
          sort_order: number
          title: string
          topic_id: string
        }
        Insert: {
          accepted_reasons?: Json
          answer_if_fixed: string
          answer_if_not: string
          code: string
          created_at?: string
          hint?: string
          id?: string
          nour_says: string
          nudge?: string
          quiz_question: string
          short_explanation: string
          sort_order: number
          title: string
          topic_id: string
        }
        Update: {
          accepted_reasons?: Json
          answer_if_fixed?: string
          answer_if_not?: string
          code?: string
          created_at?: string
          hint?: string
          id?: string
          nour_says?: string
          nudge?: string
          quiz_question?: string
          short_explanation?: string
          sort_order?: number
          title?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "confusions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      session_confusions: {
        Row: {
          assignment_confusion_id: string
          attempt_count: number
          evidence_quote: string | null
          evidence_turn_id: string | null
          hint_count: number
          id: string
          nudge_shown: boolean
          overridden_at: string | null
          override_note: string | null
          reason_summary: string | null
          session_id: string
          status: string
          teacher_override_status: string | null
          updated_at: string
        }
        Insert: {
          assignment_confusion_id: string
          attempt_count?: number
          evidence_quote?: string | null
          evidence_turn_id?: string | null
          hint_count?: number
          id?: string
          nudge_shown?: boolean
          overridden_at?: string | null
          override_note?: string | null
          reason_summary?: string | null
          session_id: string
          status?: string
          teacher_override_status?: string | null
          updated_at?: string
        }
        Update: {
          assignment_confusion_id?: string
          attempt_count?: number
          evidence_quote?: string | null
          evidence_turn_id?: string | null
          hint_count?: number
          id?: string
          nudge_shown?: boolean
          overridden_at?: string | null
          override_note?: string | null
          reason_summary?: string | null
          session_id?: string
          status?: string
          teacher_override_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_confusions_assignment_confusion_id_fkey"
            columns: ["assignment_confusion_id"]
            isOneToOne: false
            referencedRelation: "assignment_confusions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_confusions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          adjusted_score: number | null
          assignment_id: string
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          hints_used: number
          home_taught_at: string | null
          id: string
          is_sample: boolean
          mode: string
          score: number | null
          session_status: string
          started_at: string
          student_name: string
          teacher_override_score: number | null
          topic_id: string
          total_questions: number
          updated_at: string
        }
        Insert: {
          adjusted_score?: number | null
          assignment_id: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          hints_used?: number
          home_taught_at?: string | null
          id?: string
          is_sample?: boolean
          mode: string
          score?: number | null
          session_status?: string
          started_at?: string
          student_name: string
          teacher_override_score?: number | null
          topic_id: string
          total_questions?: number
          updated_at?: string
        }
        Update: {
          adjusted_score?: number | null
          assignment_id?: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          hints_used?: number
          home_taught_at?: string | null
          id?: string
          is_sample?: boolean
          mode?: string
          score?: number | null
          session_status?: string
          started_at?: string
          student_name?: string
          teacher_override_score?: number | null
          topic_id?: string
          total_questions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_overrides: {
        Row: {
          actor_label: string
          after_status: string
          before_status: string
          created_at: string
          id: string
          note: string | null
          session_confusion_id: string
          session_id: string
        }
        Insert: {
          actor_label?: string
          after_status: string
          before_status: string
          created_at?: string
          id?: string
          note?: string | null
          session_confusion_id: string
          session_id: string
        }
        Update: {
          actor_label?: string
          after_status?: string
          before_status?: string
          created_at?: string
          id?: string
          note?: string | null
          session_confusion_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_overrides_session_confusion_id_fkey"
            columns: ["session_confusion_id"]
            isOneToOne: false
            referencedRelation: "session_confusions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_overrides_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          description: string
          grade_level: number
          id: string
          is_published: boolean
          slug: string
          subject: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          grade_level?: number
          id?: string
          is_published?: boolean
          slug: string
          subject: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          grade_level?: number
          id?: string
          is_published?: boolean
          slug?: string
          subject?: string
          title?: string
        }
        Relationships: []
      }
      turns: {
        Row: {
          confusion_id: string | null
          created_at: string
          id: string
          metadata: Json
          session_id: string
          speaker: string
          text: string
        }
        Insert: {
          confusion_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          session_id: string
          speaker: string
          text: string
        }
        Update: {
          confusion_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          session_id?: string
          speaker?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "turns_confusion_id_fkey"
            columns: ["confusion_id"]
            isOneToOne: false
            referencedRelation: "assignment_confusions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_exam_attempts: {
        Row: {
          attempt_number: number
          auto_submitted: boolean
          deadline_at: string
          exam_id: string
          id: string
          notes_saved_at: string | null
          question_notes: Json
          report: Json | null
          report_error: string | null
          report_status: string
          started_at: string
          status: string
          student_name: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          attempt_number: number
          auto_submitted?: boolean
          deadline_at: string
          exam_id: string
          id?: string
          notes_saved_at?: string | null
          question_notes?: Json
          report?: Json | null
          report_error?: string | null
          report_status?: string
          started_at?: string
          status?: string
          student_name: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          attempt_number?: number
          auto_submitted?: boolean
          deadline_at?: string
          exam_id?: string
          id?: string
          notes_saved_at?: string | null
          question_notes?: Json
          report?: Json | null
          report_error?: string | null
          report_status?: string
          started_at?: string
          status?: string
          student_name?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "virtual_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_exam_recordings: {
        Row: {
          attempt_id: string
          audio_path: string
          created_at: string
          duration_ms: number
          id: string
          mime: string
          question_number: number
          transcript: string
          transcript_status: string
        }
        Insert: {
          attempt_id: string
          audio_path: string
          created_at?: string
          duration_ms?: number
          id?: string
          mime: string
          question_number: number
          transcript?: string
          transcript_status?: string
        }
        Update: {
          attempt_id?: string
          audio_path?: string
          created_at?: string
          duration_ms?: number
          id?: string
          mime?: string
          question_number?: number
          transcript?: string
          transcript_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_exam_recordings_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "virtual_exam_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_exams: {
        Row: {
          created_at: string
          due_at: string | null
          duration_minutes: number
          id: string
          instructions: string
          is_active: boolean
          max_attempts: number
          pdf_filename: string
          pdf_path: string
          question_count: number
          subject: string
          title: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          duration_minutes?: number
          id?: string
          instructions?: string
          is_active?: boolean
          max_attempts?: number
          pdf_filename?: string
          pdf_path: string
          question_count?: number
          subject?: string
          title: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          duration_minutes?: number
          id?: string
          instructions?: string
          is_active?: boolean
          max_attempts?: number
          pdf_filename?: string
          pdf_path?: string
          question_count?: number
          subject?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
