# 📊 Documentação do Módulo "Minhas Finanças"

## 🎯 Visão Geral

O módulo **Minhas Finanças** é um sistema completo de gestão financeira integrado ao painel do lojista. Permite controlar receitas, despesas, contas bancárias, cartões de crédito, contas a receber e objetivos financeiros (Quadro dos Sonhos).

## 📁 Estrutura de Arquivos

```
src/
├── pages/
│   ├── Financas.tsx                          # Página principal com Tabs
│   └── Financas/
│       ├── DashboardFinanceiro.tsx           # Dashboard com resumos e gráficos
│       ├── Lancamentos.tsx                   # CRUD de lançamentos financeiros
│       ├── Categorias.tsx                    # Gestão de categorias
│       ├── ContasBancarias.tsx               # Gestão de contas bancárias
│       ├── CartoesCredito.tsx                # Gestão de cartões de crédito
│       ├── ContasReceber.tsx                 # Contas a receber
│       ├── QuadroSonhos.tsx                  # Quadro de sonhos/objetivos
│       └── Relatorios.tsx                    # Relatórios e exportações
│
├── hooks/
│   ├── useFinancialData.ts                   # Hook principal + categorias, contas, cartões
│   ├── useFinancialTransactions.ts           # Hook de transações + resumos
│   ├── useAccountsReceivable.ts              # Hook de contas a receber
│   └── useDreamBoard.ts                      # Hook do quadro de sonhos
│
├── types/
│   └── financial.ts                          # Tipos TypeScript do módulo
│
└── supabase/
    └── migrations/
        └── 20250106_create_financial_module.sql  # Migration completa do BD
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

1. **financial_categories** - Categorias de receitas e despesas
2. **bank_accounts** - Contas bancárias
3. **credit_cards** - Cartões de crédito
4. **financial_transactions** - Lançamentos financeiros
5. **accounts_receivable** - Contas a receber
6. **dream_board** - Quadro de sonhos
7. **financial_goals** - Metas financeiras
8. **financial_notifications** - Notificações financeiras

### Views Criadas

- `v_monthly_financial_summary` - Resumo financeiro mensal
- `v_overdue_accounts_receivable` - Contas vencidas
- `v_store_financial_balance` - Saldo total por loja

### Triggers

- **update_bank_account_balance** - Atualiza saldo automaticamente ao criar/atualizar transações
- **update_updated_at_column** - Atualiza `updated_at` automaticamente

### Segurança (RLS)

- Todas as tabelas têm Row Level Security (RLS) habilitado
- Usuários só podem ver/editar dados de sua própria loja
- Policies criadas para SELECT, INSERT, UPDATE e DELETE

## 🚀 Funcionalidades Implementadas

### ✅ Dashboard Financeiro

- **Cards de Resumo**
  - Saldo Total (em contas bancárias)
  - Receitas do Mês
  - Despesas do Mês
  - Lucro Líquido
  - Contas a Receber (total + vencidas)

- **Gráficos**
  - Gráfico de Pizza: Despesas por Categoria
  - Gráfico de Linha: Evolução Mensal (últimos 6 meses)
  - Top 5 Maiores Despesas

- **Ações Rápidas**
  - Botões para nova receita, despesa e exportação

### ✅ Lançamentos Financeiros

- **CRUD Completo**
  - Criar, editar, duplicar e excluir lançamentos
  - Suporte para receitas, despesas e transferências

- **Filtros Avançados**
  - Busca por descrição
  - Filtro por tipo (receita/despesa/transferência)
  - Filtro por status (pendente/pago/recebido/cancelado)

- **Campos do Lançamento**
  - Tipo, descrição, valor, data
  - Categoria, conta bancária ou cartão de crédito
  - Status, forma de pagamento
  - Observações/notas

### ✅ Categorias

- **Gestão de Categorias**
  - Criar categorias de receita e despesa
  - Personalizar nome, cor e descrição
  - Editar e excluir categorias

- **Visualização**
  - Separação visual entre receitas e despesas
  - Cards coloridos com informações da categoria

### ✅ Contas Bancárias

- **CRUD de Contas**
  - Nome, banco, tipo (corrente/poupança/investimento)
  - Número da conta, agência
  - Saldo inicial (que vira saldo atual)

- **Funcionalidades**
  - Saldo atualizado automaticamente via triggers
  - Cards coloridos com informações da conta
  - Cálculo de saldo total

### ✅ Cartões de Crédito

- **CRUD de Cartões**
  - Nome, banco, últimos 4 dígitos
  - Limite do cartão
  - Dia de fechamento e vencimento

- **Visualização**
  - Cards com informações do cartão
  - Informações de limite e datas

### ✅ Contas a Receber

- **CRUD de Contas**
  - Nome do cliente, telefone, e-mail
  - Descrição, valor, data de vencimento
  - Status (pendente/recebido/atrasado)

- **Marcar como Recebido**
  - Opção de associar a uma conta bancária
  - Informar forma de pagamento
  - Cria transação financeira automaticamente

- **Detecção Automática**
  - Identifica contas vencidas automaticamente
  - Calcula total pendente e vencido

### ✅ Quadro dos Sonhos

- **Gestão de Sonhos**
  - Título, descrição, valor da meta
  - Data alvo, prioridade (1-5)
  - Status (ativo/concluído/cancelado)

- **Acompanhamento**
  - Barra de progresso visual
  - Valor atual vs valor da meta
  - Quanto falta para alcançar

- **Contribuições**
  - Adicionar valores ao sonho
  - Marca automaticamente como concluído ao atingir a meta
  - Celebração ao completar um sonho 🎉

### ✅ Relatórios

- **Tipos de Relatórios**
  - Evolução Mensal
  - Por Categoria
  - Transações Detalhadas

- **Filtros**
  - Período (data inicial e final)
  - Tipo de relatório

- **Exportação**
  - CSV (implementado)
  - PDF (preparado para implementação)
  - Excel (preparado para implementação)

- **Resumo do Período**
  - Total de receitas
  - Total de despesas
  - Saldo do período

## 🎨 Componentes UI Utilizados

- **shadcn/ui**: Todos os componentes base (Card, Button, Dialog, Table, etc.)
- **Recharts**: Gráficos de pizza e linha
- **Lucide Icons**: Ícones modernos
- **React Hook Form + Zod**: Validação de formulários (estrutura preparada)
- **date-fns**: Formatação de datas

## 🔧 Hooks Customizados

### `useFinancialData()`
Retorna:
- `summary` - Resumo financeiro geral
- `loadingSummary` - Estado de carregamento

### `useFinancialCategories()`
Retorna:
- `categories` - Lista de categorias
- `createCategory` - Criar categoria
- `updateCategory` - Atualizar categoria
- `deleteCategory` - Desativar categoria

### `useBankAccounts()`
Retorna:
- `accounts` - Lista de contas
- `createAccount` - Criar conta
- `updateAccount` - Atualizar conta
- `deleteAccount` - Desativar conta

### `useCreditCards()`
Retorna:
- `cards` - Lista de cartões
- `createCard` - Criar cartão
- `updateCard` - Atualizar cartão
- `deleteCard` - Desativar cartão

### `useFinancialTransactions(filters?)`
Retorna:
- `transactions` - Lista de transações
- `createTransaction` - Criar transação
- `updateTransaction` - Atualizar transação
- `deleteTransaction` - Excluir transação
- `duplicateTransaction` - Duplicar transação

### `useCategorySummary(startDate?, endDate?)`
Retorna:
- `categorySummary` - Resumo por categoria
- Inclui total, porcentagem e contagem

### `useMonthlyEvolution(months)`
Retorna:
- `evolution` - Evolução mensal
- Receitas, despesas e saldo por mês

### `useAccountsReceivable()`
Retorna:
- `receivables` - Lista de contas a receber
- `createReceivable` - Criar conta
- `updateReceivable` - Atualizar conta
- `markAsReceived` - Marcar como recebido
- `deleteReceivable` - Excluir conta

### `useDreamBoard()`
Retorna:
- `dreams` - Lista de sonhos
- `createDream` - Criar sonho
- `updateDream` - Atualizar sonho
- `addContribution` - Adicionar contribuição
- `completeDream` - Marcar como concluído
- `deleteDream` - Excluir sonho

## 🚦 Como Usar

### 1. Executar Migration

```bash
# Copie o conteúdo do arquivo de migration e execute no Supabase SQL Editor
# Arquivo: supabase/migrations/20250106_create_financial_module.sql
```

### 2. Acessar o Módulo

- Acesse `/financas` no navegador
- Ou clique em "Minhas Finanças" no sidebar

### 3. Configuração Inicial Recomendada

1. **Criar Categorias**
   - Acesse a aba "Categorias"
   - Crie categorias de receita (ex: Vendas, Serviços)
   - Crie categorias de despesa (ex: Aluguel, Salários, Fornecedores)
   - *(Categorias padrão podem ser criadas automaticamente com a função SQL `create_default_financial_categories`)*

2. **Cadastrar Contas Bancárias**
   - Acesse a aba "Contas"
   - Adicione suas contas bancárias
   - Informe o saldo inicial correto

3. **Cadastrar Cartões (opcional)**
   - Acesse a aba "Cartões"
   - Adicione seus cartões de crédito
   - Informe dias de fechamento e vencimento

4. **Começar a Lançar**
   - Acesse a aba "Lançamentos"
   - Comece a registrar receitas e despesas

### 4. Fluxo de Uso Diário

1. **Registrar Vendas/Receitas**
   - Crie lançamento do tipo "Receita"
   - Associe a uma categoria
   - Marque como "Recebido" quando confirmado

2. **Registrar Despesas**
   - Crie lançamento do tipo "Despesa"
   - Associe a conta bancária ou cartão
   - Marque como "Pago" quando efetivado

3. **Acompanhar Dashboard**
   - Visualize resumos financeiros
   - Analise gráficos de evolução
   - Identifique maiores despesas

4. **Gerenciar Contas a Receber**
   - Registre vendas a prazo
   - Marque como recebido quando pago
   - Acompanhe contas vencidas

5. **Definir Sonhos**
   - Crie objetivos financeiros
   - Adicione contribuições regularmente
   - Comemore ao alcançar metas! 🎉

## 📊 Exemplos de Uso

### Criar um Lançamento de Receita

```typescript
const { createTransaction } = useFinancialTransactions();

await createTransaction.mutateAsync({
  type: 'receita',
  description: 'Venda de produtos',
  amount: 500.00,
  transaction_date: '2025-01-06',
  category_id: 'uuid-categoria-vendas',
  bank_account_id: 'uuid-conta-bancaria',
  status: 'recebido',
  payment_method: 'Pix',
  store_id: 'uuid-loja',
  created_by: 'uuid-usuario',
  is_recurring: false,
});
```

### Adicionar Contribuição a um Sonho

```typescript
const { addContribution } = useDreamBoard();

await addContribution.mutateAsync({
  id: 'uuid-sonho',
  amount: 100.00,
});
```

## 🔮 Funcionalidades Futuras (Não Implementadas)

- [ ] Conciliação bancária automática (importação de OFX)
- [ ] Lançamentos recorrentes automáticos
- [ ] Notificações de vencimento via e-mail/WhatsApp
- [ ] Integração com APIs de bancos
- [ ] Previsão de fluxo de caixa com IA
- [ ] Comparação com períodos anteriores
- [ ] Metas financeiras por categoria
- [ ] Gráficos mais avançados (Sankey, etc.)
- [ ] Exportação em PDF com gráficos
- [ ] Multi-moeda
- [ ] Gestão de investimentos
- [ ] Integração com sistema de vendas (pedidos → receitas)

## 🎯 Melhores Práticas

1. **Categorização**
   - Sempre associe transações a categorias
   - Use categorias consistentes
   - Revise periodicamente as categorias

2. **Conciliação**
   - Compare saldos do sistema com extratos reais
   - Ajuste discrepâncias imediatamente
   - Use a funcionalidade de conciliação bancária

3. **Backup**
   - Os dados ficam no Supabase (backups automáticos)
   - Exporte relatórios regularmente
   - Mantenha cópias locais importantes

4. **Organização**
   - Registre transações diariamente
   - Use descrições claras e objetivas
   - Adicione notas quando necessário

5. **Análise**
   - Revise o dashboard semanalmente
   - Analise relatórios mensalmente
   - Ajuste orçamentos conforme necessário

## 🐛 Troubleshooting

### Saldo da conta não atualiza

- **Causa**: Transação não está com status "pago" ou "recebido"
- **Solução**: Altere o status da transação

### Categorias não aparecem

- **Causa**: Store ID não configurado no profile
- **Solução**: Verifique se o usuário tem store_id no profile

### Erro ao criar lançamento

- **Causa**: Falta de permissões RLS no Supabase
- **Solução**: Verifique se as policies foram criadas corretamente

### Gráficos não carregam

- **Causa**: Sem dados no período selecionado
- **Solução**: Verifique se há transações registradas

## 📝 Checklist de Implementação

### ✅ Concluído

- [x] Estrutura de banco de dados
- [x] Migrations e RLS
- [x] Tipos TypeScript
- [x] Hooks customizados
- [x] Dashboard Financeiro
- [x] CRUD de Lançamentos
- [x] CRUD de Categorias
- [x] CRUD de Contas Bancárias
- [x] CRUD de Cartões de Crédito
- [x] CRUD de Contas a Receber
- [x] Quadro dos Sonhos
- [x] Relatórios básicos
- [x] Exportação CSV
- [x] Integração com rotas e sidebar
- [x] Atualização automática de saldos
- [x] Gráficos (Pizza e Linha)
- [x] Filtros e buscas

### 🔄 Pendente (Expansões Futuras)

- [ ] Exportação PDF/Excel
- [ ] Lançamentos recorrentes
- [ ] Notificações de vencimento
- [ ] Conciliação bancária
- [ ] Upload de comprovantes
- [ ] Tags personalizadas
- [ ] Filtros avançados salvos
- [ ] Metas por categoria
- [ ] Previsão de fluxo de caixa
- [ ] Gráficos adicionais

## 🤝 Contribuindo

Para adicionar novas funcionalidades:

1. Crie migrations SQL para novos campos/tabelas
2. Atualize tipos em `src/types/financial.ts`
3. Crie/atualize hooks conforme necessário
4. Implemente UI nos componentes
5. Adicione documentação

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verifique esta documentação
2. Consulte os comentários no código
3. Revise as migrations SQL
4. Teste em ambiente de desenvolvimento

---

**Desenvolvido com ❤️ para o Food Flow**

*Versão: 1.0.0*
*Data: 06/01/2025*
