"use client";

import {
  aportarReserva,
  criarTransferencia,
  pagarCompromisso,
  pagarFatura,
} from "@/app/actions/financeiro";
import { CurrencyInput } from "@/components/currency-input";
import { SelectField } from "@/components/select-field";
import { Toast, type ToastMessage } from "@/components/toast";
import type { Compromisso, Conta, Fatura, Reserva } from "@/lib/finance";
import { formatCents, reaisToCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, CheckCircle, ChevronDown, PiggyBank, ReceiptText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

type Acao = "transferencia" | "reserva" | "pagar";

const ACOES: { id: Acao; label: string; icon: typeof ArrowLeftRight }[] = [
  { id: "transferencia", label: "Transferir", icon: ArrowLeftRight },
  { id: "reserva", label: "Reserva", icon: PiggyBank },
  { id: "pagar", label: "Pagar conta", icon: ReceiptText },
];

/** A payable obligation — a card invoice or a monthly fixed commitment. */
interface Obrigacao {
  key: string;
  kind: "fatura" | "compromisso";
  id: string;
  label: string;
  pendente: number;
}

interface FinancialActionsProps {
  contas: (Conta & { saldoAtual: number })[];
  reservas: Reserva[];
  faturas: Fatura[];
  compromissos: Compromisso[];
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <span className="block text-xs font-bold uppercase tracking-wide text-slate-600">{label}</span>
    {children}
  </div>
);

export const FinancialActions = ({
  contas,
  reservas,
  faturas,
  compromissos,
}: FinancialActionsProps) => {
  const router = useRouter();
  const [acao, setAcao] = useState<Acao>("transferencia");
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<(ToastMessage & { id: number }) | null>(null);

  // shared form state
  const [valor, setValor] = useState(0); // reais
  const [descricao, setDescricao] = useState("");
  const [contaId, setContaId] = useState(contas[0]?.id ?? "");
  const [destinoId, setDestinoId] = useState(contas[1]?.id ?? "");
  const [reservaId, setReservaId] = useState(reservas[0]?.id ?? "");
  const [obrigacaoKey, setObrigacaoKey] = useState("");

  const obrigacoes = useMemo<Obrigacao[]>(() => {
    const list: Obrigacao[] = [];
    for (const f of faturas) {
      if (f.status === "PAGA" || f.status === "VENCIDA") continue;
      const pendente = (f.valorFechado ?? f.valorAtual) - f.valorPago;
      if (pendente <= 0) continue;
      list.push({
        key: `fatura:${f.id}`,
        kind: "fatura",
        id: f.id,
        label: `Fatura do cartão · vence ${f.vencimento} · falta ${formatCents(pendente)}`,
        pendente,
      });
    }
    for (const c of compromissos) {
      if (c.status === "PAGO") continue;
      const pendente = (c.valorEfetivo ?? c.valorPrevisto) - c.valorPago;
      if (pendente <= 0) continue;
      list.push({
        key: `comp:${c.id}`,
        kind: "compromisso",
        id: c.id,
        label: `${c.nome} · falta ${formatCents(pendente)}`,
        pendente,
      });
    }
    return list;
  }, [faturas, compromissos]);

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
    if (acao === "transferencia") {
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
      const selecionada = obrigacoes.find((o) => o.key === obrigacaoKey);
      if (!selecionada || !contaId)
        return setToast({
          id: Date.now(),
          variant: "error",
          message: "Escolha a conta a pagar e a conta de origem.",
        });
      run(
        selecionada.kind === "fatura"
          ? () =>
              pagarFatura({ faturaId: selecionada.id, contaId, valorCentavos: centavos, descricao })
          : () =>
              pagarCompromisso({
                compromissoId: selecionada.id,
                contaId,
                valorCentavos: centavos,
                descricao,
              }),
        "Pagamento registrado!",
      );
    }
  };

  return (
    <section
      className="rounded-3xl border border-indigo-50/50 bg-white p-5 shadow-soft"
      aria-labelledby="acoes-title"
    >
      {toast && <Toast key={toast.id} toast={toast} onDismiss={() => setToast(null)} />}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn("flex w-full items-center justify-between", open && "mb-4")}
      >
        <h2 id="acoes-title" className="text-base font-bold text-slate-700">
          Ações financeiras
        </h2>
        <span className="flex items-center gap-1 text-xs font-bold text-indigo-600">
          {open ? "Fechar" : "Registrar operação"}
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </span>
      </button>

      {open && (
        <>
          <div className="mb-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1">
            {ACOES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setAcao(id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition-all",
                  acao === id
                    ? "bg-white font-extrabold text-indigo-600 shadow-sm"
                    : "text-slate-500",
                )}
                aria-pressed={acao === id}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {acao === "transferencia" && (
              <>
                <Field label="De (origem)">
                  <SelectField
                    value={contaId}
                    onChange={setContaId}
                    ariaLabel="Conta de origem"
                    options={contas.map((c) => ({
                      value: c.id,
                      label: `${c.nome} · ${formatCents(c.saldoAtual)}`,
                    }))}
                  />
                </Field>
                <Field label="Para (destino)">
                  <SelectField
                    value={destinoId}
                    onChange={setDestinoId}
                    ariaLabel="Conta de destino"
                    options={contas.map((c) => ({
                      value: c.id,
                      label: `${c.nome} · ${formatCents(c.saldoAtual)}`,
                    }))}
                  />
                </Field>
                <p className="text-[11px] text-slate-400">
                  Transferência não muda o saldo consolidado — só move o dinheiro de lugar.
                </p>
              </>
            )}

            {acao === "reserva" && (
              <Field label="Reserva">
                <SelectField
                  value={reservaId}
                  onChange={setReservaId}
                  ariaLabel="Reserva"
                  options={reservas.map((r) => ({
                    value: r.id,
                    label: `${r.nome} · ${formatCents(r.valorAtual)}`,
                  }))}
                />
              </Field>
            )}

            {acao === "pagar" && (
              <>
                <Field label="O que está sendo pago?">
                  <SelectField
                    value={obrigacaoKey}
                    onChange={setObrigacaoKey}
                    ariaLabel="Obrigação a pagar"
                    placeholder="Escolha…"
                    options={obrigacoes.map((o) => ({ value: o.key, label: o.label }))}
                  />
                </Field>
                <Field label="Pagar a partir de">
                  <SelectField
                    value={contaId}
                    onChange={setContaId}
                    ariaLabel="Conta de origem do pagamento"
                    options={contas.map((c) => ({
                      value: c.id,
                      label: `${c.nome} · ${formatCents(c.saldoAtual)}`,
                    }))}
                  />
                </Field>
                <p className="text-[11px] text-slate-400">
                  O pagamento baixa a obrigação e consome o que estiver guardado na reserva — não
                  conta de novo como despesa.
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
        </>
      )}
    </section>
  );
};
