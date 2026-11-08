import { provisaoDiaria } from "@/lib/finance";

describe("provisaoDiaria — quanto guardar hoje pras contas fixas", () => {
  const base = {
    faltaCartao: 150_000,
    diasAteFatura: 12,
    faltaCompromissos: 330_000,
    diasAteFimMes: 22,
    lucroDia: 56_000,
    jaGuardouHoje: false,
    saldoLivre: 500_000,
  };

  it("ritmo = falta ÷ dias restantes, por bucket", () => {
    const r = provisaoDiaria(base);
    expect(r.ritmoCartao).toBe(12_500); // 1500/dia
    expect(r.ritmoCompromissos).toBe(15_000); // 3300/22
    expect(r.ritmoTotal).toBe(27_500);
  });

  it("guarda 85% do lucro do dia e deixa 15% no caixa", () => {
    const r = provisaoDiaria(base);
    // 560 × 85% = 476 pras fixas; 84 ficam no caixa
    expect(r.disponivel).toBe(56_000);
    expect(r.sugerido).toBe(47_600);
    expect(r.sugeridoCartao).toBe(47_600); // cartão primeiro
    expect(r.sugeridoCompromissos).toBe(0);
    expect(r.sobraCaixa).toBe(8_400);
  });

  it("transborda pras outras contas quando o cartão está quase coberto", () => {
    const r = provisaoDiaria({ ...base, faltaCartao: 20_000 });
    expect(r.sugerido).toBe(47_600);
    expect(r.sugeridoCartao).toBe(20_000);
    expect(r.sugeridoCompromissos).toBe(27_600);
  });

  it("limita pela falta total — o excedente fica no caixa", () => {
    const r = provisaoDiaria({ ...base, faltaCartao: 10_000, faltaCompromissos: 20_000 });
    expect(r.sugerido).toBe(30_000); // 85% de 560 = 476, mas só faltam 300
    expect(r.sobraCaixa).toBe(26_000);
  });

  it("limita pelo saldo livre — nunca reserva dinheiro que não existe", () => {
    const r = provisaoDiaria({ ...base, saldoLivre: 30_000 });
    expect(r.sugerido).toBe(30_000);
    expect(r.sobraCaixa).toBe(26_000);
  });

  it("sugere R$ 0 quando o dia não teve sobra", () => {
    for (const lucroDia of [0, -15_000]) {
      const r = provisaoDiaria({ ...base, lucroDia });
      expect(r.disponivel).toBe(0);
      expect(r.sugerido).toBe(0);
      expect(r.sobraCaixa).toBe(0);
    }
  });

  it("bloqueia quando o aporte do dia já foi feito", () => {
    const r = provisaoDiaria({ ...base, jaGuardouHoje: true });
    expect(r.sugerido).toBe(0);
    expect(r.sobraCaixa).toBe(56_000); // lucro segue no caixa
  });

  it("sugere R$ 0 quando nada falta", () => {
    const r = provisaoDiaria({ ...base, faltaCartao: 0, faltaCompromissos: 0 });
    expect(r.sugerido).toBe(0);
  });

  it("prazo vencido é tratado como 1 dia (nunca divide por zero)", () => {
    const r = provisaoDiaria({ ...base, diasAteFatura: 0, diasAteFimMes: -3 });
    expect(r.ritmoCartao).toBe(150_000);
    expect(r.ritmoCompromissos).toBe(330_000);
  });
});
