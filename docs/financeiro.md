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

## Compromissos são ciclos mensais recorrentes

Todo `compromisso` MENSAL é um template recorrente: `dia_vencimento`
(1–31, `NULL` = último dia do mês) define a regra e `vencimento` guarda a
data do ciclo aberto. Energia vence dia 6, água dia 24; pró-labore,
funcionários e reserva financeira, no fim do mês.

Quando `pagar_compromisso` quita o ciclo, o próprio RPC **abre o próximo**
(`vencimento = proximo_vencimento(...)`, `valor_pago = 0`, `status =
PENDENTE`) — dinheiro provisionado dali em diante já financia a conta do
mês seguinte, nunca uma obrigação quitada. Pagamento parcial fica
`PARCIALMENTE_PAGO` no ciclo corrente.

## Fluxo diário unificado (caixa do dia → modelo financeiro)

O formulário "Anotar Caixa do Dia" (home) é a única entrada diária. Cada
salvar grava **dois** registros do mesmo evento:

- `lancamentos_caixa` — alimenta os relatórios/gráficos legados;
- `movimentacoes_financeiras` — alimenta os saldos das contas em `/financas`,
  via `lancamento_id` (FK `ON DELETE CASCADE`, migration
  `mov_lancamento_link`), então excluir o lançamento desfaz o movimento.

Roteamento de conta:

- Entrada: o seletor "Onde entrou?" define a conta — Dinheiro → Caixa
  físico; Maquininha/Pix → Maquininha.
- Saída: o seletor "De onde saiu?" define a conta debitada (fornecedor,
  compras do comércio).
- Natureza sempre `OPERACIONAL` — uma operação do usuário nunca vira
  receita nem despesa duplicada nos dois modelos.

## Provisão diária ("quanto guardar hoje")

`provisaoDiaria` (função pura em `src/lib/finance/provision.ts`), servida por
`getProvisaoDiaria` em `data.ts` e exibida no card da home:

1. `ritmoCartao = faltaCartao ÷ diasAteFechamento` — a fatura precisa estar
   provisionada até o **fechamento** do ciclo (campo informativo).
2. `ritmoCompromissos = faltaCompromissos ÷ diasAteCompromissos` — o ritmo
   usa o vencimento do compromisso pendente mais próximo (campo
   informativo).
3. `disponivel = max(0, lucroDia)` — o lucro líquido do dia (entradas −
   saídas) é o que pode ser dividido.
4. `sugerido = min(85% do lucroDia, faltaTotal, saldoLivre)` — 85% do lucro
   do dia vai pras contas fixas; 15% fica no caixa. Zerado quando o dia já
   teve aporte (`jaGuardouHoje`).
5. O cartão recebe primeiro (vencimento mais próximo); o restante vai para
   a reserva dos demais compromissos.

O botão "Guardar hoje" (`guardarParaFixas`) recalcula tudo **no servidor** e
chama `aportar_reserva` por bucket — a sugestão da tela nunca é confiada.

## Estado inicial (seed real)

- Caixa físico R$ 1.850 + Maquininha R$ 10.363 = **R$ 12.213 consolidado**.
- Reservas (rebalanceadas proporcionalmente às fixas de ~R$ 21.400):
  Fatura do cartão R$ 7.263 (~70%, meta ~R$ 15.000), Demais compromissos
  R$ 3.100 (~30%), Emergência R$ 0, Investimentos R$ 0 →
  **R$ 10.363 reservado, R$ 1.850 livre** (o troco da gaveta fica
  operacional).
- Os R$ 12.213 foram registrados como `saldo_inicial` das contas —
  **não** como receita nova.
- Compromissos mensais: cartão ~R$ 15.000, pró-labore R$ 2.000,
  funcionários R$ 2.000, água R$ 500, energia R$ 900, reserva financeira
  R$ 1.000.
- Ciclo do cartão: fecha dia 14, vence dia 20.
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
