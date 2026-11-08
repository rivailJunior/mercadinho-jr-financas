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
      categorias: {
        Row: {
          ativo: boolean | null
          descricao: string | null
          id: number
          nome: string
          tipo: string
        }
        Insert: {
          ativo?: boolean | null
          descricao?: string | null
          id?: number
          nome: string
          tipo: string
        }
        Update: {
          ativo?: boolean | null
          descricao?: string | null
          id?: number
          nome?: string
          tipo?: string
        }
        Relationships: []
      }
      compras_cartao: {
        Row: {
          categoria_id: number | null
          created_at: string
          data_compra: string
          deleted_at: string | null
          descricao: string | null
          estabelecimento_id: string
          fatura_id: string | null
          id: string
          updated_at: string
          valor_centavos: number
        }
        Insert: {
          categoria_id?: number | null
          created_at?: string
          data_compra: string
          deleted_at?: string | null
          descricao?: string | null
          estabelecimento_id: string
          fatura_id?: string | null
          id?: string
          updated_at?: string
          valor_centavos: number
        }
        Update: {
          categoria_id?: number | null
          created_at?: string
          data_compra?: string
          deleted_at?: string | null
          descricao?: string | null
          estabelecimento_id?: string
          fatura_id?: string | null
          id?: string
          updated_at?: string
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_cartao_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_cartao_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_cartao_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas_cartao"
            referencedColumns: ["id"]
          },
        ]
      }
      compromissos_financeiros: {
        Row: {
          ativo: boolean
          categoria_id: number | null
          created_at: string
          deleted_at: string | null
          estabelecimento_id: string
          id: string
          nome: string
          periodicidade: Database["public"]["Enums"]["compromisso_periodicidade"]
          prioridade: number
          reserva_id: string | null
          status: Database["public"]["Enums"]["compromisso_status"]
          updated_at: string
          valor_efetivo_centavos: number | null
          valor_previsto_centavos: number
          vencimento: string | null
        }
        Insert: {
          ativo?: boolean
          categoria_id?: number | null
          created_at?: string
          deleted_at?: string | null
          estabelecimento_id: string
          id?: string
          nome: string
          periodicidade?: Database["public"]["Enums"]["compromisso_periodicidade"]
          prioridade?: number
          reserva_id?: string | null
          status?: Database["public"]["Enums"]["compromisso_status"]
          updated_at?: string
          valor_efetivo_centavos?: number | null
          valor_previsto_centavos?: number
          vencimento?: string | null
        }
        Update: {
          ativo?: boolean
          categoria_id?: number | null
          created_at?: string
          deleted_at?: string | null
          estabelecimento_id?: string
          id?: string
          nome?: string
          periodicidade?: Database["public"]["Enums"]["compromisso_periodicidade"]
          prioridade?: number
          reserva_id?: string | null
          status?: Database["public"]["Enums"]["compromisso_status"]
          updated_at?: string
          valor_efetivo_centavos?: number | null
          valor_previsto_centavos?: number
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compromissos_financeiros_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compromissos_financeiros_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compromissos_financeiros_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas_financeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      config_financeira: {
        Row: {
          caixa_minimo_centavos: number
          created_at: string | null
          estabelecimento_id: string | null
          id: number
          margem_bruta_pct: number
          prioridade_alocacao: Json | null
          split_contingencia_pct: number
          split_reinvestimento_pct: number
          split_reserva_pct: number
        }
        Insert: {
          caixa_minimo_centavos?: number
          created_at?: string | null
          estabelecimento_id?: string | null
          id?: number
          margem_bruta_pct?: number
          prioridade_alocacao?: Json | null
          split_contingencia_pct?: number
          split_reinvestimento_pct?: number
          split_reserva_pct?: number
        }
        Update: {
          caixa_minimo_centavos?: number
          created_at?: string | null
          estabelecimento_id?: string | null
          id?: number
          margem_bruta_pct?: number
          prioridade_alocacao?: Json | null
          split_contingencia_pct?: number
          split_reinvestimento_pct?: number
          split_reserva_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "config_financeira_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_financeiras: {
        Row: {
          ativo: boolean
          created_at: string
          data_saldo_inicial: string
          deleted_at: string | null
          estabelecimento_id: string
          id: string
          nome: string
          saldo_inicial_centavos: number
          tipo: Database["public"]["Enums"]["conta_tipo"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_saldo_inicial?: string
          deleted_at?: string | null
          estabelecimento_id: string
          id?: string
          nome: string
          saldo_inicial_centavos?: number
          tipo: Database["public"]["Enums"]["conta_tipo"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_saldo_inicial?: string
          deleted_at?: string | null
          estabelecimento_id?: string
          id?: string
          nome?: string
          saldo_inicial_centavos?: number
          tipo?: Database["public"]["Enums"]["conta_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_financeiras_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      custos_fixos_config: {
        Row: {
          ativo: boolean | null
          estabelecimento_id: string | null
          id: number
          mes_ano_vigencia: string
          nome: string
          percentual_sugerido: number | null
          tipo_custo: string
          valor_mensal: number | null
        }
        Insert: {
          ativo?: boolean | null
          estabelecimento_id?: string | null
          id?: number
          mes_ano_vigencia: string
          nome: string
          percentual_sugerido?: number | null
          tipo_custo: string
          valor_mensal?: number | null
        }
        Update: {
          ativo?: boolean | null
          estabelecimento_id?: string | null
          id?: number
          mes_ano_vigencia?: string
          nome?: string
          percentual_sugerido?: number | null
          tipo_custo?: string
          valor_mensal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custos_fixos_config_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      estabelecimentos: {
        Row: {
          created_at: string | null
          dias_uteis_mes_padrao: number | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          dias_uteis_mes_padrao?: number | null
          id?: string
          nome?: string
        }
        Update: {
          created_at?: string | null
          dias_uteis_mes_padrao?: number | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      faturas_cartao: {
        Row: {
          created_at: string
          deleted_at: string | null
          estabelecimento_id: string
          fechamento: string
          id: string
          reserva_id: string | null
          status: Database["public"]["Enums"]["fatura_status"]
          updated_at: string
          valor_fechado_centavos: number | null
          valor_pago_centavos: number
          valor_reservado_centavos: number
          vencimento: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          estabelecimento_id: string
          fechamento: string
          id?: string
          reserva_id?: string | null
          status?: Database["public"]["Enums"]["fatura_status"]
          updated_at?: string
          valor_fechado_centavos?: number | null
          valor_pago_centavos?: number
          valor_reservado_centavos?: number
          vencimento: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          estabelecimento_id?: string
          fechamento?: string
          id?: string
          reserva_id?: string | null
          status?: Database["public"]["Enums"]["fatura_status"]
          updated_at?: string
          valor_fechado_centavos?: number | null
          valor_pago_centavos?: number
          valor_reservado_centavos?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "faturas_cartao_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faturas_cartao_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas_financeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_caixa: {
        Row: {
          categoria_id: number | null
          created_at: string | null
          data_referencia: string
          descricao: string | null
          estabelecimento_id: string | null
          forma_pagamento: string | null
          id: string
          origem: string | null
          sheets_row_id: string | null
          sincronizado_sheets: boolean | null
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria_id?: number | null
          created_at?: string | null
          data_referencia: string
          descricao?: string | null
          estabelecimento_id?: string | null
          forma_pagamento?: string | null
          id?: string
          origem?: string | null
          sheets_row_id?: string | null
          sincronizado_sheets?: boolean | null
          tipo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          categoria_id?: number | null
          created_at?: string | null
          data_referencia?: string
          descricao?: string | null
          estabelecimento_id?: string | null
          forma_pagamento?: string | null
          id?: string
          origem?: string | null
          sheets_row_id?: string | null
          sincronizado_sheets?: boolean | null
          tipo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_caixa_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_caixa_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_financeiras: {
        Row: {
          categoria_id: number | null
          compromisso_id: string | null
          conta_id: string
          created_at: string
          data_referencia: string
          deleted_at: string | null
          descricao: string | null
          estabelecimento_id: string
          fatura_id: string | null
          id: string
          natureza: Database["public"]["Enums"]["movimento_natureza"]
          origem: string
          tipo: Database["public"]["Enums"]["movimento_tipo"]
          transferencia_id: string | null
          updated_at: string
          valor_centavos: number
        }
        Insert: {
          categoria_id?: number | null
          compromisso_id?: string | null
          conta_id: string
          created_at?: string
          data_referencia?: string
          deleted_at?: string | null
          descricao?: string | null
          estabelecimento_id: string
          fatura_id?: string | null
          id?: string
          natureza?: Database["public"]["Enums"]["movimento_natureza"]
          origem?: string
          tipo: Database["public"]["Enums"]["movimento_tipo"]
          transferencia_id?: string | null
          updated_at?: string
          valor_centavos: number
        }
        Update: {
          categoria_id?: number | null
          compromisso_id?: string | null
          conta_id?: string
          created_at?: string
          data_referencia?: string
          deleted_at?: string | null
          descricao?: string | null
          estabelecimento_id?: string
          fatura_id?: string | null
          id?: string
          natureza?: Database["public"]["Enums"]["movimento_natureza"]
          origem?: string
          tipo?: Database["public"]["Enums"]["movimento_tipo"]
          transferencia_id?: string | null
          updated_at?: string
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_financeiras_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_financeiras_compromisso_id_fkey"
            columns: ["compromisso_id"]
            isOneToOne: false
            referencedRelation: "compromissos_financeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_financeiras_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_financeiras_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "v_saldos_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_financeiras_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_financeiras_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas_cartao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_financeiras_transferencia_id_fkey"
            columns: ["transferencia_id"]
            isOneToOne: false
            referencedRelation: "transferencias"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_reservas: {
        Row: {
          contraparte_reserva_id: string | null
          created_at: string
          data_referencia: string
          descricao: string | null
          estabelecimento_id: string
          id: string
          reserva_id: string
          tipo: Database["public"]["Enums"]["reserva_mov_tipo"]
          valor_centavos: number
        }
        Insert: {
          contraparte_reserva_id?: string | null
          created_at?: string
          data_referencia?: string
          descricao?: string | null
          estabelecimento_id: string
          id?: string
          reserva_id: string
          tipo: Database["public"]["Enums"]["reserva_mov_tipo"]
          valor_centavos: number
        }
        Update: {
          contraparte_reserva_id?: string | null
          created_at?: string
          data_referencia?: string
          descricao?: string | null
          estabelecimento_id?: string
          id?: string
          reserva_id?: string
          tipo?: Database["public"]["Enums"]["reserva_mov_tipo"]
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_reservas_contraparte_reserva_id_fkey"
            columns: ["contraparte_reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_reservas_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_reservas_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas_financeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos_compromissos: {
        Row: {
          compromisso_id: string
          created_at: string
          data_pagamento: string
          descricao: string | null
          estabelecimento_id: string
          id: string
          movimentacao_id: string | null
          valor_centavos: number
        }
        Insert: {
          compromisso_id: string
          created_at?: string
          data_pagamento?: string
          descricao?: string | null
          estabelecimento_id: string
          id?: string
          movimentacao_id?: string | null
          valor_centavos: number
        }
        Update: {
          compromisso_id?: string
          created_at?: string
          data_pagamento?: string
          descricao?: string | null
          estabelecimento_id?: string
          id?: string
          movimentacao_id?: string | null
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_compromissos_compromisso_id_fkey"
            columns: ["compromisso_id"]
            isOneToOne: false
            referencedRelation: "compromissos_financeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_compromissos_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_compromissos_movimentacao_id_fkey"
            columns: ["movimentacao_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes_financeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas_financeiras: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          estabelecimento_id: string
          finalidade: string | null
          id: string
          meta_centavos: number | null
          nome: string
          prioridade: number
          updated_at: string
          valor_atual_centavos: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          estabelecimento_id: string
          finalidade?: string | null
          id?: string
          meta_centavos?: number | null
          nome: string
          prioridade?: number
          updated_at?: string
          valor_atual_centavos?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          estabelecimento_id?: string
          finalidade?: string | null
          id?: string
          meta_centavos?: number | null
          nome?: string
          prioridade?: number
          updated_at?: string
          valor_atual_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservas_financeiras_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      transferencias: {
        Row: {
          conta_destino_id: string
          conta_origem_id: string
          created_at: string
          data_referencia: string
          deleted_at: string | null
          descricao: string | null
          estabelecimento_id: string
          id: string
          valor_centavos: number
        }
        Insert: {
          conta_destino_id: string
          conta_origem_id: string
          created_at?: string
          data_referencia?: string
          deleted_at?: string | null
          descricao?: string | null
          estabelecimento_id: string
          id?: string
          valor_centavos: number
        }
        Update: {
          conta_destino_id?: string
          conta_origem_id?: string
          created_at?: string
          data_referencia?: string
          deleted_at?: string | null
          descricao?: string | null
          estabelecimento_id?: string
          id?: string
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "transferencias_conta_destino_id_fkey"
            columns: ["conta_destino_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_conta_destino_id_fkey"
            columns: ["conta_destino_id"]
            isOneToOne: false
            referencedRelation: "v_saldos_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_conta_origem_id_fkey"
            columns: ["conta_origem_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_conta_origem_id_fkey"
            columns: ["conta_origem_id"]
            isOneToOne: false
            referencedRelation: "v_saldos_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_saldos_contas: {
        Row: {
          ativo: boolean | null
          estabelecimento_id: string | null
          id: string | null
          nome: string | null
          saldo_atual_centavos: number | null
          tipo: Database["public"]["Enums"]["conta_tipo"] | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_financeiras_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      view_resumo_diario: {
        Row: {
          contingencia_dia: number | null
          custo_mercadoria_dia: number | null
          custos_fixos_dia: number | null
          data_referencia: string | null
          faturamento_dia: number | null
          lucro_bruto_dia: number | null
          lucro_liquido_dia: number | null
          reinvestimento_dia: number | null
          reserva_dia: number | null
          saidas_registradas_dia: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      aportar_reserva: {
        Args: {
          p_data_referencia?: string
          p_descricao?: string
          p_estabelecimento_id: string
          p_reserva_id: string
          p_valor_centavos: number
        }
        Returns: undefined
      }
      criar_transferencia: {
        Args: {
          p_conta_destino_id: string
          p_conta_origem_id: string
          p_data_referencia?: string
          p_descricao?: string
          p_estabelecimento_id: string
          p_valor_centavos: number
        }
        Returns: string
      }
      pagar_fatura: {
        Args: {
          p_conta_id: string
          p_data_referencia?: string
          p_descricao?: string
          p_estabelecimento_id: string
          p_fatura_id: string
          p_valor_centavos: number
        }
        Returns: undefined
      }
      retirar_reserva: {
        Args: {
          p_data_referencia?: string
          p_descricao?: string
          p_estabelecimento_id: string
          p_reserva_id: string
          p_valor_centavos: number
        }
        Returns: undefined
      }
      transferir_entre_reservas: {
        Args: {
          p_data_referencia?: string
          p_descricao?: string
          p_estabelecimento_id: string
          p_reserva_destino_id: string
          p_reserva_origem_id: string
          p_valor_centavos: number
        }
        Returns: undefined
      }
    }
    Enums: {
      compromisso_periodicidade: "UNICO" | "SEMANAL" | "MENSAL" | "ANUAL"
      compromisso_status:
        | "PENDENTE"
        | "PARCIALMENTE_RESERVADO"
        | "RESERVADO"
        | "PAGO"
        | "VENCIDO"
      conta_tipo: "CAIXA_FISICO" | "MAQUININHA" | "BANCO"
      fatura_status:
        | "ABERTA"
        | "FECHADA"
        | "PARCIALMENTE_PAGA"
        | "PAGA"
        | "VENCIDA"
      movimento_natureza:
        | "OPERACIONAL"
        | "TRANSFERENCIA"
        | "LIQUIDACAO_FATURA"
        | "LIQUIDACAO_COMPROMISSO"
        | "SALDO_INICIAL"
      movimento_tipo: "ENTRADA" | "SAIDA"
      reserva_mov_tipo:
        | "APORTE"
        | "RETIRADA"
        | "TRANSFERENCIA_ENTRADA"
        | "TRANSFERENCIA_SAIDA"
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
    Enums: {
      compromisso_periodicidade: ["UNICO", "SEMANAL", "MENSAL", "ANUAL"],
      compromisso_status: [
        "PENDENTE",
        "PARCIALMENTE_RESERVADO",
        "RESERVADO",
        "PAGO",
        "VENCIDO",
      ],
      conta_tipo: ["CAIXA_FISICO", "MAQUININHA", "BANCO"],
      fatura_status: [
        "ABERTA",
        "FECHADA",
        "PARCIALMENTE_PAGA",
        "PAGA",
        "VENCIDA",
      ],
      movimento_natureza: [
        "OPERACIONAL",
        "TRANSFERENCIA",
        "LIQUIDACAO_FATURA",
        "LIQUIDACAO_COMPROMISSO",
        "SALDO_INICIAL",
      ],
      movimento_tipo: ["ENTRADA", "SAIDA"],
      reserva_mov_tipo: [
        "APORTE",
        "RETIRADA",
        "TRANSFERENCIA_ENTRADA",
        "TRANSFERENCIA_SAIDA",
      ],
    },
  },
} as const
