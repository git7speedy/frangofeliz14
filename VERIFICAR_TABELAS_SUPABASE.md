# 🔍 Guia de Verificação - Tabelas do Supabase

## ⚠️ IMPORTANTE: Você executou a migration?

O módulo financeiro requer que você execute a migration SQL no Supabase antes de usar.

### Passo 1: Verificar se as tabelas existem

1. Acesse o **Supabase Dashboard**: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral esquerdo)
4. Execute este comando para verificar as tabelas:

```sql
-- Verificar se as tabelas do módulo financeiro existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'financial_transactions',
  'financial_categories',
  'bank_accounts',
  'credit_cards',
  'accounts_receivable',
  'dream_board',
  'financial_goals',
  'financial_notifications'
)
ORDER BY table_name;
```

**Resultado Esperado:**
```
table_name
---------------------------
accounts_receivable
bank_accounts
credit_cards
dream_board
financial_categories
financial_goals
financial_notifications
financial_transactions
```

Se retornar **0 linhas**, significa que você **NÃO EXECUTOU** a migration.

---

## 📝 Passo 2: Executar a Migration

Se as tabelas não existirem, você precisa executar a migration:

1. Abra o arquivo: `supabase/migrations/20250106_create_financial_module.sql`
2. **Copie TODO o conteúdo** do arquivo (~800 linhas)
3. No **Supabase SQL Editor**, cole o conteúdo
4. Clique em **RUN** (ou Ctrl+Enter)
5. Aguarde a execução (pode levar 10-20 segundos)

**Mensagem de Sucesso:** "Success. No rows returned"

---

## 🔐 Passo 3: Verificar RLS (Row Level Security)

Após criar as tabelas, verifique se o RLS está ativo:

```sql
-- Verificar RLS nas tabelas
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN (
  'financial_transactions',
  'financial_categories',
  'bank_accounts',
  'credit_cards'
)
AND schemaname = 'public';
```

**Resultado Esperado:** Todas devem ter `rowsecurity = true`

---

## 👤 Passo 4: Verificar se você tem store_id

O sistema usa RLS para filtrar dados por `store_id`. Verifique se seu usuário tem um store_id:

```sql
-- Substitua SEU_USER_ID pelo ID do seu usuário
SELECT id, email, store_id, role
FROM profiles
WHERE id = 'SEU_USER_ID';
```

**Como obter seu User ID:**
1. No app, abra o console do navegador (F12)
2. Execute:
```javascript
JSON.parse(localStorage.getItem('sb-sfvwxvpnjtwxcbkwqtaj-auth-token'))?.user?.id
```

Se `store_id` estiver **NULL**, você precisa associar o usuário a uma loja:

```sql
-- Criar uma loja (se ainda não tiver)
INSERT INTO stores (name, cnpj, phone, email)
VALUES ('Minha Loja', '00000000000000', '11999999999', 'contato@minhaloja.com')
RETURNING id;

-- Associar o usuário à loja (substitua os IDs)
UPDATE profiles
SET store_id = 'STORE_ID_AQUI'
WHERE id = 'SEU_USER_ID';
```

---

## 🧪 Passo 5: Testar Inserção Manual

Após garantir que as tabelas existem e você tem store_id, teste inserir um lançamento manualmente:

```sql
-- Primeiro, pegue seu store_id e user_id
SELECT id as user_id, store_id 
FROM profiles 
WHERE email = 'seu-email@exemplo.com';

-- Inserir um lançamento de teste
INSERT INTO financial_transactions (
  store_id,
  created_by,
  type,
  description,
  amount,
  transaction_date,
  status,
  is_recurring
) VALUES (
  'SEU_STORE_ID',     -- Substitua
  'SEU_USER_ID',      -- Substitua
  'receita',
  'Teste de lançamento',
  100.00,
  CURRENT_DATE,
  'recebido',
  false
)
RETURNING *;
```

**Se houver erro:**
- Verifique se os IDs estão corretos
- Verifique se o RLS permite a inserção
- Verifique se você está logado com o usuário correto

---

## 🔍 Passo 6: Consultar Lançamentos Existentes

Depois de inserir, consulte para ver se aparece:

```sql
-- Ver todos os seus lançamentos
SELECT 
  id,
  type,
  description,
  amount,
  transaction_date,
  status,
  created_at
FROM financial_transactions
WHERE store_id = 'SEU_STORE_ID'
ORDER BY transaction_date DESC;
```

---

## 📊 Passo 7: Verificar Políticas RLS

Se a inserção manual funciona mas o app não lista, pode ser problema de RLS:

```sql
-- Ver políticas da tabela financial_transactions
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'financial_transactions';
```

**Deve retornar 4 políticas:**
1. `financial_transactions_select_policy` - SELECT
2. `financial_transactions_insert_policy` - INSERT
3. `financial_transactions_update_policy` - UPDATE
4. `financial_transactions_delete_policy` - DELETE

---

## 🐛 Troubleshooting

### Problema 1: "Nenhum lançamento encontrado" após criar

**Possíveis causas:**
1. ❌ Migration não foi executada
2. ❌ Usuário não tem `store_id` no perfil
3. ❌ RLS está bloqueando o acesso
4. ❌ Query está filtrando incorretamente

**Solução:**
Execute os passos 1-6 acima em ordem.

---

### Problema 2: Erro ao criar lançamento

**Erro comum:**
```
invalid input syntax for type uuid: ""
```

**Solução:**
Já foi corrigido no código. Certifique-se de usar a versão mais recente.

---

### Problema 3: Tabelas não existem

**Erro:**
```
relation "financial_transactions" does not exist
```

**Solução:**
Execute a migration (Passo 2).

---

### Problema 4: RLS bloqueia acesso

**Sintoma:**
- Inserção manual funciona
- App não mostra dados

**Solução:**
```sql
-- Desabilitar RLS temporariamente para teste (NÃO usar em produção)
ALTER TABLE financial_transactions DISABLE ROW LEVEL SECURITY;

-- Testar se funciona
-- Se funcionar, o problema é RLS

-- Re-habilitar RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Verificar se as políticas estão corretas
-- A política SELECT deve ser:
CREATE POLICY financial_transactions_select_policy ON financial_transactions
FOR SELECT TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM profiles WHERE id = auth.uid()
  )
);
```

---

## ✅ Checklist Final

Antes de reportar um problema, certifique-se:

- [ ] Migration foi executada no Supabase
- [ ] Tabelas existem no banco
- [ ] RLS está ativo nas tabelas
- [ ] Seu usuário tem `store_id` válido
- [ ] Políticas RLS existem (4 por tabela)
- [ ] Consegue inserir manualmente via SQL
- [ ] Consegue consultar manualmente via SQL
- [ ] App está usando o mesmo store_id
- [ ] Não há erros no console do navegador
- [ ] Não há erros na aba Network (F12 > Network > XHR)

---

## 🔧 Comando Rápido de Diagnóstico

Execute este comando para diagnóstico completo:

```sql
-- DIAGNÓSTICO COMPLETO
DO $$
DECLARE
  v_user_id uuid := 'SEU_USER_ID';  -- SUBSTITUA!
  v_store_id uuid;
BEGIN
  -- 1. Verificar usuário
  SELECT store_id INTO v_store_id
  FROM profiles WHERE id = v_user_id;
  
  RAISE NOTICE '1. User ID: %', v_user_id;
  RAISE NOTICE '2. Store ID: %', v_store_id;
  
  -- 2. Verificar tabelas
  RAISE NOTICE '3. Tabela financial_transactions existe: %', 
    EXISTS(SELECT 1 FROM information_schema.tables 
           WHERE table_name = 'financial_transactions');
  
  -- 3. Verificar RLS
  RAISE NOTICE '4. RLS ativo: %',
    (SELECT rowsecurity FROM pg_tables 
     WHERE tablename = 'financial_transactions');
  
  -- 4. Contar lançamentos
  RAISE NOTICE '5. Total de lançamentos: %',
    (SELECT COUNT(*) FROM financial_transactions 
     WHERE store_id = v_store_id);
  
  -- 5. Verificar políticas
  RAISE NOTICE '6. Políticas RLS: %',
    (SELECT COUNT(*) FROM pg_policies 
     WHERE tablename = 'financial_transactions');
END $$;
```

---

## 📞 Precisa de Ajuda?

Se após seguir todos os passos ainda não funcionar, forneça:

1. Resultado da query de verificação de tabelas
2. Seu `store_id` (mascarado)
3. Resultado do diagnóstico completo
4. Prints dos erros do console (F12)
5. Print da aba Network mostrando a requisição falhada

---

**Última Atualização:** 06/01/2025
**Versão da Migration:** 20250106_create_financial_module.sql
