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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      actas_recepcao: {
        Row: {
          acta_numero: string
          created_at: string
          created_by: string
          entity_id: string
          entity_name: string
          file_name: string
          file_path: string
          fiscal_year: string
          fiscal_year_id: string
          id: string
        }
        Insert: {
          acta_numero: string
          created_at?: string
          created_by?: string
          entity_id: string
          entity_name: string
          file_name: string
          file_path: string
          fiscal_year: string
          fiscal_year_id: string
          id?: string
        }
        Update: {
          acta_numero?: string
          created_at?: string
          created_by?: string
          entity_id?: string
          entity_name?: string
          file_name?: string
          file_path?: string
          fiscal_year?: string
          fiscal_year_id?: string
          id?: string
        }
        Relationships: []
      }
      element_request_files: {
        Row: {
          content_type: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          response_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          response_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "element_request_files_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "element_request_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      element_request_responses: {
        Row: {
          created_at: string
          entity_id: string
          fiscal_year_id: string
          id: string
          notification_id: string
          response_message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          fiscal_year_id: string
          id?: string
          notification_id: string
          response_message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          fiscal_year_id?: string
          id?: string
          notification_id?: string
          response_message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pareceres: {
        Row: {
          comentarios: string | null
          created_at: string
          entity_id: string
          entity_name: string
          file_name: string | null
          file_path: string | null
          fiscal_year: string
          id: string
          integrity_hash: string | null
          parecer_final: string
          resultado_exercicio: number
          tecnico_nome: string
          tipo_parecer_index: number
          total_activo: number
          total_cap_proprio: number
          total_custos: number
          total_passivo: number
          total_proveitos: number
          version: number
        }
        Insert: {
          comentarios?: string | null
          created_at?: string
          entity_id: string
          entity_name: string
          file_name?: string | null
          file_path?: string | null
          fiscal_year: string
          id?: string
          integrity_hash?: string | null
          parecer_final: string
          resultado_exercicio?: number
          tecnico_nome: string
          tipo_parecer_index?: number
          total_activo?: number
          total_cap_proprio?: number
          total_custos?: number
          total_passivo?: number
          total_proveitos?: number
          version?: number
        }
        Update: {
          comentarios?: string | null
          created_at?: string
          entity_id?: string
          entity_name?: string
          file_name?: string | null
          file_path?: string | null
          fiscal_year?: string
          id?: string
          integrity_hash?: string | null
          parecer_final?: string
          resultado_exercicio?: number
          tecnico_nome?: string
          tipo_parecer_index?: number
          total_activo?: number
          total_cap_proprio?: number
          total_custos?: number
          total_passivo?: number
          total_proveitos?: number
          version?: number
        }
        Relationships: []
      }
      processo_documentos: {
        Row: {
          caminho_ficheiro: string | null
          created_at: string
          estado: string
          id: string
          nome_ficheiro: string
          obrigatorio: boolean
          observacoes: string | null
          processo_id: string
          tipo_documento: string
          validado_em: string | null
          validado_por: string | null
          versao: number
        }
        Insert: {
          caminho_ficheiro?: string | null
          created_at?: string
          estado?: string
          id?: string
          nome_ficheiro: string
          obrigatorio?: boolean
          observacoes?: string | null
          processo_id: string
          tipo_documento: string
          validado_em?: string | null
          validado_por?: string | null
          versao?: number
        }
        Update: {
          caminho_ficheiro?: string | null
          created_at?: string
          estado?: string
          id?: string
          nome_ficheiro?: string
          obrigatorio?: boolean
          observacoes?: string | null
          processo_id?: string
          tipo_documento?: string
          validado_em?: string | null
          validado_por?: string | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "processo_documentos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      processo_historico: {
        Row: {
          acao: string
          created_at: string
          documentos_alterados: string[] | null
          documentos_gerados: string[] | null
          estado_anterior: string | null
          estado_seguinte: string | null
          etapa_anterior: number | null
          etapa_seguinte: number | null
          executado_por: string
          id: string
          observacoes: string | null
          perfil_executor: string | null
          processo_id: string
        }
        Insert: {
          acao: string
          created_at?: string
          documentos_alterados?: string[] | null
          documentos_gerados?: string[] | null
          estado_anterior?: string | null
          estado_seguinte?: string | null
          etapa_anterior?: number | null
          etapa_seguinte?: number | null
          executado_por: string
          id?: string
          observacoes?: string | null
          perfil_executor?: string | null
          processo_id: string
        }
        Update: {
          acao?: string
          created_at?: string
          documentos_alterados?: string[] | null
          documentos_gerados?: string[] | null
          estado_anterior?: string | null
          estado_seguinte?: string | null
          etapa_anterior?: number | null
          etapa_seguinte?: number | null
          executado_por?: string
          id?: string
          observacoes?: string | null
          perfil_executor?: string | null
          processo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processo_historico_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      processos: {
        Row: {
          ano_gerencia: number
          canal_entrada: string
          categoria_entidade: string
          completude_documental: number
          coordenador_equipa: string | null
          created_at: string
          data_conclusao: string | null
          data_submissao: string
          divisao_competente: string | null
          entity_id: string
          entity_name: string
          estado: string
          etapa_atual: number
          id: string
          juiz_adjunto: string | null
          juiz_relator: string | null
          numero_processo: string
          observacoes: string | null
          periodo_gerencia: string | null
          portador_contacto: string | null
          portador_documento: string | null
          portador_nome: string | null
          resolucao_aplicavel: string | null
          responsavel_atual: string | null
          seccao_competente: string | null
          submetido_por: string
          tecnico_analise: string | null
          updated_at: string
          urgencia: string
        }
        Insert: {
          ano_gerencia: number
          canal_entrada?: string
          categoria_entidade?: string
          completude_documental?: number
          coordenador_equipa?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_submissao?: string
          divisao_competente?: string | null
          entity_id: string
          entity_name: string
          estado?: string
          etapa_atual?: number
          id?: string
          juiz_adjunto?: string | null
          juiz_relator?: string | null
          numero_processo: string
          observacoes?: string | null
          periodo_gerencia?: string | null
          portador_contacto?: string | null
          portador_documento?: string | null
          portador_nome?: string | null
          resolucao_aplicavel?: string | null
          responsavel_atual?: string | null
          seccao_competente?: string | null
          submetido_por?: string
          tecnico_analise?: string | null
          updated_at?: string
          urgencia?: string
        }
        Update: {
          ano_gerencia?: number
          canal_entrada?: string
          categoria_entidade?: string
          completude_documental?: number
          coordenador_equipa?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_submissao?: string
          divisao_competente?: string | null
          entity_id?: string
          entity_name?: string
          estado?: string
          etapa_atual?: number
          id?: string
          juiz_adjunto?: string | null
          juiz_relator?: string | null
          numero_processo?: string
          observacoes?: string | null
          periodo_gerencia?: string | null
          portador_contacto?: string | null
          portador_documento?: string | null
          portador_nome?: string | null
          resolucao_aplicavel?: string | null
          responsavel_atual?: string | null
          seccao_competente?: string | null
          submetido_por?: string
          tecnico_analise?: string | null
          updated_at?: string
          urgencia?: string
        }
        Relationships: []
      }
      submission_documents: {
        Row: {
          content_type: string | null
          created_at: string
          doc_category: string
          doc_id: string
          doc_label: string
          entity_id: string
          file_name: string
          file_path: string
          file_size: number
          fiscal_year_id: string
          id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          doc_category: string
          doc_id: string
          doc_label: string
          entity_id: string
          file_name: string
          file_path: string
          file_size?: number
          fiscal_year_id: string
          id?: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          doc_category?: string
          doc_id?: string
          doc_label?: string
          entity_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          fiscal_year_id?: string
          id?: string
        }
        Relationships: []
      }
      submission_notifications: {
        Row: {
          created_at: string
          deadline: string | null
          detail: string | null
          email_sent: boolean
          entity_email: string | null
          entity_id: string
          entity_name: string
          fiscal_year: string
          fiscal_year_id: string
          id: string
          message: string
          read: boolean
          type: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          detail?: string | null
          email_sent?: boolean
          entity_email?: string | null
          entity_id: string
          entity_name: string
          fiscal_year: string
          fiscal_year_id: string
          id?: string
          message: string
          read?: boolean
          type: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          detail?: string | null
          email_sent?: boolean
          entity_email?: string | null
          entity_id?: string
          entity_name?: string
          fiscal_year?: string
          fiscal_year_id?: string
          id?: string
          message?: string
          read?: boolean
          type?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          created_at: string
          entity_id: string
          fiscal_year_id: string
          id: string
          motivo_rejeicao: string | null
          recepcionado_at: string | null
          rejeitado_at: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          uploaded_doc_ids: string[] | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          fiscal_year_id: string
          id?: string
          motivo_rejeicao?: string | null
          recepcionado_at?: string | null
          rejeitado_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          uploaded_doc_ids?: string[] | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          fiscal_year_id?: string
          id?: string
          motivo_rejeicao?: string | null
          recepcionado_at?: string | null
          rejeitado_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          uploaded_doc_ids?: string[] | null
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
    Enums: {},
  },
} as const
