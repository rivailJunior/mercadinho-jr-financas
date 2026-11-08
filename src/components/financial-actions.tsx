"use client";

import {
  aportarReserva,
  criarTransferencia,
  pagarFatura,
  registrarMovimento,
} from "@/app/actions/financeiro";
import { CurrencyInput } from "@/components/currency-input";
import { Toast, type ToastMessage } from "@/components/toast";
import type { Conta, Fatura, Reserva } from "@/lib/finance";
import { formatCents, reaisToCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, CheckCircle, CreditCard, PiggyBank, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Acao = "movimento" | "transferencia" | "reserva" | "fatura";

const ACOES: { id: Acao; label: string; icon: typeof Receipt }[] = [
  { id: "movimento", label: "Movimento", icon: Receipt },
  { id: "transferencia", label: "Transferir", icon: ArrowLeftRight },
  { id: "reserva", label: "Reserva", icon: PiggyBank },
  { id: "fatura", label: "Fatura", icon: CreditCard },
];

interface FinancialActionsProps {
  contas: (Conta & { saldoAtual: number })[];
  reservas: Reserva[];
  faturas: Fatura[];
}

const selectClass =
  "w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <span className="block text-xs font-bold uppercase tracking-wide text-slate-600">{label}</span>
    {children}
  </div>
);

export const FinancialActions = ({ contas, reservas, faturas }: FinancialActionsProps) => {
  const router = useRouter();
  const [acao, setAcao] = useState<Acao>("movimento");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<(ToastMessage & { id: number }) | null>(null);

  // shared form state
  const [valor, setValor] = useState(0); // reais
  const [descricao, setDescricao] = useState("");
  const [contaId, setContaId] = useState(contas[0]?.id ?? "");
  const [tipo, setTipo] = useState<"ENTRADA" | "SAIDA">("ENTRADA");
  const [destinoId, setDestinoId] = useState(contas[1]?.id ?? "");
  const [reservaId, setReservaId] = useState(reservas[0]?.id ?? "");
  const [faturaId, setFaturaId] = useState(faturas[0]?.id ?? "");

  const centavos = reaisToCents(valor);

  const run = useCallback(
    async (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => {
      setIsSaving(true);
      try {
        const result = await fn();
        if (result.ok) {
          setValor(0);
          setDescricao("");
          setToast({ id: Date.now(), variant: "success", message: okMsg });
          router.refresh();
        } else {
          setToast({ id: Date.now(), variant: "error", message: `Erro: ${result.error}` });
        }
      } finally {
        setIsSaving(false);
      }
    },
    [router],
  );

  const handleSubmit = () => {
    if (centavos <= 0) {
      setToast({ id: Date.now(), variant: "error", message: "Informe um valor maior que zero." });
      return;
    }
    if (acao === "movimento") {
      if (!contaId)
        return setToast({ id: Date.now(), variant: "error", message: "Escolha a conta." });
      run(
        () => registrarMovimento({ contaId, tipo, valorCentavos: centavos, descricao }),
        tipo === "ENTRADA" ? "Entrada registrada!" : "Saída registrada!",
      );
    } else if (acao === "transferencia") {
      run(
        () =>
          criarTransferencia({
            contaOrigemId: contaId,
            contaDestinoId: destinoId,
            valorCentavos: centavos,
            descricao,
          }),
        "Transferência feita!",
      );
    } else if (acao === "reserva") {
      if (!reservaId)
        return setToast({ id: Date.now(), variant: "error", message: "Escolha a reserva." });
      run(
        () => aportarReserva({ reservaId, valorCentavos: centavos, descricao }),
        "Guardado na reserva!",
      );
    } else {
      if (!faturaId || !contaId)
        return setToast({
          id: Date.now(),
          variant: "error",
          message: "Escolha a fatura e a conta.",
        });
      run(
        () => pagarFatura({ faturaId, contaId, valorCentavos: centavos, descricao }),
        "Fatura paga!",
      );
    }
  };

  return (
    <section
      className="rounded-3xl border border-indigo-50/50 bg-white p-5 shadow-soft"
      aria-labelledby="acoes-title"
    >
      {toast && <Toast key={toast.id} toast={toast} onDismiss={() => setToast(null)} />}

      <div className="mb-4 flex items-center justify-between">
        <h2 id="acoes-title" className="text-base font-bold text-slate-700">
          Ações financeiras
        </h2>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-1.5 rounded-2xl bg-slate-100 p-1">
        {ACOES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAcao(id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition-all",
              acao === id ? "bg-white font-extrabold text-indigo-600 shadow-sm" : "text-slate-500",
            )}
            aria-pressed={acao === id}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {acao === "movimento" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo("ENTRADA")}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-xs font-bold",
                  tipo === "ENTRADA" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500",
                )}
              >
                Entrada (+)
              </button>
              <button
                type="button"
                onClick={() => setTipo("SAIDA")}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-xs font-bold",
                  tipo === "SAIDA" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-500",
                )}
              >
                Saída (-)
              </button>
            </div>
            <Field label="Conta">
              <select
                value={contaId}
                onChange={(e) => setContaId(e.target.value)}
                className={selectClass}
              >
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} · {formatCents(c.saldoAtual)}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        {acao === "transferencia" && (
          <>
            <Field label="De (origem)">
              <select
                value={contaId}
                onChange={(e) => setContaId(e.target.value)}
                className={selectClass}
              >
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} · {formatCents(c.saldoAtual)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Para (destino)">
              <select
                value={destinoId}
                onChange={(e) => setDestinoId(e.target.value)}
                className={selectClass}
              >
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} · {formatCents(c.saldoAtual)}
                  </option>
                ))}
              </select>
            </Field>
            <p className="text-[11px] text-slate-400">
              Transferência não muda o saldo consolidado — só move o dinheiro de lugar.
            </p>
          </>
        )}

        {acao === "reserva" && (
          <Field label="Reserva">
            <select
              value={reservaId}
              onChange={(e) => setReservaId(e.target.value)}
              className={selectClass}
            >
              {reservas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome} · {formatCents(r.valorAtual)}
                </option>
              ))}
            </select>
          </Field>
        )}

        {acao === "fatura" && (
          <>
            <Field label="Fatura">
              <select
                value={faturaId}
                onChange={(e) => setFaturaId(e.target.value)}
                className={selectClass}
              >
                {faturas.length === 0 && <option value="">Nenhuma fatura aberta</option>}
                {faturas.map((f) => (
                  <option key={f.id} value={f.id}>
                    Vence {f.vencimento} · {f.status}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Pagar a partir de">
              <select
                value={contaId}
                onChange={(e) => setContaId(e.target.value)}
                className={selectClass}
              >
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} · {formatCents(c.saldoAtual)}
                  </option>
                ))}
              </select>
            </Field>
            <p className="text-[11px] text-slate-400">
              Pagar a fatura liquida a obrigação — não conta de novo como despesa.
            </p>
          </>
        )}

        <CurrencyInput id="valor-acao" label="Valor" value={valor} onChange={setValor} />

        <div className="space-y-1.5">
          <span className="block text-xs font-bold uppercase tracking-wide text-slate-600">
            Descrição (opcional)
          </span>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: venda do dia, depósito, pagamento"
            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-indigo-500 to-violet-500 px-6 py-4 text-base font-extrabold text-white shadow-button-tap transition-all duration-150 hover:from-indigo-600 hover:to-violet-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle className="h-5 w-5" />
          {isSaving ? "Salvando..." : "Confirmar"}
        </button>
      </div>
    </section>
  );
};
