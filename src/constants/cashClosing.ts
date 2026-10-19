import type { FixedExpense, WeeklyDay } from "@/types/cashClosing";

export const WEEKLY_DATA: WeeklyDay[] = [
  { dia: 'Segunda', diaAbreviado: 'Seg', valor: 2800, saida: 420 },
  { dia: 'Terça', diaAbreviado: 'Ter', valor: 3100, saida: 580 },
  { dia: 'Quarta', diaAbreviado: 'Qua', valor: 2450, saida: 350 },
  { dia: 'Quinta', diaAbreviado: 'Qui', valor: 3250, saida: 450 },
  { dia: 'Sexta', diaAbreviado: 'Sex', valor: 3800, saida: 720 },
  { dia: 'Sábado', diaAbreviado: 'Sáb', valor: 4200, saida: 890 },
  { dia: 'Domingo', diaAbreviado: 'Dom', valor: 1900, saida: 280 },
];

export const FIXED_EXPENSES: FixedExpense[] = [
  {
    nome: 'Salário dos Pais (Pró-labore)',
    valorMensal: 1200,
    reservaDiaria: 40,
  },
  {
    nome: 'Salário do Ajudante/Funcionário',
    valorMensal: 2160,
    reservaDiaria: 72,
  },
  { nome: 'Conta de Luz & Água', valorMensal: 1080, reservaDiaria: 36 },
  {
    nome: 'Fundo de Emergência / Mercado (10%)',
    valorMensal: 1500,
    reservaDiaria: 50,
  },
];

export const TOTAL_RESERVA_DIARIA = FIXED_EXPENSES.reduce(
  (acc, item) => acc + item.reservaDiaria,
  0,
);

export const WHATSAPP_MESSAGE =
  "Oi filho! Estou fechando o caixa do mercado e fiquei com uma dúvida, pode me ajudar?";

export const WHATSAPP_URL = `https://wa.me/?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export const CURRENCY_LOCALE = "pt-BR";
export const CURRENCY_CODE = "BRL";
