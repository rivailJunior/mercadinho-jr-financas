import {
  type Compromisso,
  type Conta,
  type Fatura,
  type Movimento,
  type Reserva,
  faltaReservar,
  faltaReservarFatura,
  pagarFatura,
  posicaoFinanceira,
  recomendarAlocacao,
  saldoConsolidado,
  saldoConta,
  transferenciaParaMovimentos,
  transportarReserva,
} from "@/lib/finance";
import { reaisToCents } from "@/lib/money";

const R = reaisToCents; // reais -> cents helper for readable fixtures

const conta = (id: string, saldoInicial: number, tipo: Conta["tipo"] = "CAIXA_FISICO"): Conta => ({
  id,
  nome: id,
  tipo,
  saldoInicial: R(saldoInicial),
  ativo: true,
});

describe("Cenário A — saldo operacional", () => {
  test("saldo final = inicial + entradas - saídas", () => {
    const c = conta("caixa", 2500);
    const movs: Movimento[] = [
      { contaId: "caixa", tipo: "ENTRADA", valor: R(1000) },
      { contaId: "caixa", tipo: "SAIDA", valor: R(1500) },
    ];
    expect(saldoConta(c, movs)).toBe(R(2000));
  });
});

describe("Cenário B — reservas iniciais", () => {
  test("saldo livre inicial é zero quando tudo está reservado (sem nova entrada)", () => {
    // Os R$ 12.213 já existem no caixa; não se cria uma nova entrada de 12.213.
    const contas = [conta("caixa", 7213), conta("maquininha", 5000, "MAQUININHA")];
    const reservas: Reserva[] = [
      {
        id: "cartao",
        nome: "Fatura do cartão",
        valorAtual: R(10000),
        meta: R(20000),
        prioridade: 1,
      },
      { id: "compromissos", nome: "Demais compromissos", valorAtual: R(2213), prioridade: 2 },
    ];
    const pos = posicaoFinanceira(contas, [], reservas);
    expect(pos.saldoConsolidado).toBe(R(12213));
    expect(pos.totalReservado).toBe(R(12213));
    expect(pos.saldoLivre).toBe(0);
  });
});

describe("Cenário C — fatura do cartão", () => {
  test("necessidade adicional = valor devido - reservado", () => {
    const fatura: Fatura = {
      id: "f1",
      fechamento: "2026-01-10",
      vencimento: "2026-01-20",
      valorAtual: R(15000),
      valorFechado: R(15000),
      valorReservado: R(10000),
      valorPago: 0,
      status: "FECHADA",
    };
    expect(faltaReservarFatura(fatura)).toBe(R(5000));
  });
});

describe("Cenário D — pagamento da fatura sem dupla despesa", () => {
  test("pagar a fatura liquida a obrigação e não gera nova despesa operacional", () => {
    const fatura: Fatura = {
      id: "f1",
      fechamento: "2026-01-10",
      vencimento: "2026-01-20",
      valorAtual: R(15000),
      valorFechado: R(15000),
      valorReservado: R(15000),
      valorPago: 0,
      status: "FECHADA",
    };
    const paga = pagarFatura(fatura, R(15000));
    expect(paga.status).toBe("PAGA");
    expect(paga.valorPago).toBe(R(15000));
    // A liquidação consome a reserva, mas as compras já eram a despesa:
    // nenhuma SAIDA operacional adicional é criada por esta função.
    expect(paga.valorReservado).toBe(0);
  });
});

describe("Cenário E — transferência interna", () => {
  test("move dinheiro entre contas sem alterar o consolidado", () => {
    const contas = [conta("caixa", 3000), conta("maquininha", 2000, "MAQUININHA")];
    const movs = transferenciaParaMovimentos({
      contaOrigemId: "caixa",
      contaDestinoId: "maquininha",
      valor: R(1000),
    });
    expect(saldoConta(contas[0], movs)).toBe(R(2000));
    expect(saldoConta(contas[1], movs)).toBe(R(3000));
    expect(saldoConsolidado(contas, movs)).toBe(R(5000));
  });
});

describe("Cenário F — dia de baixa receita", () => {
  test("caixa abaixo do mínimo operacional não recomenda alocação", () => {
    const rec = recomendarAlocacao({
      saldoConsolidado: R(1500),
      totalReservado: 0,
      caixaMinimo: R(2500),
      alvos: [{ id: "cartao", nome: "Cartão", falta: R(5000) }],
    });
    expect(rec.abaixoDoMinimo).toBe(true);
    expect(rec.totalRecomendado).toBe(0);
  });
});

describe("Cenário G — dia de receita elevada", () => {
  test("recomenda alocação dinâmica por prioridade até esgotar o disponível", () => {
    const rec = recomendarAlocacao({
      saldoConsolidado: R(20000),
      totalReservado: R(12213),
      caixaMinimo: R(2500),
      alvos: [
        { id: "cartao", nome: "Cartão", falta: R(10000) },
        { id: "emergencia", nome: "Emergência", falta: R(3000) },
      ],
    });
    // disponível = 20000 - 12213 - 2500 = 5287
    expect(rec.totalRecomendado).toBe(R(5287));
    expect(rec.itens[0].recomendado).toBe(R(5287)); // tudo vai para a maior prioridade
    expect(rec.itens[1].recomendado).toBe(0);
    expect(rec.abaixoDaMeta.length).toBe(2);
  });
});

describe("Cenário H — reserva acumulada entre ciclos", () => {
  test("transporta o saldo excedente para o próximo ciclo, sem zerar", () => {
    const anterior: Fatura = {
      id: "f1",
      fechamento: "2026-01-10",
      vencimento: "2026-01-20",
      valorAtual: R(15000),
      valorFechado: R(15000),
      valorReservado: R(5000), // sobra após pagar
      valorPago: R(15000),
      status: "PAGA",
    };
    const nova: Fatura = {
      id: "f2",
      fechamento: "2026-02-10",
      vencimento: "2026-02-20",
      valorAtual: 0,
      valorReservado: 0,
      valorPago: 0,
      status: "ABERTA",
    };
    const transportada = transportarReserva(anterior, nova);
    expect(transportada.valorReservado).toBe(R(5000));
  });
});

describe("Cenário I — prevenção de duplicidade", () => {
  test("o mesmo dinheiro não é contado como livre e reservado ao mesmo tempo", () => {
    const contas = [conta("caixa", 15000)];
    const reservas: Reserva[] = [
      { id: "cartao", nome: "Cartão", valorAtual: R(10000), prioridade: 1 },
      { id: "compromissos", nome: "Compromissos", valorAtual: R(2213), prioridade: 2 },
    ];
    const pos = posicaoFinanceira(contas, [], reservas);
    expect(pos.saldoConsolidado).toBe(R(15000));
    expect(pos.totalReservado).toBe(R(12213));
    expect(pos.saldoLivre).toBe(R(2787));
    // livre + reservado == consolidado (nada contado duas vezes)
    expect(pos.saldoLivre + pos.totalReservado).toBe(pos.saldoConsolidado);
  });

  test("falta reservar de compromisso não subtrai pago em dobro", () => {
    const c: Compromisso = {
      id: "agua",
      nome: "Água",
      valorPrevisto: R(500),
      valorReservado: R(200),
      valorPago: R(100),
      vencimento: "2026-02-10",
      prioridade: 3,
      status: "PARCIALMENTE_RESERVADO",
    };
    // 500 - 200 - 100 = 200 (cada parcela reconhecida uma única vez)
    expect(faltaReservar(c)).toBe(R(200));
  });
});
