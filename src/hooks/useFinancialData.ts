import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import {
  FinancialCategory,
  BankAccount,
  CreditCard,
  FinancialTransaction,
  AccountReceivable,
  DreamBoardItem,
  FinancialGoal,
  FinancialSummary,
} from '@/types/financial';

// ============================================
// HOOK PRINCIPAL - DADOS FINANCEIROS
// ============================================

export function useFinancialData() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ============================================
  // RESUMO FINANCEIRO
  // ============================================
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['financial-summary', profile?.store_id],
    queryFn: async (): Promise<FinancialSummary> => {
      if (!profile?.store_id) throw new Error('Store ID não encontrado');

      // Buscar transações do mês atual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: transactions, error: transError } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('store_id', profile.store_id)
        .gte('transaction_date', startOfMonth.toISOString().split('T')[0])
        .in('status', ['pago', 'recebido']);

      if (transError) throw transError;

      // Buscar contas bancárias
      const { data: accounts, error: accError } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('store_id', profile.store_id)
        .eq('is_active', true);

      if (accError) throw accError;

      // Buscar contas a receber
      const { data: receivables, error: recError } = await supabase
        .from('accounts_receivable')
        .select('amount, due_date, status')
        .eq('store_id', profile.store_id)
        .eq('status', 'pendente');

      if (recError) throw recError;

      const totalReceitas = transactions
        ?.filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const totalDespesas = transactions
        ?.filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const totalContasBancarias = accounts?.reduce(
        (sum, acc) => sum + Number(acc.current_balance), 0
      ) || 0;

      const totalContasReceber = receivables?.reduce(
        (sum, rec) => sum + Number(rec.amount), 0
      ) || 0;

      const totalContasVencidas = receivables?.filter(
        rec => new Date(rec.due_date) < new Date()
      ).reduce((sum, rec) => sum + Number(rec.amount), 0) || 0;

      return {
        totalReceitas,
        totalDespesas,
        saldo: totalReceitas - totalDespesas,
        lucroLiquido: totalReceitas - totalDespesas,
        totalContasBancarias,
        totalContasReceber,
        totalContasVencidas,
      };
    },
    enabled: !!profile?.store_id,
  });

  return {
    summary,
    loadingSummary,
  };
}

// ============================================
// HOOK - CATEGORIAS
// ============================================

export function useFinancialCategories() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['financial-categories', profile?.store_id],
    queryFn: async (): Promise<FinancialCategory[]> => {
      if (!profile?.store_id) return [];

      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .eq('store_id', profile.store_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.store_id,
  });

  const createCategory = useMutation({
    mutationFn: async (newCategory: Omit<FinancialCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('financial_categories')
        .insert([newCategory])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
      toast({
        title: 'Categoria criada',
        description: 'A categoria foi criada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('financial_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
      toast({
        title: 'Categoria atualizada',
        description: 'A categoria foi atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
      toast({
        title: 'Categoria excluída',
        description: 'A categoria foi excluída com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    categories: categories || [],
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

// ============================================
// HOOK - CONTAS BANCÁRIAS
// ============================================

export function useBankAccounts() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['bank-accounts', profile?.store_id],
    queryFn: async (): Promise<BankAccount[]> => {
      if (!profile?.store_id) return [];

      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('store_id', profile.store_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.store_id,
  });

  const createAccount = useMutation({
    mutationFn: async (newAccount: Omit<BankAccount, 'id' | 'created_at' | 'updated_at' | 'current_balance'>) => {
      const accountWithBalance = {
        ...newAccount,
        current_balance: newAccount.initial_balance,
      };

      const { data, error } = await supabase
        .from('bank_accounts')
        .insert([accountWithBalance])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({
        title: 'Conta criada',
        description: 'A conta bancária foi criada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar conta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BankAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({
        title: 'Conta atualizada',
        description: 'A conta bancária foi atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar conta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({
        title: 'Conta excluída',
        description: 'A conta bancária foi excluída com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir conta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    accounts: accounts || [],
    isLoading,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}

// ============================================
// HOOK - CARTÕES DE CRÉDITO
// ============================================

export function useCreditCards() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cards, isLoading } = useQuery({
    queryKey: ['credit-cards', profile?.store_id],
    queryFn: async (): Promise<CreditCard[]> => {
      if (!profile?.store_id) return [];

      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('store_id', profile.store_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.store_id,
  });

  const createCard = useMutation({
    mutationFn: async (newCard: Omit<CreditCard, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('credit_cards')
        .insert([newCard])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
      toast({
        title: 'Cartão criado',
        description: 'O cartão de crédito foi criado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar cartão',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateCard = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CreditCard> & { id: string }) => {
      const { data, error } = await supabase
        .from('credit_cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
      toast({
        title: 'Cartão atualizado',
        description: 'O cartão de crédito foi atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar cartão',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('credit_cards')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
      toast({
        title: 'Cartão excluído',
        description: 'O cartão de crédito foi excluído com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir cartão',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    cards: cards || [],
    isLoading,
    createCard,
    updateCard,
    deleteCard,
  };
}
