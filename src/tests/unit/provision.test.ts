import { provisaoDiaria } from "@/lib/finance";

describe("provisaoDiaria — quanto guardar hoje pras contas fixas", () => {
  const base = {
    faltaCartao: 150_000,
    diasAteFatura: 12,
    faltaCompromissos: 330_000,
    diasAteFimMes: 22,
    saldoLivre: 500_000,
    caixaMinimo: 250_000,
  };

  it("ritmo = falta ÷ dias restantes, por bucket", () => {
    const r = provisaoDiaria(base);
    expect(r.ritmoCartao).toBe(12_500); // 1500/dia
    expect(r.ritmoCompromissos).toBe(15_000); // 3300/22
    expect(r.ritmoTotal).toBe(27_500);
  });

  it("sugestão = ritmo total quando há disponível", () => {
    const r = provisaoDiaria(base);
    // disponível = 5000 - 2500 = 2500 > ritmo 275
    expect(r.disponivel).toBe(250_000);
    expect(r.sugerido).toBe(27_500);
    expect(r.sugeridoCartao).toBe(12_500);
    expect(r.sugeridoCompromissos).toBe(15_000);
  });

  it("suaviza quando o acumulado está adiantado (falta pequena → ritmo pequeno)", () => {
    const r = provisaoDiaria({ ...base, faltaCartao: 3_000, faltaCompromissos: 4_400 });
    // já quase tudo acumulado: ritmos ficam centavos de reais
    expect(r.ritmoCartao).toBe(250);
    expect(r.ritmoCompromissos).toBe(200);
    expect(r.sugerido).toBe(450);
  });

  it("limita pela disponibilidade e prioriza o cartão (vencimento mais próximo)", () => {
    const r = provisaoDiaria({ ...base, saldoLivre: 260_000 });
    // disponível = 2600 - 2500 = 100 < ritmoTotal 275
    expect(r.disponivel).toBe(10_000);
    expect(r.sugerido).toBe(10_000);
    expect(r.sugeridoCartao).toBe(10_000); // tudo pro cartão
    expect(r.sugeridoCompromissos).toBe(0);
  });

  it("recomenda R$ 0 quando o livre está abaixo do caixa mínimo", () => {
    const r = provisaoDiaria({ ...base, saldoLivre: 200_000 });
    expect(r.disponivel).toBe(0);
    expect(r.sugerido).toBe(0);
  });

  it("recomenda R$ 0 quando nada falta", () => {
    const r = provisaoDiaria({ ...base, faltaCartao: 0, faltaCompromissos: 0 });
    expect(r.sugerido).toBe(0);
  });

  it("prazo vencido é tratado como 1 dia (nunca divide por zero)", () => {
    const r = provisaoDiaria({ ...base, diasAteFatura: 0, diasAteFimMes: -3 });
    expect(r.ritmoCartao).toBe(150_000);
    expect(r.ritmoCompromissos).toBe(330_000);
  });
});
