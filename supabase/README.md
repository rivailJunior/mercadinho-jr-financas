# Supabase — migrations versionadas

Este diretório versiona o schema do banco (projeto `vizyhhyugnufyijtwmyj`).

## Estado atual

- As 9 migrations originais foram aplicadas **direto no projeto remoto** e não
  estavam versionadas. O arquivo `migrations/20261029000000_baseline_existing_schema.sql`
  reconstrói esse schema de forma **idempotente** (IF NOT EXISTS / CREATE OR REPLACE)
  para que um ambiente novo possa ser recriado.
- `migrations/20261108160000_financial_management_v2.sql` adiciona o novo modelo
  financeiro (contas, movimentações, transferências, reservas, compromissos,
  faturas e compras de cartão) em **centavos inteiros (bigint)**, com enums, FKs,
  índices, auditoria, soft delete e RLS habilitado.
- `migrations/20261108170000_financial_rpc_functions.sql` adiciona a view
  `v_saldos_contas` (saldo derivado) e as RPCs transacionais atômicas.
- `migrations/20261108180000_financial_rls_open_policies.sql` adiciona políticas
  permissivas (equivalente à postura aberta atual do app) nas tabelas novas,
  para uso end-to-end antes do endurecimento com Auth.
- `migrations/2026111101*_consolidate_lancamentos_into_movimentos.sql` e
  `2026111102*_drop_lancamentos_caixa.sql` consolidam a tabela legada
  `lancamentos_caixa` em `movimentacoes_financeiras` (histórico como movimentos
  `OPERACIONAL` com `afeta_saldo = false`) e a removem — uma única tabela de
  movimentos alimenta saldos e relatórios.
- `migrations/20261111030000_consolidate_custos_fixos.sql` deriva o custo fixo
  diário de `view_resumo_diario` dos `compromissos_financeiros` MENSAL ativos
  e remove `custos_fixos_config` (legada, congelada desde out/2024) e
  `pagamentos_compromissos` (tabela de auditoria nunca usada — o histórico de
  pagamentos já é auditável por `movimentacoes_financeiras.compromisso_id`).

## Fluxo recomendado (quando o Supabase CLI estiver funcional nesta máquina)

```bash
supabase link --project-ref vizyhhyugnufyijtwmyj
# Reconciliar o histórico remoto já aplicado:
supabase migration repair --status applied 20261029000000 20261108160000
# Daqui em diante, novas mudanças via:
supabase migration new <nome>
supabase db push
```

> Observação: nesta máquina o binário do Supabase CLI está sendo encerrado pelo
> macOS (SIGKILL na inicialização). Enquanto isso, as migrations foram aplicadas
> via MCP do Supabase, mantendo o histórico remoto em sincronia com estes arquivos.

## Segurança pendente (requer decisão/Auth)

As 3 tabelas legadas (`estabelecimentos`, `categorias`,
`config_financeira`) ainda estão com **RLS desabilitado**.
Habilitar RLS + políticas junto com Supabase Auth é o passo de cutover,
tratado em migration separada após aprovação. (`lancamentos_caixa` e
`custos_fixos_config` foram consolidadas no modelo financeiro e removidas.)
