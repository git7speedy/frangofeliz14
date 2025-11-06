// ============================================
// TIPOS DO MÓDULO FINANCEIRO
// ============================================

export type TransactionType = 'receita' | 'despesa' | 'transferencia';
export type TransactionStatus = 'pendente' | 'pago' | 'recebido' | 'cancelado';
export type AccountType = 'corrente' | 'poupanca' | 'investimento' | 'outro';
export type RecurringType = 'mensal' | 'semanal' | 'anual' | 'personalizado';
export type DreamStatus = 'ativo' | 'concluido' | 'cancelado';
export type GoalType = 'mensal' | 'anual' | 'categoria';

export interface FinancialCategory {
  id: string;
  store_id: string;
  name: string;
  type: 'receita' | 'despesa';
  color: string;
  icon: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  store_id: string;
  name: string;
  bank_name?: string;
  account_type?: AccountType;
  account_number?: string;
  agency?: string;
  initial_balance: number;
  current_balance: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditCard {
  id: string;
  store_id: string;
  name: string;
  bank_name?: string;
  last_four_digits?: string;
  card_limit?: number;
  closing_day?: number;
  due_day?: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialTransaction {
  id: string;
  store_id: string;
  category_id?: string;
  bank_account_id?: string;
  credit_card_id?: string;
  
  type: TransactionType;
  description: string;
  amount: number;
  transaction_date: string;
  due_date?: string;
  
  status: TransactionStatus;
  payment_method?: string;
  
  is_recurring: boolean;
  recurring_type?: RecurringType;
  recurring_end_date?: string;
  
  notes?: string;
  attachment_url?: string;
  tags?: string[];
  
  transfer_to_account_id?: string;
  
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relações
  category?: FinancialCategory;
  bank_account?: BankAccount;
  credit_card?: CreditCard;
  transfer_to_account?: BankAccount;
}

export interface AccountReceivable {
  id: string;
  store_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  
  description: string;
  amount: number;
  due_date: string;
  received_date?: string;
  
  status: 'pendente' | 'recebido' | 'atrasado' | 'cancelado';
  payment_method?: string;
  
  bank_account_id?: string;
  transaction_id?: string;
  
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relações
  bank_account?: BankAccount;
}

export interface DreamBoardItem {
  id: string;
  store_id: string;
  
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  
  image_url?: string;
  category?: string;
  priority: number;
  
  status: DreamStatus;
  
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface FinancialGoal {
  id: string;
  store_id: string;
  category_id?: string;
  
  name: string;
  type: GoalType;
  target_amount: number;
  
  period_start: string;
  period_end: string;
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relações
  category?: FinancialCategory;
}

export interface FinancialNotification {
  id: string;
  store_id: string;
  
  notification_type: 'vencimento' | 'meta' | 'saldo_baixo' | 'receita' | 'despesa_alta';
  title: string;
  message: string;
  
  related_id?: string;
  related_type?: string;
  
  is_read: boolean;
  sent_at: string;
  read_at?: string;
}

// ============================================
// TIPOS PARA DASHBOARDS E RELATÓRIOS
// ============================================

export interface FinancialSummary {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  lucroLiquido: number;
  totalContasBancarias: number;
  totalContasReceber: number;
  totalContasVencidas: number;
}

export interface CategorySummary {
  category: FinancialCategory;
  total: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyEvolution {
  month: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface CashFlowPrediction {
  date: string;
  predicted_balance: number;
  incoming: number;
  outgoing: number;
}

export interface TopExpenses {
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface FinancialReportFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  bankAccountId?: string;
  creditCardId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  searchTerm?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts?: boolean;
  includeSummary?: boolean;
  dateRange: {
    start: string;
    end: string;
  };
}
