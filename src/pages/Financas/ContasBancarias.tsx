import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Wallet, TrendingUp } from 'lucide-react';
import { useBankAccounts } from '@/hooks/useFinancialData';
import { useAuth } from '@/hooks/useAuth';
import { BankAccount } from '@/types/financial';

export default function ContasBancarias() {
  const { profile } = useAuth();
  const { accounts, createAccount, updateAccount, deleteAccount } = useBankAccounts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    bank_name: '',
    account_type: 'corrente' as 'corrente' | 'poupanca' | 'investimento' | 'outro',
    account_number: '',
    agency: '',
    initial_balance: '',
    color: '#10B981',
  });

  const handleOpenDialog = (account?: BankAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        bank_name: account.bank_name || '',
        account_type: account.account_type || 'corrente',
        account_number: account.account_number || '',
        agency: account.agency || '',
        initial_balance: String(account.initial_balance),
        color: account.color,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        bank_name: '',
        account_type: 'corrente',
        account_number: '',
        agency: '',
        initial_balance: '0',
        color: '#10B981',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.store_id) return;

    const accountData = {
      ...formData,
      initial_balance: parseFloat(formData.initial_balance),
      store_id: profile.store_id,
      is_active: true,
    };

    if (editingAccount) {
      await updateAccount.mutateAsync({ id: editingAccount.id, ...accountData });
    } else {
      await createAccount.mutateAsync(accountData as any);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      await deleteAccount.mutateAsync(id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Contas Bancárias</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Saldo Total: <span className="font-bold text-lg">{formatCurrency(totalBalance)}</span>
              </p>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <Card key={account.id} className="overflow-hidden">
                <div className="h-2" style={{ backgroundColor: account.color }} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" style={{ color: account.color }} />
                      <div>
                        <p className="font-semibold">{account.name}</p>
                        {account.bank_name && <p className="text-xs text-muted-foreground">{account.bank_name}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(account)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(account.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Saldo Atual</p>
                      <p className="text-xl font-bold">{formatCurrency(account.current_balance)}</p>
                    </div>
                    {account.account_number && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Conta:</span>
                        <span className="font-medium">{account.account_number}</span>
                      </div>
                    )}
                    {account.agency && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Agência:</span>
                        <span className="font-medium">{account.agency}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {accounts.length === 0 && (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                Nenhuma conta bancária cadastrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Editar' : 'Nova'} Conta Bancária</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Conta</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banco</Label>
                <Input value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.account_type} onValueChange={(value: any) => setFormData({ ...formData, account_type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                    <SelectItem value="investimento">Investimento</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agência</Label>
                <Input value={formData.agency} onChange={(e) => setFormData({ ...formData, agency: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Conta</Label>
                <Input value={formData.account_number} onChange={(e) => setFormData({ ...formData, account_number: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Saldo Inicial (R$)</Label>
              <Input type="number" step="0.01" value={formData.initial_balance} onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingAccount ? 'Atualizar' : 'Criar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
