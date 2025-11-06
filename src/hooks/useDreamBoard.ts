import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { DreamBoardItem } from '@/types/financial';

// ============================================
// HOOK - QUADRO DE SONHOS
// ============================================

export function useDreamBoard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dreams, isLoading } = useQuery({
    queryKey: ['dream-board', profile?.store_id],
    queryFn: async (): Promise<DreamBoardItem[]> => {
      if (!profile?.store_id) return [];

      const { data, error } = await supabase
        .from('dream_board')
        .select('*')
        .eq('store_id', profile.store_id)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.store_id,
  });

  const createDream = useMutation({
    mutationFn: async (newDream: Omit<DreamBoardItem, 'id' | 'created_at' | 'updated_at' | 'completed_at'>) => {
      const { data, error } = await supabase
        .from('dream_board')
        .insert([newDream])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dream-board'] });
      toast({
        title: 'Sonho adicionado',
        description: 'Seu sonho foi adicionado ao quadro com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar sonho',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateDream = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DreamBoardItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('dream_board')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dream-board'] });
      toast({
        title: 'Sonho atualizado',
        description: 'Seu sonho foi atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar sonho',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addContribution = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      // Buscar sonho atual
      const { data: dream, error: fetchError } = await supabase
        .from('dream_board')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const newAmount = Number(dream.current_amount) + amount;
      const targetAmount = Number(dream.target_amount);

      // Verificar se atingiu a meta
      const updates: any = {
        current_amount: newAmount,
      };

      if (newAmount >= targetAmount && dream.status === 'ativo') {
        updates.status = 'concluido';
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('dream_board')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dream-board'] });
      
      if (data.status === 'concluido') {
        toast({
          title: '🎉 Parabéns!',
          description: `Você realizou seu sonho: ${data.title}!`,
        });
      } else {
        toast({
          title: 'Contribuição adicionada',
          description: 'Continue assim! Você está mais perto do seu sonho!',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar contribuição',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteDream = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dream_board')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dream-board'] });
      toast({
        title: 'Sonho removido',
        description: 'O sonho foi removido do quadro.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover sonho',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const completeDream = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('dream_board')
        .update({
          status: 'concluido',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dream-board'] });
      toast({
        title: '🎉 Sonho realizado!',
        description: `Parabéns por realizar: ${data.title}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao marcar como concluído',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    dreams: dreams || [],
    isLoading,
    createDream,
    updateDream,
    addContribution,
    deleteDream,
    completeDream,
  };
}
