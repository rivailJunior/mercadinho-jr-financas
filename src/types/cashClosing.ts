export interface CashEntry {
  dinheiroGaveta: number;
  cartao: number;
  pix: number;
}

export interface ExpenseEntry {
  id: string;
  descricao: string;
  valor: number;
}

export interface DailySummary {
  totalEntradas: number;
  totalSaidas: number;
  reservaDiaria: number;
  sobraLimpa: number;
}

export interface YearlySummary {
  totalEntradas: number;
  totalSaidas: number;
}

export interface WeeklyDay {
  dia: string;
  diaAbreviado: string;
  valor: number;
  saida: number;
}

export interface YearlyMonth {
  dia: string;
  diaAbreviado: string;
  valor: number;
  saida: number;
}

export interface FixedExpense {
  nome: string;
  valorMensal: number;
  reservaDiaria: number;
}

export interface RetroactiveEntry {
  data: string;
  dinheiroGaveta: number;
  cartao: number;
  pix: number;
  saidas: number;
}

export type LancamentoTipo = "ENTRADA" | "SAIDA";

export type LancamentoFilter = "all" | LancamentoTipo;

export interface Lancamento {
  id: string;
  tipo: LancamentoTipo;
  descricao: string;
  valor: number;
  /** YYYY-MM-DD */
  dataReferencia: string;
}

export interface MonthlyReportSummary {
  totalEntradas: number;
  totalSaidas: number;
  totalReserva: number;
  livreDeVerdade: number;
}

export interface MonthlyReport {
  /** YYYY-MM */
  mes: string;
  summary: MonthlyReportSummary;
  lancamentos: Lancamento[];
}
