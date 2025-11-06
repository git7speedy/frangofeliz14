import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { useBankAccounts } from '@/hooks/useFinancialData';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AccountReceivable } from '@/types/financial';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ContasReceber() {
  const { profile } = useAuth();
  const { receivables, createReceivable, updateReceivable, markAsReceived, deleteReceivable } = useAccountsReceivable();
  const { accounts } = useBankAccounts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<AccountReceivable | null>(null);
  const [receivingAccount, setReceivingAccount] = useState<AccountReceivable | null>(null);
  const [receiveData, setReceiveData] = useState({ bank_account_id: '', payment_method: '' });

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    description: '',
    amount: '',
    due_date: getTodayDate(),
  });

  const handleOpenDialog = (receivable?: AccountReceivable) => {
    if (receivable) {
      setEditingReceivable(receivable);
      setFormData({
        customer_name: receivable.customer_name || '',
        customer_phone: receivable.customer_phone || '',
        description: receivable.description,
        amount: String(receivable.amount),
        due_date: receivable.due_date,
      });
    } else {
      setEditingReceivable(null);
      setFormData({ customer_name: '', customer_phone: '', description: '', amount: '', due_date: getTodayDate() });
    }
    setIsDialogOpen(true);
  };

  const handleOpenReceiveDialog = (receivable: AccountReceivable) => {
    setReceivingAccount(receivable);
    setReceiveData({ bank_account_id: '', payment_method: '' });
    setIsReceiveDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.store_id) return;

    const data = {
      customer_name: formData.customer_name || null,
      customer_phone: formData.customer_phone || null,
      description: formData.description,
      amount: parseFloat(formData.amount),
      due_date: formData.due_date,
      store_id: profile.store_id,
      status: 'pendente' as const,
    };

    if (editingReceivable) {
      await updateReceivable.mutateAsync({ id: editingReceivable.id, ...data });
    } else {
      await createReceivable.mutateAsync(data as any);
    }
    setIsDialogOpen(false);
  };

  const handleMarkAsReceived = async () => {
    if (!receivingAccount) return;
    await markAsReceived.mutateAsync({
      id: receivingAccount.id,
      bankAccountId: receiveData.bank_account_id || undefined,
      paymentMethod: receiveData.payment_method || undefined,
    });
    setIsReceiveDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      await deleteReceivable.mutateAsync(id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pendente: 'secondary',
      recebido: 'default',
      atrasado: 'destructive',
      cancelado: 'outline',
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const pendentes = receivables.filter(r => r.status === 'pendente' || r.status === 'atrasado');
  const recebidos = receivables.filter(r => r.status === 'recebido');
  const totalPendente = pendentes.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Contas a Receber</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Total Pendente: <span className="font-bold text-lg text-orange-600">{formatCurrency(totalPendente)}</span>
              </p>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma conta a receber encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  receivables.map((receivable) => (
                    <TableRow key={receivable.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{receivable.customer_name || 'N/A'}</p>
                          {receivable.customer_phone && <p className="text-xs text-muted-foreground">{receivable.customer_phone}</p>}
                        </div>
                      </TableCell>
                      <TableCell>{receivable.description}</TableCell>
                      <TableCell>
                        {format(new Date(receivable.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(receivable.amount)}</TableCell>
                      <TableCell>{getStatusBadge(receivable.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {receivable.status === 'pendente' && (
                            <Button size="sm" variant="ghost" onClick={() => handleOpenReceiveDialog(receivable)}>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(receivable)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(receivable.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReceivable ? 'Editar' : 'Nova'} Conta a Receber</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={formData.customer_phone} onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingReceivable ? 'Atualizar' : 'Criar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Marcar como Recebido */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Recebido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Conta Bancária (opcional)</Label>
              <Select value={receiveData.bank_account_id || undefined} onValueChange={(value) => setReceiveData({ ...receiveData, bank_account_id: value })}>
                <SelectTrigger><SelectValue placeholder="Selecione uma conta" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Input value={receiveData.payment_method} onChange={(e) => setReceiveData({ ...receiveData, payment_method: e.target.value })} placeholder="Ex: Pix" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleMarkAsReceived}>Confirmar Recebimento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
