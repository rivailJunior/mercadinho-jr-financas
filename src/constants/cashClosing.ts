import type { FixedExpense, WeeklyDay } from "@/types/cashClosing";

export const WEEKLY_DATA: WeeklyDay[] = [
  { dia: "Segunda", diaAbreviado: "Seg", valor: 2800 },
  { dia: "Terça", diaAbreviado: "Ter", valor: 3100 },
  { dia: "Quarta", diaAbreviado: "Qua", valor: 2450 },
  { dia: "Quinta", diaAbreviado: "Qui", valor: 3250 },
  { dia: "Sexta", diaAbreviado: "Sex", valor: 3800 },
  { dia: "Sábado", diaAbreviado: "Sáb", valor: 4200 },
  { dia: "Domingo", diaAbreviado: "Dom", valor: 1900 },
];

export const FIXED_EXPENSES: FixedExpense[] = [
  { nome: "Aluguel", valorMensal: 2500, reservaDiaria: 83.33 },
  { nome: "Energia", valorMensal: 800, reservaDiaria: 26.67 },
  { nome: "Água", valorMensal: 150, reservaDiaria: 5.0 },
  { nome: "Internet", valorMensal: 120, reservaDiaria: 4.0 },
  { nome: "Contador", valorMensal: 350, reservaDiaria: 11.67 },
  { nome: "INSS / DAS", valorMensal: 350, reservaDiaria: 11.67 },
  { nome: "Outros fixos", valorMensal: 660, reservaDiaria: 22.0 },
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
