# 🚀 Instruções de Instalação - Módulo Finanças

## ✅ Passo a Passo para Ativar o Módulo

### 1️⃣ Executar Migration no Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto: `sfvwxvpnjtwxcbkwqtaj`
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo:
   ```
   supabase/migrations/20250106_create_financial_module.sql
   ```
6. Cole no editor SQL
7. Clique em **RUN** (ou pressione Ctrl+Enter)
8. Aguarde a execução completa (deve retornar "Success")

### 2️⃣ Verificar Criação das Tabelas

No SQL Editor do Supabase, execute:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'financial%' 
OR table_name IN ('bank_accounts', 'credit_cards', 'accounts_receivable', 'dream_board');
```

Você deve ver as seguintes tabelas:
- `financial_categories`
- `financial_transactions`
- `financial_goals`
- `financial_notifications`
- `bank_accounts`
- `credit_cards`
- `accounts_receivable`
- `dream_board`

### 3️⃣ Criar Categorias Padrão (Opcional)

Para criar categorias padrão para uma loja, execute no SQL Editor:

```sql
-- Substitua 'UUID_DA_SUA_LOJA' pelo ID real da loja
SELECT create_default_financial_categories('UUID_DA_SUA_LOJA');
```

Para descobrir o UUID da sua loja:

```sql
SELECT id, name FROM stores;
```

### 4️⃣ Verificar RLS (Row Level Security)

Execute para confirmar que as policies foram criadas:

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'financial%' 
OR tablename IN ('bank_accounts', 'credit_cards', 'accounts_receivable', 'dream_board');
```

Deve retornar várias policies (4 por tabela: SELECT, INSERT, UPDATE, DELETE).

### 5️⃣ Testar a Aplicação

1. **Instale dependências** (se ainda não instalou):
   ```bash
   npm install
   # ou
   bun install
   ```

2. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   # ou
   bun run dev
   ```

3. **Acesse a aplicação**:
   - URL: `http://localhost:5173`
   - Faça login com suas credenciais
   - No menu lateral, clique em **"Minhas Finanças"**

### 6️⃣ Configuração Inicial no App

Após acessar "Minhas Finanças":

#### a) Criar Categorias

1. Vá para a aba **"Categorias"**
2. Clique em **"Nova Categoria"**
3. Crie categorias de **Receita**:
   - Vendas (cor verde)
   - Serviços (cor azul)
   - Outras Receitas
4. Crie categorias de **Despesa**:
   - Aluguel (cor vermelha)
   - Salários (cor laranja)
   - Fornecedores (cor rosa)
   - Energia, Água, Internet, etc.

#### b) Cadastrar Contas Bancárias

1. Vá para a aba **"Contas"**
2. Clique em **"Nova Conta"**
3. Preencha:
   - Nome: Ex: "Conta Corrente Santander"
   - Banco: "Santander"
   - Tipo: "Corrente"
   - Saldo Inicial: Valor atual da conta

#### c) Cadastrar Cartões (Opcional)

1. Vá para a aba **"Cartões"**
2. Clique em **"Novo Cartão"**
3. Preencha:
   - Nome: Ex: "Mastercard Empresarial"
   - Banco: "Itaú"
   - Últimos 4 dígitos: "1234"
   - Limite: 5000
   - Dia de Fechamento: 10
   - Dia de Vencimento: 20

#### d) Criar Primeiro Lançamento

1. Vá para a aba **"Lançamentos"**
2. Clique em **"Novo Lançamento"**
3. Preencha:
   - Tipo: Receita ou Despesa
   - Descrição: Ex: "Venda de produtos"
   - Valor: 500.00
   - Data: Hoje
   - Categoria: Selecione uma categoria
   - Conta: Selecione uma conta bancária
   - Status: Recebido/Pago

#### e) Configurar Sonho (Opcional)

1. Vá para a aba **"Sonhos"**
2. Clique em **"Novo Sonho"**
3. Preencha:
   - Título: Ex: "Comprar equipamento novo"
   - Valor da Meta: 10000
   - Prioridade: 5
   - Data Alvo: 31/12/2025

## 🔍 Verificações de Funcionamento

### ✅ Dashboard Deve Mostrar

- Cards com valores (mesmo que zerados inicialmente)
- Gráficos (vazios se não houver dados)
- Área de ações rápidas

### ✅ Lançamentos Deve Permitir

- Criar novo lançamento
- Ver lista de lançamentos
- Filtrar por tipo e status
- Editar e excluir lançamentos

### ✅ Contas Bancárias Deve Mostrar

- Saldo total de todas as contas
- Cards individuais de cada conta
- Saldo atualizado após lançamentos

### ✅ Teste de Integração

1. Crie uma conta bancária com saldo inicial de R$ 1.000,00
2. Crie um lançamento de receita de R$ 500,00 com status "Recebido" e associe à conta
3. Verifique se o saldo da conta foi atualizado para R$ 1.500,00
4. Crie uma despesa de R$ 200,00 com status "Pago" e associe à conta
5. Verifique se o saldo foi atualizado para R$ 1.300,00

## 🐛 Problemas Comuns e Soluções

### ❌ Erro: "relation 'financial_categories' does not exist"

**Causa**: Migration não foi executada

**Solução**: Execute a migration no Supabase SQL Editor (Passo 1)

---

### ❌ Erro: "permission denied for table financial_categories"

**Causa**: RLS não foi configurado ou policies não foram criadas

**Solução**: 
1. Verifique se a migration foi executada completamente
2. Execute: `SELECT * FROM pg_policies WHERE tablename = 'financial_categories';`
3. Se não retornar nada, execute a migration novamente

---

### ❌ Dashboard não carrega dados

**Causa**: Store ID não está associado ao usuário

**Solução**:
```sql
-- Verifique seu profile
SELECT * FROM profiles WHERE id = auth.uid();

-- Se store_id estiver NULL, associe a uma loja
UPDATE profiles 
SET store_id = 'UUID_DA_LOJA' 
WHERE id = auth.uid();
```

---

### ❌ Saldo da conta não atualiza

**Causa**: Trigger não foi criado ou transação não tem status correto

**Solução**:
1. Verifique se o trigger existe:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'update_bank_balance_on_transaction';
   ```
2. Certifique-se que a transação está com status "pago" ou "recebido"
3. Se necessário, atualize o saldo manualmente:
   ```sql
   UPDATE bank_accounts 
   SET current_balance = initial_balance + (
     SELECT COALESCE(SUM(
       CASE 
         WHEN ft.type = 'receita' THEN ft.amount
         WHEN ft.type = 'despesa' THEN -ft.amount
         ELSE 0
       END
     ), 0)
     FROM financial_transactions ft
     WHERE ft.bank_account_id = bank_accounts.id
     AND ft.status IN ('pago', 'recebido')
   );
   ```

---

### ❌ Categorias não aparecem na lista

**Causa**: Nenhuma categoria foi criada ou store_id incorreto

**Solução**:
1. Crie categorias padrão (Passo 3)
2. Ou crie manualmente pela interface
3. Verifique se o filtro `is_active = true` está correto

---

### ❌ Erro no console: "Cannot read property 'store_id' of undefined"

**Causa**: Usuário não está autenticado ou profile não foi carregado

**Solução**:
1. Faça logout e login novamente
2. Limpe o cache do navegador
3. Verifique se há erros no console relacionados ao Auth

## 📊 Dados de Teste (Opcional)

Para popular o sistema com dados de teste, execute no SQL Editor:

```sql
-- Criar categorias de teste (substitua UUID_DA_LOJA)
INSERT INTO financial_categories (store_id, name, type, color, icon) VALUES
  ('UUID_DA_LOJA', 'Vendas', 'receita', '#10B981', 'ShoppingCart'),
  ('UUID_DA_LOJA', 'Fornecedores', 'despesa', '#EF4444', 'Package');

-- Criar conta bancária de teste
INSERT INTO bank_accounts (store_id, name, account_type, initial_balance, current_balance, color) VALUES
  ('UUID_DA_LOJA', 'Conta Teste', 'corrente', 5000, 5000, '#10B981');

-- Criar lançamentos de teste
-- (Você precisará substituir os UUIDs das categorias e contas criadas acima)
INSERT INTO financial_transactions (
  store_id, type, description, amount, transaction_date, 
  status, category_id, bank_account_id
) VALUES
  ('UUID_DA_LOJA', 'receita', 'Venda teste', 1000, CURRENT_DATE, 'recebido', 'UUID_CATEGORIA', 'UUID_CONTA'),
  ('UUID_DA_LOJA', 'despesa', 'Compra teste', 500, CURRENT_DATE, 'pago', 'UUID_CATEGORIA', 'UUID_CONTA');
```

## 🎉 Pronto!

Se tudo funcionou corretamente, você agora tem um módulo financeiro completo funcionando!

### Próximos Passos

1. Explore todas as funcionalidades
2. Configure categorias relevantes para seu negócio
3. Cadastre suas contas e cartões reais
4. Comece a registrar transações diárias
5. Defina seus sonhos financeiros
6. Acompanhe os relatórios e gráficos

### Suporte

- Documentação completa: `MODULO_FINANCEIRO_DOCUMENTACAO.md`
- Código-fonte: `src/pages/Financas/`
- Hooks: `src/hooks/useFinancial*.ts`
- Tipos: `src/types/financial.ts`

---

**Boa gestão financeira! 💰📊**
