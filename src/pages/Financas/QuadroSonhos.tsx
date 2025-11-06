import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Target, TrendingUp, CheckCircle } from 'lucide-react';
import { useDreamBoard } from '@/hooks/useDreamBoard';
import { useAuth } from '@/hooks/useAuth';
import { DreamBoardItem } from '@/types/financial';

export default function QuadroSonhos() {
  const { profile } = useAuth();
  const { dreams, createDream, updateDream, addContribution, deleteDream, completeDream } = useDreamBoard();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);
  const [editingDream, setEditingDream] = useState<DreamBoardItem | null>(null);
  const [contributingDream, setContributingDream] = useState<DreamBoardItem | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    current_amount: '0',
    target_date: '',
    priority: '3',
  });

  const handleOpenDialog = (dream?: DreamBoardItem) => {
    if (dream) {
      setEditingDream(dream);
      setFormData({
        title: dream.title,
        description: dream.description || '',
        target_amount: String(dream.target_amount),
        current_amount: String(dream.current_amount),
        target_date: dream.target_date || '',
        priority: String(dream.priority),
      });
    } else {
      setEditingDream(null);
      setFormData({ title: '', description: '', target_amount: '', current_amount: '0', target_date: '', priority: '3' });
    }
    setIsDialogOpen(true);
  };

  const handleOpenContributionDialog = (dream: DreamBoardItem) => {
    setContributingDream(dream);
    setContributionAmount('');
    setIsContributionDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.store_id) return;

    const data = {
      ...formData,
      target_amount: parseFloat(formData.target_amount),
      current_amount: parseFloat(formData.current_amount),
      priority: parseInt(formData.priority),
      store_id: profile.store_id,
      status: 'ativo' as const,
    };

    if (editingDream) {
      await updateDream.mutateAsync({ id: editingDream.id, ...data });
    } else {
      await createDream.mutateAsync(data as any);
    }
    setIsDialogOpen(false);
  };

  const handleAddContribution = async () => {
    if (!contributingDream || !contributionAmount) return;
    await addContribution.mutateAsync({
      id: contributingDream.id,
      amount: parseFloat(contributionAmount),
    });
    setIsContributionDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este sonho?')) {
      await deleteDream.mutateAsync(id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const ativos = dreams.filter(d => d.status === 'ativo');
  const concluidos = dreams.filter(d => d.status === 'concluido');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quadro dos Sonhos
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Defina e acompanhe seus objetivos financeiros
              </p>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Sonho
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Sonhos Ativos */}
          {ativos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Sonhos Ativos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ativos.map((dream) => {
                  const progress = getProgress(dream.current_amount, dream.target_amount);
                  return (
                    <Card key={dream.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{dream.title}</CardTitle>
                            {dream.description && (
                              <p className="text-xs text-muted-foreground mt-1">{dream.description}</p>
                            )}
                          </div>
                          <Badge variant="outline">⭐ {dream.priority}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-semibold">{progress.toFixed(1)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Atual:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(dream.current_amount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Meta:</span>
                            <span className="font-semibold">{formatCurrency(dream.target_amount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Falta:</span>
                            <span className="font-semibold text-orange-600">
                              {formatCurrency(dream.target_amount - dream.current_amount)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" className="flex-1" onClick={() => handleOpenContributionDialog(dream)}>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Adicionar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(dream)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(dream.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sonhos Concluídos */}
          {concluidos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Sonhos Realizados ({concluidos.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {concluidos.map((dream) => (
                  <Card key={dream.id} className="opacity-75 border-green-600">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {dream.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Concluído em {dream.completed_at ? new Date(dream.completed_at).toLocaleDateString('pt-BR') : '-'}
                      </p>
                      <p className="text-sm font-semibold mt-2">
                        Valor: {formatCurrency(dream.target_amount)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {dreams.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum sonho cadastrado ainda</p>
              <p className="text-sm">Comece adicionando seus objetivos financeiros!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDream ? 'Editar' : 'Novo'} Sonho</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Título do Sonho</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Casa própria" required />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor da Meta (R$)</Label>
                <Input type="number" step="0.01" value={formData.target_amount} onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Valor Atual (R$)</Label>
                <Input type="number" step="0.01" value={formData.current_amount} onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Alvo</Label>
                <Input type="date" value={formData.target_date} onChange={(e) => setFormData({ ...formData, target_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Prioridade (1-5)</Label>
                <Input type="number" min="1" max="5" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingDream ? 'Atualizar' : 'Criar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Contribuição */}
      <Dialog open={isContributionDialogOpen} onOpenChange={setIsContributionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Contribuição</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Sonho:</p>
              <p className="font-semibold">{contributingDream?.title}</p>
            </div>
            <div className="space-y-2">
              <Label>Valor da Contribuição (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                placeholder="0,00"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsContributionDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddContribution}>Adicionar Contribuição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
