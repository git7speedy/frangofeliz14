import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import {
  FinancialTransaction,
  FinancialReportFilters,
  CategorySummary,
  MonthlyEvolution,
} from '@/types/financial';

// ============================================
// HOOK - TRANSAÇÕES FINANCEIRAS
// ============================================

export function useFinancialTransactions(filters?: FinancialReportFilters) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar transações com filtros
  const { data: transactions, isLoading, error: queryError } = useQuery({
    queryKey: ['financial-transactions', profile?.store_id, filters],
    queryFn: async (): Promise<FinancialTransaction[]> => {
      if (!profile?.store_id) {
        console.log('[Financial Transactions] No store_id found');
        return [];
      }

      console.log('[Financial Transactions] Fetching with store_id:', profile.store_id);
      console.log('[Financial Transactions] Filters:', filters);

      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          category:financial_categories(*),
          bank_account:bank_accounts(*),
          credit_card:credit_cards(*),
          transfer_to_account:bank_accounts(*)
        `)
        .eq('store_id', profile.store_id)
        .order('transaction_date', { ascending: false });

      // Aplicar filtros
      if (filters?.startDate) {
        query = query.gte('transaction_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('transaction_date', filters.endDate);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.bankAccountId) {
        query = query.eq('bank_account_id', filters.bankAccountId);
      }
      if (filters?.creditCardId) {
        query = query.eq('credit_card_id', filters.creditCardId);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.searchTerm) {
        query = query.ilike('description', `%${filters.searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Financial Transactions] Error fetching:', error);
        throw error;
      }
      
      console.log('[Financial Transactions] Fetched:', data?.length, 'transactions');
      return data || [];
    },
    enabled: !!profile?.store_id,
  });

  // Criar transação
  const createTransaction = useMutation({
    mutationFn: async (newTransaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>) => {
      console.log('[Financial Transactions] Creating transaction:', newTransaction);
      
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert([newTransaction])
        .select()
        .single();

      if (error) {
        console.error('[Financial Transactions] Error creating:', error);
        throw error;
      }
      
      console.log('[Financial Transactions] Created successfully:', data);
      return data;
    },
    onSuccess: () => {
      console.log('[Financial Transactions] Invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({
        title: 'Lançamento criado',
        description: 'O lançamento foi criado com sucesso.',
      });
    },
    onError: (error: any) => {
      console.error('[Financial Transactions] Mutation error:', error);
      toast({
        title: 'Erro ao criar lançamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Atualizar transação
  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialTransaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({
        title: 'Lançamento atualizado',
        description: 'O lançamento foi atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar lançamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Deletar transação
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({
        title: 'Lançamento excluído',
        description: 'O lançamento foi excluído com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir lançamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Duplicar transação
  const duplicateTransaction = useMutation({
    mutationFn: async (transaction: FinancialTransaction) => {
      const { id, created_at, updated_at, ...transactionData } = transaction;
      
      const newTransaction = {
        ...transactionData,
        description: `${transactionData.description} (cópia)`,
        transaction_date: new Date().toISOString().split('T')[0],
      };

      const { data, error } = await supabase
        .from('financial_transactions')
        .insert([newTransaction])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({
        title: 'Lançamento duplicado',
        description: 'O lançamento foi duplicado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao duplicar lançamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    transactions: transactions || [],
    isLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    duplicateTransaction,
  };
}

// ============================================
// HOOK - RESUMO POR CATEGORIAS
// ============================================

export function useCategorySummary(startDate?: string, endDate?: string) {
  const { profile } = useAuth();

  const { data: categorySummary, isLoading } = useQuery({
    queryKey: ['category-summary', profile?.store_id, startDate, endDate],
    queryFn: async (): Promise<CategorySummary[]> => {
      if (!profile?.store_id) return [];

      let query = supabase
        .from('financial_transactions')
        .select(`
          amount,
          type,
          category:financial_categories(*)
        `)
        .eq('store_id', profile.store_id)
        .in('status', ['pago', 'recebido'])
        .not('category', 'is', null);

      if (startDate) query = query.gte('transaction_date', startDate);
      if (endDate) query = query.lte('transaction_date', endDate);

      const { data, error } = await query;
      if (error) throw error;

      // Agrupar por categoria
      const grouped = (data || []).reduce((acc: any, transaction: any) => {
        const catId = transaction.category?.id;
        if (!catId) return acc;

        if (!acc[catId]) {
          acc[catId] = {
            category: transaction.category,
            total: 0,
            transactionCount: 0,
          };
        }

        acc[catId].total += Number(transaction.amount);
        acc[catId].transactionCount += 1;

        return acc;
      }, {});

      const summaryArray = Object.values(grouped) as CategorySummary[];
      const totalAmount = summaryArray.reduce((sum, item) => sum + item.total, 0);

      // Calcular percentuais
      return summaryArray.map(item => ({
        ...item,
        percentage: totalAmount > 0 ? (item.total / totalAmount) * 100 : 0,
      }));
    },
    enabled: !!profile?.store_id,
  });

  return {
    categorySummary: categorySummary || [],
    isLoading,
  };
}

// ============================================
// HOOK - EVOLUÇÃO MENSAL
// ============================================

export function useMonthlyEvolution(months: number = 6) {
  const { profile } = useAuth();

  const { data: evolution, isLoading } = useQuery({
    queryKey: ['monthly-evolution', profile?.store_id, months],
    queryFn: async (): Promise<MonthlyEvolution[]> => {
      if (!profile?.store_id) return [];

      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data, error } = await supabase
        .from('financial_transactions')
        .select('amount, type, transaction_date')
        .eq('store_id', profile.store_id)
        .in('status', ['pago', 'recebido'])
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0]);

      if (error) throw error;

      // Agrupar por mês
      const grouped: Record<string, MonthlyEvolution> = {};

      (data || []).forEach((transaction: any) => {
        const date = new Date(transaction.transaction_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!grouped[monthKey]) {
          grouped[monthKey] = {
            month: monthKey,
            receitas: 0,
            despesas: 0,
            saldo: 0,
          };
        }

        const amount = Number(transaction.amount);
        if (transaction.type === 'receita') {
          grouped[monthKey].receitas += amount;
        } else if (transaction.type === 'despesa') {
          grouped[monthKey].despesas += amount;
        }
      });

      // Calcular saldo e ordenar
      return Object.values(grouped)
        .map(item => ({
          ...item,
          saldo: item.receitas - item.despesas,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
    },
    enabled: !!profile?.store_id,
  });

  return {
    evolution: evolution || [],
    isLoading,
  };
}
