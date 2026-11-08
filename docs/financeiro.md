# Regras financeiras — Mercadinho JR

Documento de referência do modelo financeiro implementado na branch
`feature/financial-management-refactor`. Descreve as invariantes que o sistema
garante e como cada operação é contabilizada.

## Dinheiro em centavos inteiros

- Todos os valores monetários são armazenados e calculados em **centavos
  inteiros** (`bigint` no Postgres, `Cents = number` inteiro em TS).
- A conversão reais ↔ centavos acontece só nas bordas (input/output da UI),
  via `src/lib/money.ts`. Nenhuma operação interna usa `float`.

## Duas dimensões separadas

O dinheiro tem duas classificações independentes:

1. **Onde está** — contas financeiras (`contas_financeiras`):
   Caixa físico, Maquininha, Banco.
2. **Para que serve** — reservas lógicas (`reservas_financeiras`):
   envelopes de destinação (Fatura do cartão, Demais compromissos,
   Emergência, Investimentos).

Invariantes derivadas:

- `saldoConsolidado = Σ saldos das contas` — todo o dinheiro real.
- `totalReservado = Σ valores das reservas` — dinheiro já destinado.
- `saldoLivre = consolidado − reservado` — o mesmo dinheiro **nunca** é
  contado como livre e reservado ao mesmo tempo.

## Fonte única de verdade para saldo

`saldo_atual = saldo_inicial + Σ(ENTRADAS) − Σ(SAÍDAS)`, exposto pela view
`v_saldos_contas`. Saldo nunca é gravado como campo mutável — é sempre
derivado dos movimentos reais (`movimentacoes_financeiras`).

## Reconhecimento vs. liquidação (sem dupla contagem)

Três conceitos distintos:

- **Despesa** — reconhecida na `compras_cartao` quando a compra acontece
  (competência), ou numa movimentação `SAIDA`/`OPERACIONAL` quando o gasto
  sai direto do caixa.
- **Obrigação** — `compromissos_financeiros` (contas a pagar) e
  `faturas_cartao` (ciclo do cartão).
- **Liquidação** — pagamento da obrigação. Gera movimento de caixa com
  natureza `LIQUIDACAO_FATURA` ou `LIQUIDACAO_COMPROMISSO` — nunca uma nova
  despesa.

Pagar a fatura do cartão **não** é despesa: as compras já foram reconhecidas
em `compras_cartao`. O pagamento movimenta dinheiro e baixa a obrigação.

## Operações e efeitos

| Operação                     | Implementação                                              | Efeito no consolidado       |
| ---------------------------- | ---------------------------------------------------------- | --------------------------- |
| Entrada/saída operacional    | insert em `movimentacoes_financeiras`                      | altera                      |
| Transferência entre contas   | RPC `criar_transferencia` (2 movimentos `TRANSFERENCIA`)   | **não altera**              |
| Aporte em reserva            | RPC `aportar_reserva`                                      | **não altera** (só destina) |
| Retirada de reserva          | RPC `retirar_reserva`                                      | **não altera**              |
| Transferência entre reservas | RPC `transferir_entre_reservas`                            | **não altera**              |
| Pagar fatura                 | RPC `pagar_fatura` (movimento `LIQUIDACAO_FATURA` + baixa) | reduz (liquidação)          |

Todas as RPCs validam valor positivo, existência das entidades e saldo
suficiente, executam dentro de uma única transação (erro → rollback total)
e serializam concorrência travando a linha da conta/reserva.

## Reservas não zeram automaticamente

A reserva do cartão **acumula entre ciclos**: pagar a fatura consome
`valor_reservado_centavos` da fatura, mas o excedente fica na reserva para o
próximo ciclo. Nada zera reserva no fim do mês.

## Caixa mínimo operacional

`config_financeira.caixa_minimo_centavos` (atual: R$ 2.500) é a liquidez que
deve sempre sobrar. O algoritmo de alocação nunca recomenda destinar dinheiro
que derrubaria o caixa abaixo do mínimo.

## Algoritmo de alocação dinâmica

`recomendarAlocacao` (função pura em `src/lib/finance/allocation.ts`):

1. `disponivel = consolidado − reservado − caixaMinimo` (floor em 0).
2. Ordena alvos por prioridade; desempata por vencimento mais próximo.
3. Distribui o disponível sequencialmente até cobrir cada `falta`
   (falta = previsto/efetivo − reservado − pago, sem subtrair em dobro).
4. **Recomenda, nunca executa** — a confirmação é sempre do usuário.
5. Caixa abaixo do mínimo ou dia sem sobra → recomenda R$ 0.

## Estado inicial (seed real)

- Caixa físico R$ 1.850 + Maquininha R$ 10.363 = **R$ 12.213 consolidado**.
- Reservas: Fatura do cartão R$ 10.000 (meta R$ 20.000), Demais
  compromissos R$ 2.213, Emergência R$ 0, Investimentos R$ 0 →
  **R$ 12.213 reservado, R$ 0 livre**.
- Os R$ 12.213 foram registrados como `saldo_inicial` das contas —
  **não** como receita nova.
- Compromissos mensais: pró-labore R$ 2.000, água R$ 500, energia R$ 900,
  funcionários R$ 2.200.
- Seed reproduzível: `node scripts/seed-financial-setup.mjs --caixa 1850 --maquininha 10363 --write`.

## Segurança

- **Autenticação**: email+senha via Supabase Auth (`/login`), sessão em
  cookies (`@supabase/ssr`), middleware protege todas as rotas.
- **RLS restritivo aplicado em todas as tabelas** (novas e legadas):
  acesso exige sessão autenticada de usuário vinculado ao estabelecimento
  via `usuarios_estabelecimentos` — verificado por
  `user_manages_estabelecimento()`.
- Views `v_saldos_contas` e `view_resumo_diario` rodam com
  `security_invoker = on` (não contornam o RLS das tabelas base).
- Role `anon` revogada de todas as tabelas/views/RPCs — nada é público.
- Scripts administrativos (`seed`, `import`) autenticam como membro via
  `SUPABASE_USER_EMAIL` / `SUPABASE_USER_PASSWORD` no `.env`.
