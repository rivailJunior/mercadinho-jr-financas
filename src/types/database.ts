export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      categorias: {
        Row: {
          ativo: boolean | null;
          descricao: string | null;
          id: number;
          nome: string;
          tipo: string;
        };
        Insert: {
          ativo?: boolean | null;
          descricao?: string | null;
          id?: number;
          nome: string;
          tipo: string;
        };
        Update: {
          ativo?: boolean | null;
          descricao?: string | null;
          id?: number;
          nome?: string;
          tipo?: string;
        };
        Relationships: [];
      };
      config_financeira: {
        Row: {
          created_at: string | null;
          estabelecimento_id: string | null;
          id: number;
          margem_bruta_pct: number;
          split_contingencia_pct: number;
          split_reinvestimento_pct: number;
          split_reserva_pct: number;
        };
        Insert: {
          created_at?: string | null;
          estabelecimento_id?: string | null;
          id?: number;
          margem_bruta_pct?: number;
          split_contingencia_pct?: number;
          split_reinvestimento_pct?: number;
          split_reserva_pct?: number;
        };
        Update: {
          created_at?: string | null;
          estabelecimento_id?: string | null;
          id?: number;
          margem_bruta_pct?: number;
          split_contingencia_pct?: number;
          split_reinvestimento_pct?: number;
          split_reserva_pct?: number;
        };
        Relationships: [
          {
            foreignKeyName: "config_financeira_estabelecimento_id_fkey";
            columns: ["estabelecimento_id"];
            isOneToOne: false;
            referencedRelation: "estabelecimentos";
            referencedColumns: ["id"];
          },
        ];
      };
      custos_fixos_config: {
        Row: {
          ativo: boolean | null;
          estabelecimento_id: string | null;
          id: number;
          mes_ano_vigencia: string;
          nome: string;
          percentual_sugerido: number | null;
          tipo_custo: string;
          valor_mensal: number | null;
        };
        Insert: {
          ativo?: boolean | null;
          estabelecimento_id?: string | null;
          id?: number;
          mes_ano_vigencia: string;
          nome: string;
          percentual_sugerido?: number | null;
          tipo_custo: string;
          valor_mensal?: number | null;
        };
        Update: {
          ativo?: boolean | null;
          estabelecimento_id?: string | null;
          id?: number;
          mes_ano_vigencia?: string;
          nome?: string;
          percentual_sugerido?: number | null;
          tipo_custo?: string;
          valor_mensal?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "custos_fixos_config_estabelecimento_id_fkey";
            columns: ["estabelecimento_id"];
            isOneToOne: false;
            referencedRelation: "estabelecimentos";
            referencedColumns: ["id"];
          },
        ];
      };
      estabelecimentos: {
        Row: {
          created_at: string | null;
          dias_uteis_mes_padrao: number | null;
          id: string;
          nome: string;
        };
        Insert: {
          created_at?: string | null;
          dias_uteis_mes_padrao?: number | null;
          id?: string;
          nome?: string;
        };
        Update: {
          created_at?: string | null;
          dias_uteis_mes_padrao?: number | null;
          id?: string;
          nome?: string;
        };
        Relationships: [];
      };
      lancamentos_caixa: {
        Row: {
          categoria_id: number | null;
          created_at: string | null;
          data_referencia: string;
          descricao: string | null;
          estabelecimento_id: string | null;
          forma_pagamento: string | null;
          id: string;
          origem: string | null;
          sheets_row_id: string | null;
          sincronizado_sheets: boolean | null;
          tipo: string;
          updated_at: string | null;
          valor: number;
        };
        Insert: {
          categoria_id?: number | null;
          created_at?: string | null;
          data_referencia: string;
          descricao?: string | null;
          estabelecimento_id?: string | null;
          forma_pagamento?: string | null;
          id?: string;
          origem?: string | null;
          sheets_row_id?: string | null;
          sincronizado_sheets?: boolean | null;
          tipo: string;
          updated_at?: string | null;
          valor: number;
        };
        Update: {
          categoria_id?: number | null;
          created_at?: string | null;
          data_referencia?: string;
          descricao?: string | null;
          estabelecimento_id?: string | null;
          forma_pagamento?: string | null;
          id?: string;
          origem?: string | null;
          sheets_row_id?: string | null;
          sincronizado_sheets?: boolean | null;
          tipo?: string;
          updated_at?: string | null;
          valor?: number;
        };
        Relationships: [
          {
            foreignKeyName: "lancamentos_caixa_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lancamentos_caixa_estabelecimento_id_fkey";
            columns: ["estabelecimento_id"];
            isOneToOne: false;
            referencedRelation: "estabelecimentos";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      view_resumo_diario: {
        Row: {
          contingencia_dia: number | null;
          custo_mercadoria_dia: number | null;
          custos_fixos_dia: number | null;
          data_referencia: string | null;
          faturamento_dia: number | null;
          lucro_bruto_dia: number | null;
          lucro_liquido_dia: number | null;
          reinvestimento_dia: number | null;
          reserva_dia: number | null;
          saidas_registradas_dia: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
