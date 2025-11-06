-- ============================================
-- MÓDULO FINANCEIRO - MINHAS FINANÇAS
-- ============================================

-- 1. TABELA DE CATEGORIAS FINANCEIRAS
-- ============================================
CREATE TABLE IF NOT EXISTS financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('receita', 'despesa')),
  color VARCHAR(7) DEFAULT '#3B82F6',
  icon VARCHAR(50) DEFAULT 'DollarSign',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_categories_store ON financial_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_financial_categories_type ON financial_categories(type);

-- 2. TABELA DE CONTAS BANCÁRIAS
-- ============================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  bank_name VARCHAR(100),
  account_type VARCHAR(50) CHECK (account_type IN ('corrente', 'poupanca', 'investimento', 'outro')),
  account_number VARCHAR(50),
  agency VARCHAR(20),
  initial_balance DECIMAL(10, 2) DEFAULT 0,
  current_balance DECIMAL(10, 2) DEFAULT 0,
  color VARCHAR(7) DEFAULT '#10B981',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_store ON bank_accounts(store_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_active ON bank_accounts(is_active);

-- 3. TABELA DE CARTÕES DE CRÉDITO
-- ============================================
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  bank_name VARCHAR(100),
  last_four_digits VARCHAR(4),
  card_limit DECIMAL(10, 2),
  closing_day INTEGER CHECK (closing_day >= 1 AND closing_day <= 31),
  due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
  color VARCHAR(7) DEFAULT '#EF4444',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_cards_store ON credit_cards(store_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_active ON credit_cards(is_active);

-- 4. TABELA DE LANÇAMENTOS FINANCEIROS
-- ============================================
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  
  type VARCHAR(20) NOT NULL CHECK (type IN ('receita', 'despesa', 'transferencia')),
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_date DATE NOT NULL,
  due_date DATE,
  
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'recebido', 'cancelado')),
  payment_method VARCHAR(50),
  
  is_recurring BOOLEAN DEFAULT false,
  recurring_type VARCHAR(20) CHECK (recurring_type IN ('mensal', 'semanal', 'anual', 'personalizado')),
  recurring_end_date DATE,
  
  notes TEXT,
  attachment_url TEXT,
  tags TEXT[],
  
  -- Para transferências
  transfer_to_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_store ON financial_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_bank_account ON financial_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_credit_card ON financial_transactions(credit_card_id);

-- 5. TABELA DE CONTAS A RECEBER
-- ============================================
CREATE TABLE IF NOT EXISTS accounts_receivable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  received_date DATE,
  
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'atrasado', 'cancelado')),
  payment_method VARCHAR(50),
  
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES financial_transactions(id) ON DELETE SET NULL,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_receivable_store ON accounts_receivable(store_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_status ON accounts_receivable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_due_date ON accounts_receivable(due_date);

-- 6. TABELA QUADRO DOS SONHOS
-- ============================================
CREATE TABLE IF NOT EXISTS dream_board (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  target_date DATE,
  
  image_url TEXT,
  category VARCHAR(50),
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'cancelado')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_dream_board_store ON dream_board(store_id);
CREATE INDEX IF NOT EXISTS idx_dream_board_status ON dream_board(status);

-- 7. TABELA DE METAS FINANCEIRAS
-- ============================================
CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
  
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('mensal', 'anual', 'categoria')),
  target_amount DECIMAL(10, 2) NOT NULL,
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_goals_store ON financial_goals(store_id);
CREATE INDEX IF NOT EXISTS idx_financial_goals_period ON financial_goals(period_start, period_end);

-- 8. TABELA DE NOTIFICAÇÕES FINANCEIRAS
-- ============================================
CREATE TABLE IF NOT EXISTS financial_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('vencimento', 'meta', 'saldo_baixo', 'receita', 'despesa_alta')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  related_id UUID, -- ID relacionado (transaction, goal, etc)
  related_type VARCHAR(50), -- Tipo do relacionamento
  
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_financial_notifications_store ON financial_notifications(store_id);
CREATE INDEX IF NOT EXISTS idx_financial_notifications_read ON financial_notifications(is_read);

-- ============================================
-- TRIGGERS PARA ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_financial_categories_updated_at ON financial_categories;
CREATE TRIGGER update_financial_categories_updated_at BEFORE UPDATE ON financial_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_credit_cards_updated_at ON credit_cards;
CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON credit_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_accounts_receivable_updated_at ON accounts_receivable;
CREATE TRIGGER update_accounts_receivable_updated_at BEFORE UPDATE ON accounts_receivable
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dream_board_updated_at ON dream_board;
CREATE TRIGGER update_dream_board_updated_at BEFORE UPDATE ON dream_board
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_goals_updated_at ON financial_goals;
CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON financial_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER PARA ATUALIZAR SALDO DA CONTA BANCÁRIA
-- ============================================

CREATE OR REPLACE FUNCTION update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'receita' AND NEW.status = 'recebido' AND NEW.bank_account_id IS NOT NULL THEN
      UPDATE bank_accounts 
      SET current_balance = current_balance + NEW.amount 
      WHERE id = NEW.bank_account_id;
    ELSIF NEW.type = 'despesa' AND NEW.status = 'pago' AND NEW.bank_account_id IS NOT NULL THEN
      UPDATE bank_accounts 
      SET current_balance = current_balance - NEW.amount 
      WHERE id = NEW.bank_account_id;
    ELSIF NEW.type = 'transferencia' AND NEW.status = 'pago' THEN
      IF NEW.bank_account_id IS NOT NULL THEN
        UPDATE bank_accounts 
        SET current_balance = current_balance - NEW.amount 
        WHERE id = NEW.bank_account_id;
      END IF;
      IF NEW.transfer_to_account_id IS NOT NULL THEN
        UPDATE bank_accounts 
        SET current_balance = current_balance + NEW.amount 
        WHERE id = NEW.transfer_to_account_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverter saldo anterior
    IF OLD.status IN ('recebido', 'pago') THEN
      IF OLD.type = 'receita' AND OLD.bank_account_id IS NOT NULL THEN
        UPDATE bank_accounts 
        SET current_balance = current_balance - OLD.amount 
        WHERE id = OLD.bank_account_id;
      ELSIF OLD.type = 'despesa' AND OLD.bank_account_id IS NOT NULL THEN
        UPDATE bank_accounts 
        SET current_balance = current_balance + OLD.amount 
        WHERE id = OLD.bank_account_id;
      END IF;
    END IF;
    
    -- Aplicar novo saldo
    IF NEW.status IN ('recebido', 'pago') THEN
      IF NEW.type = 'receita' AND NEW.bank_account_id IS NOT NULL THEN
        UPDATE bank_accounts 
        SET current_balance = current_balance + NEW.amount 
        WHERE id = NEW.bank_account_id;
      ELSIF NEW.type = 'despesa' AND NEW.bank_account_id IS NOT NULL THEN
        UPDATE bank_accounts 
        SET current_balance = current_balance - NEW.amount 
        WHERE id = NEW.bank_account_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bank_balance_on_transaction ON financial_transactions;
CREATE TRIGGER update_bank_balance_on_transaction 
  AFTER INSERT OR UPDATE ON financial_transactions
  FOR EACH ROW EXECUTE FUNCTION update_bank_account_balance();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_board ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_notifications ENABLE ROW LEVEL SECURITY;

-- Policies para financial_categories
DROP POLICY IF EXISTS "Users can view their store's financial categories" ON financial_categories;
CREATE POLICY "Users can view their store's financial categories" 
  ON financial_categories FOR SELECT 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their store's financial categories" ON financial_categories;
CREATE POLICY "Users can insert their store's financial categories" 
  ON financial_categories FOR INSERT 
  WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their store's financial categories" ON financial_categories;
CREATE POLICY "Users can update their store's financial categories" 
  ON financial_categories FOR UPDATE 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their store's financial categories" ON financial_categories;
CREATE POLICY "Users can delete their store's financial categories" 
  ON financial_categories FOR DELETE 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- Policies para bank_accounts
DROP POLICY IF EXISTS "Users can view their store's bank accounts" ON bank_accounts;
CREATE POLICY "Users can view their store's bank accounts" 
  ON bank_accounts FOR SELECT 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their store's bank accounts" ON bank_accounts;
CREATE POLICY "Users can insert their store's bank accounts" 
  ON bank_accounts FOR INSERT 
  WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their store's bank accounts" ON bank_accounts;
CREATE POLICY "Users can update their store's bank accounts" 
  ON bank_accounts FOR UPDATE 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their store's bank accounts" ON bank_accounts;
CREATE POLICY "Users can delete their store's bank accounts" 
  ON bank_accounts FOR DELETE 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- Policies para credit_cards
DROP POLICY IF EXISTS "Users can view their store's credit cards" ON credit_cards;
CREATE POLICY "Users can view their store's credit cards" 
  ON credit_cards FOR SELECT 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their store's credit cards" ON credit_cards;
CREATE POLICY "Users can insert their store's credit cards" 
  ON credit_cards FOR INSERT 
  WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their store's credit cards" ON credit_cards;
CREATE POLICY "Users can update their store's credit cards" 
  ON credit_cards FOR UPDATE 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their store's credit cards" ON credit_cards;
CREATE POLICY "Users can delete their store's credit cards" 
  ON credit_cards FOR DELETE 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- Policies para financial_transactions
DROP POLICY IF EXISTS "Users can view their store's financial transactions" ON financial_transactions;
CREATE POLICY "Users can view their store's financial transactions" 
  ON financial_transactions FOR SELECT 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their store's financial transactions" ON financial_transactions;
CREATE POLICY "Users can insert their store's financial transactions" 
  ON financial_transactions FOR INSERT 
  WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their store's financial transactions" ON financial_transactions;
CREATE POLICY "Users can update their store's financial transactions" 
  ON financial_transactions FOR UPDATE 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their store's financial transactions" ON financial_transactions;
CREATE POLICY "Users can delete their store's financial transactions" 
  ON financial_transactions FOR DELETE 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- Policies para accounts_receivable
DROP POLICY IF EXISTS "Users can view their store's accounts receivable" ON accounts_receivable;
CREATE POLICY "Users can view their store's accounts receivable" 
  ON accounts_receivable FOR SELECT 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their store's accounts receivable" ON accounts_receivable;
CREATE POLICY "Users can insert their store's accounts receivable" 
  ON accounts_receivable FOR INSERT 
  WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their store's accounts receivable" ON accounts_receivable;
CREATE POLICY "Users can update their store's accounts receivable" 
  ON accounts_receivable FOR UPDATE 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their store's accounts receivable" ON accounts_receivable;
CREATE POLICY "Users can delete their store's accounts receivable" 
  ON accounts_receivable FOR DELETE 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- Policies para dream_board
DROP POLICY IF EXISTS "Users can view their store's dream board" ON dream_board;
CREATE POLICY "Users can view their store's dream board" 
  ON dream_board FOR SELECT 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their store's dream board" ON dream_board;
CREATE POLICY "Users can insert their store's dream board" 
  ON dream_board FOR INSERT 
  WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their store's dream board" ON dream_board;
CREATE POLICY "Users can update their store's dream board" 
  ON dream_board FOR UPDATE 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their store's dream board" ON dream_board;
CREATE POLICY "Users can delete their store's dream board" 
  ON dream_board FOR DELETE 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- Policies para financial_goals
DROP POLICY IF EXISTS "Users can view their store's financial goals" ON financial_goals;
CREATE POLICY "Users can view their store's financial goals" 
  ON financial_goals FOR SELECT 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their store's financial goals" ON financial_goals;
CREATE POLICY "Users can insert their store's financial goals" 
  ON financial_goals FOR INSERT 
  WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their store's financial goals" ON financial_goals;
CREATE POLICY "Users can update their store's financial goals" 
  ON financial_goals FOR UPDATE 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their store's financial goals" ON financial_goals;
CREATE POLICY "Users can delete their store's financial goals" 
  ON financial_goals FOR DELETE 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- Policies para financial_notifications
DROP POLICY IF EXISTS "Users can view their store's financial notifications" ON financial_notifications;
CREATE POLICY "Users can view their store's financial notifications" 
  ON financial_notifications FOR SELECT 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their store's financial notifications" ON financial_notifications;
CREATE POLICY "Users can insert their store's financial notifications" 
  ON financial_notifications FOR INSERT 
  WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their store's financial notifications" ON financial_notifications;
CREATE POLICY "Users can update their store's financial notifications" 
  ON financial_notifications FOR UPDATE 
  USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- ============================================
-- CATEGORIAS PADRÃO (SEED DATA)
-- ============================================

-- Esta função será chamada quando uma nova loja for criada
CREATE OR REPLACE FUNCTION create_default_financial_categories(p_store_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO financial_categories (store_id, name, type, color, icon) VALUES
  -- Receitas
  (p_store_id, 'Vendas', 'receita', '#10B981', 'ShoppingCart'),
  (p_store_id, 'Serviços', 'receita', '#3B82F6', 'Briefcase'),
  (p_store_id, 'Investimentos', 'receita', '#8B5CF6', 'TrendingUp'),
  (p_store_id, 'Outras Receitas', 'receita', '#6366F1', 'Plus'),
  
  -- Despesas
  (p_store_id, 'Aluguel', 'despesa', '#EF4444', 'Home'),
  (p_store_id, 'Salários', 'despesa', '#F59E0B', 'Users'),
  (p_store_id, 'Fornecedores', 'despesa', '#EC4899', 'Package'),
  (p_store_id, 'Energia', 'despesa', '#14B8A6', 'Zap'),
  (p_store_id, 'Água', 'despesa', '#06B6D4', 'Droplet'),
  (p_store_id, 'Internet', 'despesa', '#8B5CF6', 'Wifi'),
  (p_store_id, 'Marketing', 'despesa', '#F97316', 'Megaphone'),
  (p_store_id, 'Transporte', 'despesa', '#84CC16', 'Car'),
  (p_store_id, 'Manutenção', 'despesa', '#64748B', 'Wrench'),
  (p_store_id, 'Impostos', 'despesa', '#DC2626', 'FileText'),
  (p_store_id, 'Outras Despesas', 'despesa', '#6B7280', 'Minus');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View de resumo financeiro mensal
CREATE OR REPLACE VIEW v_monthly_financial_summary AS
SELECT 
  ft.store_id,
  DATE_TRUNC('month', ft.transaction_date) as month,
  ft.type,
  SUM(ft.amount) as total,
  COUNT(*) as transaction_count
FROM financial_transactions ft
WHERE ft.status IN ('pago', 'recebido')
GROUP BY ft.store_id, DATE_TRUNC('month', ft.transaction_date), ft.type;

-- View de contas a receber vencidas
CREATE OR REPLACE VIEW v_overdue_accounts_receivable AS
SELECT 
  ar.*,
  CURRENT_DATE - ar.due_date as days_overdue
FROM accounts_receivable ar
WHERE ar.status = 'pendente' 
  AND ar.due_date < CURRENT_DATE;

-- View de saldo total por loja
CREATE OR REPLACE VIEW v_store_financial_balance AS
SELECT 
  store_id,
  SUM(current_balance) as total_balance,
  COUNT(*) as accounts_count
FROM bank_accounts
WHERE is_active = true
GROUP BY store_id;

COMMENT ON TABLE financial_categories IS 'Categorias de receitas e despesas para organização financeira';
COMMENT ON TABLE bank_accounts IS 'Contas bancárias da loja';
COMMENT ON TABLE credit_cards IS 'Cartões de crédito da loja';
COMMENT ON TABLE financial_transactions IS 'Todos os lançamentos financeiros (receitas, despesas e transferências)';
COMMENT ON TABLE accounts_receivable IS 'Contas a receber de clientes';
COMMENT ON TABLE dream_board IS 'Quadro de sonhos e objetivos financeiros';
COMMENT ON TABLE financial_goals IS 'Metas financeiras mensais e anuais';
COMMENT ON TABLE financial_notifications IS 'Notificações e alertas financeiros';
