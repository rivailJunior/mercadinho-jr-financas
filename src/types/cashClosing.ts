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

export interface WeeklyDay {
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
