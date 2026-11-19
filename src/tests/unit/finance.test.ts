import {
  type Compromisso,
  type Conta,
  type Movimento,
  type Reserva,
  faltaReservar,
  posicaoFinanceira,
  saldoConsolidado,
  saldoConta,
  transferenciaParaMovimentos,
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
