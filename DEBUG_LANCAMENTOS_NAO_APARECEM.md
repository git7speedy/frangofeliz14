# 🐛 Debug: Lançamentos não aparecem após criação

## ❗ Problema Reportado

Após criar um lançamento em "Minhas Finanças", a mensagem "Nenhum lançamento encontrado" continua aparecendo.

## 🔍 Diagnóstico Passo a Passo

### Passo 1: Verificar Console do Navegador

Adicionei logs de debug no código. Siga estes passos:

1. ✅ Abra o navegador e pressione **F12**
2. ✅ Vá para a aba **Console**
3. ✅ Limpe o console (botão 🚫 ou Ctrl+L)
4. ✅ Vá para "Minhas Finanças" > Aba "Lançamentos"
5. ✅ Procure por estas mensagens:

```
[Financial Transactions] Fetching with store_id: uuid-aqui
[Financial Transactions] Filters: {...}
[Financial Transactions] Fetched: 0 transactions
```

**O que verificar:**

#### Cenário A: Não aparece nenhuma mensagem
**Problema:** O hook não está sendo executado
**Causa possível:** 
- Componente não está montado
- Profile não está carregado
- React Query não está configurado

#### Cenário B: Aparece "No store_id found"
```
[Financial Transactions] No store_id found
```
**Problema:** Usuário não tem store_id
**Solução:** Execute no SQL do Supabase:
```sql
-- Ver seu perfil
SELECT id, email, store_id, role 
FROM profiles 
WHERE email = 'seu-email@exemplo.com';

-- Se store_id for NULL, crie uma loja e associe
INSERT INTO stores (name) VALUES ('Minha Loja') RETURNING id;

UPDATE profiles 
SET store_id = 'STORE_ID_AQUI'
WHERE email = 'seu-email@exemplo.com';
```

#### Cenário C: Aparece "Error fetching"
```
[Financial Transactions] Error fetching: {...}
```
**Problema:** Erro na query do Supabase
**Causas possíveis:**
1. Tabela não existe (migration não foi executada)
2. RLS bloqueando acesso
3. Join com tabela inexistente

**Verificar no erro:**
- `"code": "42P01"` → Tabela não existe
- `"code": "42501"` → Problema de permissão/RLS
- `"message": "relation ... does not exist"` → Tabela não existe

#### Cenário D: Aparece "Fetched: 0 transactions"
```
[Financial Transactions] Fetched: 0 transactions
```
**Problema:** Query funciona mas não retorna dados
**Causas possíveis:**
1. Não há dados no banco (lançamento não foi criado)
2. RLS está filtrando tudo
3. Filtros muito restritivos

---

### Passo 2: Tentar Criar um Lançamento

Com o console aberto:

1. ✅ Clique em "Novo Lançamento" ou "Nova Receita"
2. ✅ Preencha os campos obrigatórios
3. ✅ Clique em "Criar Lançamento"
4. ✅ Observe os logs:

```
[Financial Transactions] Creating transaction: {...}
[Financial Transactions] Created successfully: {...}
[Financial Transactions] Invalidating queries...
[Financial Transactions] Fetching with store_id: ...
[Financial Transactions] Fetched: 1 transactions
```

**Possíveis resultados:**

#### Resultado A: Erro ao criar
```
[Financial Transactions] Error creating: {...}
```
**Ver mensagem de erro:**
- `invalid input syntax for type uuid` → UUID vazio (já corrigido)
- `relation "financial_transactions" does not exist` → Migration não executada
- `new row violates row-level security` → RLS bloqueando
- `violates foreign key constraint` → store_id ou created_by inválidos

#### Resultado B: Criado mas não aparece
```
[Financial Transactions] Created successfully: {...}
[Financial Transactions] Invalidating queries...
[Financial Transactions] Fetching with store_id: ...
[Financial Transactions] Fetched: 0 transactions  ← PROBLEMA AQUI
```
**Problema:** RLS está impedindo SELECT mas permitindo INSERT
**Solução:** Verificar política SELECT no Supabase

---

### Passo 3: Verificar Network Tab

1. ✅ No DevTools (F12), vá para a aba **Network**
2. ✅ Filtre por **Fetch/XHR**
3. ✅ Crie um lançamento
4. ✅ Procure por requisições para `financial_transactions`

**O que procurar:**

#### POST (criar lançamento)
- Status: **201 Created** ✅ Sucesso
- Status: **400 Bad Request** ❌ Dados inválidos
- Status: **403 Forbidden** ❌ RLS bloqueando
- Status: **409 Conflict** ❌ Violação de constraint

#### GET (listar lançamentos)
- Status: **200 OK** ✅ Sucesso
- Response body: `[]` → Sem dados (problema de filtro ou RLS)
- Response body: `[{...}]` → Com dados (deveria aparecer no UI)

---

### Passo 4: Verificar Supabase Diretamente

Execute estas queries no **SQL Editor** do Supabase:

#### 4.1: Verificar se a tabela existe
```sql
SELECT COUNT(*) as existe
FROM information_schema.tables 
WHERE table_name = 'financial_transactions';
```
**Esperado:** `existe = 1`

#### 4.2: Ver todos os lançamentos (sem RLS)
```sql
-- Desabilitar RLS temporariamente
ALTER TABLE financial_transactions DISABLE ROW LEVEL SECURITY;

-- Ver todos os dados
SELECT * FROM financial_transactions ORDER BY created_at DESC LIMIT 10;

-- Re-habilitar RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
```

#### 4.3: Ver seus lançamentos (com RLS)
```sql
-- Ver como usuário autenticado
SELECT * 
FROM financial_transactions 
WHERE store_id = (
  SELECT store_id FROM profiles WHERE email = 'seu-email@exemplo.com'
)
ORDER BY created_at DESC;
```

**Se query 4.2 retorna dados mas 4.3 não:**
→ Problema de RLS

---

### Passo 5: Verificar Políticas RLS

```sql
-- Ver política SELECT
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'financial_transactions'
AND cmd = 'SELECT';
```

**Política correta deve ser:**
```
policyname: financial_transactions_select_policy
cmd: SELECT
qual: (store_id = ( SELECT profiles.store_id FROM profiles WHERE (profiles.id = auth.uid())))
with_check: NULL
```

**Se estiver diferente, recriar:**
```sql
DROP POLICY IF EXISTS financial_transactions_select_policy ON financial_transactions;

CREATE POLICY financial_transactions_select_policy ON financial_transactions
FOR SELECT TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM profiles WHERE id = auth.uid()
  )
);
```

---

### Passo 6: Teste Manual Completo

Execute este script no SQL Editor:

```sql
-- 1. Pegar seu user_id e store_id
SELECT 
  id as user_id,
  store_id,
  email
FROM profiles
WHERE email = 'seu-email@exemplo.com';

-- Copie os IDs e substitua abaixo

-- 2. Inserir lançamento de teste
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
  'COLE_SEU_STORE_ID_AQUI',
  'COLE_SEU_USER_ID_AQUI',
  'receita',
  'Teste Manual - Pode deletar',
  999.99,
  CURRENT_DATE,
  'recebido',
  false
)
RETURNING *;

-- 3. Verificar se foi inserido
SELECT 
  id,
  type,
  description,
  amount,
  transaction_date,
  created_at
FROM financial_transactions
WHERE store_id = 'COLE_SEU_STORE_ID_AQUI'
ORDER BY created_at DESC;

-- 4. Se aparecer, o problema está no app
-- Se não aparecer, o problema está no banco
```

---

## 🎯 Soluções por Cenário

### Cenário 1: Migration não executada
**Sintoma:** Tabela não existe

**Solução:**
1. Abra `supabase/migrations/20250106_create_financial_module.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Execute (RUN)

---

### Cenário 2: Usuário sem store_id
**Sintoma:** `No store_id found` no console

**Solução:**
```sql
-- Criar loja
INSERT INTO stores (name, phone, email)
VALUES ('Minha Loja Teste', '11999999999', 'contato@loja.com')
RETURNING id;

-- Associar ao usuário (substitua os IDs)
UPDATE profiles
SET store_id = 'STORE_ID_DA_QUERY_ACIMA'
WHERE email = 'seu-email@exemplo.com';
```

---

### Cenário 3: RLS bloqueando SELECT
**Sintoma:** Cria mas não lista

**Solução:**
```sql
-- Recriar política SELECT
DROP POLICY IF EXISTS financial_transactions_select_policy ON financial_transactions;

CREATE POLICY financial_transactions_select_policy ON financial_transactions
FOR SELECT TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM profiles WHERE id = auth.uid()
  )
);
```

---

### Cenário 4: Filtros muito restritivos
**Sintoma:** Fetched: 0 transactions mas dados existem

**Solução:**
1. Vá para aba "Lançamentos"
2. Limpe todos os filtros:
   - Busca: vazio
   - Tipo: "Todos os tipos"
   - Status: "Todos os status"
3. Tente novamente

---

### Cenário 5: Cache do React Query
**Sintoma:** Dados aparecem após reload da página

**Solução:**
Adicione forçar refetch após criar:
```typescript
// Em Lancamentos.tsx, após criar com sucesso
queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
queryClient.refetchQueries({ queryKey: ['financial-transactions'] });
```

---

## 📊 Checklist de Diagnóstico

Execute na ordem:

1. [ ] Console mostra logs de debug?
2. [ ] `store_id` está presente nos logs?
3. [ ] Migration foi executada no Supabase?
4. [ ] Tabela `financial_transactions` existe?
5. [ ] Seu usuário tem `store_id` no profile?
6. [ ] Query SQL manual retorna dados?
7. [ ] RLS está permitindo SELECT?
8. [ ] Network tab mostra requisição com sucesso?
9. [ ] Response da API contém dados?
10. [ ] Filtros da UI não estão muito restritivos?

---

## 🆘 Informações para Suporte

Se nada funcionar, forneça:

```javascript
// Execute no console do navegador e copie o resultado
console.log({
  auth: JSON.parse(localStorage.getItem('sb-sfvwxvpnjtwxcbkwqtaj-auth-token')),
  profile: await supabase.from('profiles').select('*').single(),
  transactions: await supabase.from('financial_transactions').select('*'),
  tables: await supabase.rpc('check_tables_exist')
});
```

---

**Última Atualização:** 06/01/2025
**Versão com Debug:** Logs adicionados em useFinancialTransactions.ts
