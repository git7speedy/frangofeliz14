import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, CreditCard } from 'lucide-react';
import { useCreditCards } from '@/hooks/useFinancialData';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard as CreditCardType } from '@/types/financial';

export default function CartoesCredito() {
  const { profile } = useAuth();
  const { cards, createCard, updateCard, deleteCard } = useCreditCards();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    bank_name: '',
    last_four_digits: '',
    card_limit: '',
    closing_day: '',
    due_day: '',
    color: '#EF4444',
  });

  const handleOpenDialog = (card?: CreditCardType) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        name: card.name,
        bank_name: card.bank_name || '',
        last_four_digits: card.last_four_digits || '',
        card_limit: String(card.card_limit || ''),
        closing_day: String(card.closing_day || ''),
        due_day: String(card.due_day || ''),
        color: card.color,
      });
    } else {
      setEditingCard(null);
      setFormData({ name: '', bank_name: '', last_four_digits: '', card_limit: '', closing_day: '', due_day: '', color: '#EF4444' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.store_id) return;

    const cardData = {
      ...formData,
      card_limit: formData.card_limit ? parseFloat(formData.card_limit) : undefined,
      closing_day: formData.closing_day ? parseInt(formData.closing_day) : undefined,
      due_day: formData.due_day ? parseInt(formData.due_day) : undefined,
      store_id: profile.store_id,
      is_active: true,
    };

    if (editingCard) {
      await updateCard.mutateAsync({ id: editingCard.id, ...cardData });
    } else {
      await createCard.mutateAsync(cardData as any);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cartão?')) {
      await deleteCard.mutateAsync(id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Cartões de Crédito</CardTitle>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Cartão
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <Card key={card.id} className="overflow-hidden">
                <div className="h-2" style={{ backgroundColor: card.color }} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" style={{ color: card.color }} />
                      <div>
                        <p className="font-semibold">{card.name}</p>
                        {card.bank_name && <p className="text-xs text-muted-foreground">{card.bank_name}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(card)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(card.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {card.last_four_digits && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Final:</span>
                        <span className="font-mono font-medium">**** {card.last_four_digits}</span>
                      </div>
                    )}
                    {card.card_limit && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Limite:</span>
                        <span className="font-medium">{formatCurrency(card.card_limit)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Fechamento:</span>
                      <span className="font-medium">Dia {card.closing_day || '-'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Vencimento:</span>
                      <span className="font-medium">Dia {card.due_day || '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {cards.length === 0 && (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                Nenhum cartão de crédito cadastrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCard ? 'Editar' : 'Novo'} Cartão de Crédito</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Cartão</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banco</Label>
                <Input value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>4 Últimos Dígitos</Label>
                <Input maxLength={4} value={formData.last_four_digits} onChange={(e) => setFormData({ ...formData, last_four_digits: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Limite (R$)</Label>
              <Input type="number" step="0.01" value={formData.card_limit} onChange={(e) => setFormData({ ...formData, card_limit: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dia de Fechamento</Label>
                <Input type="number" min="1" max="31" value={formData.closing_day} onChange={(e) => setFormData({ ...formData, closing_day: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Dia de Vencimento</Label>
                <Input type="number" min="1" max="31" value={formData.due_day} onChange={(e) => setFormData({ ...formData, due_day: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingCard ? 'Atualizar' : 'Criar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
