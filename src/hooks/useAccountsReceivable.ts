import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { AccountReceivable } from '@/types/financial';

// ============================================
// HOOK - CONTAS A RECEBER
// ============================================

export function useAccountsReceivable() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: receivables, isLoading } = useQuery({
    queryKey: ['accounts-receivable', profile?.store_id],
    queryFn: async (): Promise<AccountReceivable[]> => {
      if (!profile?.store_id) return [];

      const { data, error } = await supabase
        .from('accounts_receivable')
        .select(`
          *,
          bank_account:bank_accounts(*)
        `)
        .eq('store_id', profile.store_id)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Atualizar status de contas vencidas
      const today = new Date().toISOString().split('T')[0];
      const updatedData = (data || []).map(item => {
        if (item.status === 'pendente' && item.due_date < today) {
          return { ...item, status: 'atrasado' as const };
        }
        return item;
      });

      return updatedData;
    },
    enabled: !!profile?.store_id,
  });

  const createReceivable = useMutation({
    mutationFn: async (newReceivable: Omit<AccountReceivable, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .insert([newReceivable])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast({
        title: 'Conta a receber criada',
        description: 'A conta a receber foi criada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar conta a receber',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateReceivable = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AccountReceivable> & { id: string }) => {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast({
        title: 'Conta a receber atualizada',
        description: 'A conta a receber foi atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar conta a receber',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const markAsReceived = useMutation({
    mutationFn: async ({
      id,
      bankAccountId,
      paymentMethod,
    }: {
      id: string;
      bankAccountId?: string;
      paymentMethod?: string;
    }) => {
      const receivedDate = new Date().toISOString().split('T')[0];

      // Atualizar conta a receber
      const { data: receivable, error: recError } = await supabase
        .from('accounts_receivable')
        .update({
          status: 'recebido',
          received_date: receivedDate,
          bank_account_id: bankAccountId,
          payment_method: paymentMethod,
        })
        .eq('id', id)
        .select()
        .single();

      if (recError) throw recError;

      // Criar transação financeira se tiver conta bancária
      if (bankAccountId && receivable) {
        const { error: transError } = await supabase
          .from('financial_transactions')
          .insert([{
            store_id: receivable.store_id,
            type: 'receita',
            description: `Recebimento: ${receivable.description}`,
            amount: receivable.amount,
            transaction_date: receivedDate,
            status: 'recebido',
            bank_account_id: bankAccountId,
            payment_method: paymentMethod,
            notes: `Conta a receber ID: ${id}`,
          }]);

        if (transError) throw transError;
      }

      return receivable;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({
        title: 'Pagamento recebido',
        description: 'A conta foi marcada como recebida com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao marcar como recebido',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteReceivable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounts_receivable')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast({
        title: 'Conta a receber excluída',
        description: 'A conta a receber foi excluída com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir conta a receber',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    receivables: receivables || [],
    isLoading,
    createReceivable,
    updateReceivable,
    markAsReceived,
    deleteReceivable,
  };
}
