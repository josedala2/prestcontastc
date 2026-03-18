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
      accounts: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          level: number
          nature: string
          parent_code: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          id?: string
          level?: number
          nature?: string
          parent_code?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          level?: number
          nature?: string
          parent_code?: string | null
        }
        Relationships: []
      }
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
      atividade_historico: {
        Row: {
          atividade_id: string
          created_at: string
          estado_anterior: string | null
          estado_novo: string
          executado_por: string
          id: string
          observacoes: string | null
          perfil_executor: string | null
        }
        Insert: {
          atividade_id: string
          created_at?: string
          estado_anterior?: string | null
          estado_novo: string
          executado_por: string
          id?: string
          observacoes?: string | null
          perfil_executor?: string | null
        }
        Update: {
          atividade_id?: string
          created_at?: string
          estado_anterior?: string | null
          estado_novo?: string
          executado_por?: string
          id?: string
          observacoes?: string | null
          perfil_executor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atividade_historico_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades: {
        Row: {
          acao_esperada: string | null
          canal_submissao: string | null
          categoria_entidade: string | null
          created_at: string
          data_conclusao: string | null
          data_criacao: string
          data_inicio: string | null
          dependencia_atividade_id: string | null
          descricao: string | null
          documentos_gerados: string[] | null
          documentos_necessarios: string[] | null
          estado: string
          etapa_fluxo: number
          id: string
          observacoes: string | null
          ordem: number
          perfil_responsavel: string
          prazo: string | null
          prioridade: string
          processo_id: string | null
          tipo_evento: string | null
          titulo: string
          updated_at: string
          utilizador_responsavel: string | null
        }
        Insert: {
          acao_esperada?: string | null
          canal_submissao?: string | null
          categoria_entidade?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_criacao?: string
          data_inicio?: string | null
          dependencia_atividade_id?: string | null
          descricao?: string | null
          documentos_gerados?: string[] | null
          documentos_necessarios?: string[] | null
          estado?: string
          etapa_fluxo?: number
          id?: string
          observacoes?: string | null
          ordem?: number
          perfil_responsavel: string
          prazo?: string | null
          prioridade?: string
          processo_id?: string | null
          tipo_evento?: string | null
          titulo: string
          updated_at?: string
          utilizador_responsavel?: string | null
        }
        Update: {
          acao_esperada?: string | null
          canal_submissao?: string | null
          categoria_entidade?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_criacao?: string
          data_inicio?: string | null
          dependencia_atividade_id?: string | null
          descricao?: string | null
          documentos_gerados?: string[] | null
          documentos_necessarios?: string[] | null
          estado?: string
          etapa_fluxo?: number
          id?: string
          observacoes?: string | null
          ordem?: number
          perfil_responsavel?: string
          prazo?: string | null
          prioridade?: string
          processo_id?: string | null
          tipo_evento?: string | null
          titulo?: string
          updated_at?: string
          utilizador_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atividades_dependencia_atividade_id_fkey"
            columns: ["dependencia_atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          action_type: string | null
          created_at: string
          detail: string | null
          id: string
          timestamp: string
          username: string
        }
        Insert: {
          action: string
          action_type?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          timestamp?: string
          username: string
        }
        Update: {
          action?: string
          action_type?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          timestamp?: string
          username?: string
        }
        Relationships: []
      }
      compliance_questions: {
        Row: {
          classification: string
          created_at: string
          id: string
          norma: string
          question: string
          responsabilidade: string | null
          score: number
        }
        Insert: {
          classification?: string
          created_at?: string
          id: string
          norma: string
          question: string
          responsabilidade?: string | null
          score?: number
        }
        Update: {
          classification?: string
          created_at?: string
          id?: string
          norma?: string
          question?: string
          responsabilidade?: string | null
          score?: number
        }
        Relationships: []
      }
      documentos_tribunal: {
        Row: {
          aprovado_por: string | null
          assunto: string
          conteudo: string
          created_at: string
          criado_por: string
          emitido_at: string | null
          entidade_id: string | null
          estado: string
          exercicio_id: string | null
          hash_sha256: string | null
          id: string
          imutavel: boolean
          juiz_relator: string | null
          numero_documento: string
          prazo_resposta: string | null
          processo_id: string | null
          resultado_acordao: string | null
          selo_temporal: string | null
          tipo: string
          updated_at: string
          versao: number
        }
        Insert: {
          aprovado_por?: string | null
          assunto: string
          conteudo: string
          created_at?: string
          criado_por: string
          emitido_at?: string | null
          entidade_id?: string | null
          estado?: string
          exercicio_id?: string | null
          hash_sha256?: string | null
          id?: string
          imutavel?: boolean
          juiz_relator?: string | null
          numero_documento: string
          prazo_resposta?: string | null
          processo_id?: string | null
          resultado_acordao?: string | null
          selo_temporal?: string | null
          tipo: string
          updated_at?: string
          versao?: number
        }
        Update: {
          aprovado_por?: string | null
          assunto?: string
          conteudo?: string
          created_at?: string
          criado_por?: string
          emitido_at?: string | null
          entidade_id?: string | null
          estado?: string
          exercicio_id?: string | null
          hash_sha256?: string | null
          id?: string
          imutavel?: boolean
          juiz_relator?: string | null
          numero_documento?: string
          prazo_resposta?: string | null
          processo_id?: string | null
          resultado_acordao?: string | null
          selo_temporal?: string | null
          tipo?: string
          updated_at?: string
          versao?: number
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
      entities: {
        Row: {
          contacto: string | null
          created_at: string
          id: string
          morada: string | null
          name: string
          nif: string
          provincia: string | null
          tipologia: string
          tutela: string | null
        }
        Insert: {
          contacto?: string | null
          created_at?: string
          id: string
          morada?: string | null
          name: string
          nif: string
          provincia?: string | null
          tipologia?: string
          tutela?: string | null
        }
        Update: {
          contacto?: string | null
          created_at?: string
          id?: string
          morada?: string | null
          name?: string
          nif?: string
          provincia?: string | null
          tipologia?: string
          tutela?: string | null
        }
        Relationships: []
      }
      financial_indicators: {
        Row: {
          activo_correntes: number | null
          activo_nao_correntes: number | null
          activo_total: number | null
          capital_proprio: number | null
          ciclo_financeiro: number | null
          ciclo_operacional: number | null
          composicao_endividamento: number | null
          created_at: string
          custos_operacionais: number | null
          endividamento_geral: number | null
          entity_id: string
          fiscal_year_id: string
          giro_activo: number | null
          id: string
          imposto_rendimento: number | null
          liquidez_corrente: number | null
          liquidez_geral: number | null
          liquidez_seca: number | null
          margem_liquida: number | null
          passivo_corrente: number | null
          passivo_nao_corrente: number | null
          passivo_total: number | null
          prazo_medio_pagamento: number | null
          prazo_medio_recebimento: number | null
          prazo_medio_renovacao_estoque: number | null
          proveitos_operacionais: number | null
          resultado_antes_impostos: number | null
          resultado_financeiro: number | null
          resultado_liquido: number | null
          resultado_nao_operacional: number | null
          resultado_operacional: number | null
          roa: number | null
          roe: number | null
          year: number
        }
        Insert: {
          activo_correntes?: number | null
          activo_nao_correntes?: number | null
          activo_total?: number | null
          capital_proprio?: number | null
          ciclo_financeiro?: number | null
          ciclo_operacional?: number | null
          composicao_endividamento?: number | null
          created_at?: string
          custos_operacionais?: number | null
          endividamento_geral?: number | null
          entity_id: string
          fiscal_year_id: string
          giro_activo?: number | null
          id?: string
          imposto_rendimento?: number | null
          liquidez_corrente?: number | null
          liquidez_geral?: number | null
          liquidez_seca?: number | null
          margem_liquida?: number | null
          passivo_corrente?: number | null
          passivo_nao_corrente?: number | null
          passivo_total?: number | null
          prazo_medio_pagamento?: number | null
          prazo_medio_recebimento?: number | null
          prazo_medio_renovacao_estoque?: number | null
          proveitos_operacionais?: number | null
          resultado_antes_impostos?: number | null
          resultado_financeiro?: number | null
          resultado_liquido?: number | null
          resultado_nao_operacional?: number | null
          resultado_operacional?: number | null
          roa?: number | null
          roe?: number | null
          year: number
        }
        Update: {
          activo_correntes?: number | null
          activo_nao_correntes?: number | null
          activo_total?: number | null
          capital_proprio?: number | null
          ciclo_financeiro?: number | null
          ciclo_operacional?: number | null
          composicao_endividamento?: number | null
          created_at?: string
          custos_operacionais?: number | null
          endividamento_geral?: number | null
          entity_id?: string
          fiscal_year_id?: string
          giro_activo?: number | null
          id?: string
          imposto_rendimento?: number | null
          liquidez_corrente?: number | null
          liquidez_geral?: number | null
          liquidez_seca?: number | null
          margem_liquida?: number | null
          passivo_corrente?: number | null
          passivo_nao_corrente?: number | null
          passivo_total?: number | null
          prazo_medio_pagamento?: number | null
          prazo_medio_recebimento?: number | null
          prazo_medio_renovacao_estoque?: number | null
          proveitos_operacionais?: number | null
          resultado_antes_impostos?: number | null
          resultado_financeiro?: number | null
          resultado_liquido?: number | null
          resultado_nao_operacional?: number | null
          resultado_operacional?: number | null
          roa?: number | null
          roe?: number | null
          year?: number
        }
        Relationships: []
      }
      fiscal_years: {
        Row: {
          completude: number | null
          created_at: string
          deadline: string | null
          entity_id: string
          id: string
          status: string
          submitted_at: string | null
          total_despesa: number | null
          total_receita: number | null
          updated_at: string
          year: number
        }
        Insert: {
          completude?: number | null
          created_at?: string
          deadline?: string | null
          entity_id: string
          id: string
          status?: string
          submitted_at?: string | null
          total_despesa?: number | null
          total_receita?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          completude?: number | null
          created_at?: string
          deadline?: string | null
          entity_id?: string
          id?: string
          status?: string
          submitted_at?: string | null
          total_despesa?: number | null
          total_receita?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_years_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
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
      profiles: {
        Row: {
          activo: boolean
          avatar_url: string | null
          cargo: string | null
          created_at: string
          departamento: string | null
          divisao: string | null
          email: string | null
          id: string
          nome_completo: string
          seccao: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          divisao?: string | null
          email?: string | null
          id?: string
          nome_completo?: string
          seccao?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          divisao?: string | null
          email?: string | null
          id?: string
          nome_completo?: string
          seccao?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
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
      trial_balance: {
        Row: {
          account_code: string
          balance: number
          created_at: string
          credit: number
          debit: number
          description: string
          entity_id: string
          fiscal_year_id: string
          id: string
        }
        Insert: {
          account_code: string
          balance?: number
          created_at?: string
          credit?: number
          debit?: number
          description: string
          entity_id: string
          fiscal_year_id: string
          id?: string
        }
        Update: {
          account_code?: string
          balance?: number
          created_at?: string
          credit?: number
          debit?: number
          description?: string
          entity_id?: string
          fiscal_year_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      avancar_etapa_processo: {
        Args: {
          p_documentos_gerados?: string[]
          p_executado_por: string
          p_nova_etapa: number
          p_novo_estado: string
          p_observacoes?: string
          p_perfil_executor?: string
          p_processo_id: string
        }
        Returns: Json
      }
      estatisticas_dashboard: { Args: never; Returns: Json }
      estatisticas_por_perfil: { Args: { p_perfil: string }; Returns: Json }
      gerar_numero_processo: { Args: { p_ano: number }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "secretaria"
        | "tecnico"
        | "chefe_seccao"
        | "chefe_divisao"
        | "juiz"
        | "admin"
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
      app_role: [
        "secretaria",
        "tecnico",
        "chefe_seccao",
        "chefe_divisao",
        "juiz",
        "admin",
      ],
    },
  },
} as const
