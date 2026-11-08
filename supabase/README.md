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
  índices, auditoria, soft delete e RLS habilitado (sem políticas ainda).

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

As 5 tabelas legadas (`estabelecimentos`, `categorias`, `lancamentos_caixa`,
`custos_fixos_config`, `config_financeira`) ainda estão com **RLS desabilitado**.
Habilitar RLS + políticas junto com Supabase Auth é o passo de cutover,
tratado em migration separada após aprovação.
