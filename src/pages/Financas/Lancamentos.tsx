import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
} from 'lucide-react';
import { useFinancialTransactions } from '@/hooks/useFinancialTransactions';
import { useFinancialCategories, useBankAccounts, useCreditCards } from '@/hooks/useFinancialData';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FinancialTransaction, TransactionType, TransactionStatus } from '@/types/financial';
import { useEffect } from 'react';

interface LancamentosProps {
  triggerNew?: { type: 'receita' | 'despesa' | null };
  onTriggerComplete?: () => void;
}

export default function Lancamentos({ triggerNew, onTriggerComplete }: LancamentosProps) {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);

  const { transactions, isLoading, createTransaction, updateTransaction, deleteTransaction, duplicateTransaction } = 
    useFinancialTransactions({
      searchTerm: searchTerm || undefined,
      type: filterType !== 'todos' ? filterType as TransactionType : undefined,
      status: filterStatus !== 'todos' ? filterStatus as TransactionStatus : undefined,
    });

  const { categories } = useFinancialCategories();
  const { accounts } = useBankAccounts();
  const { cards } = useCreditCards();

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Form state
  const [formData, setFormData] = useState({
    type: 'despesa' as TransactionType,
    description: '',
    amount: '',
    transaction_date: getTodayDate(),
    category_id: '',
    bank_account_id: '',
    credit_card_id: '',
    status: 'pendente' as TransactionStatus,
    payment_method: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      type: 'despesa',
      description: '',
      amount: '',
      transaction_date: getTodayDate(),
      category_id: '',
      bank_account_id: '',
      credit_card_id: '',
      status: 'pendente',
      payment_method: '',
      notes: '',
    });
    setEditingTransaction(null);
  };

  // Effect to handle trigger from parent component
  useEffect(() => {
    if (triggerNew?.type) {
      resetForm();
      setFormData(prev => ({ ...prev, type: triggerNew.type as TransactionType }));
      setIsDialogOpen(true);
      if (onTriggerComplete) {
        onTriggerComplete();
      }
    }
  }, [triggerNew, onTriggerComplete]);

  const handleOpenDialog = (transaction?: FinancialTransaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        type: transaction.type,
        description: transaction.description,
        amount: String(transaction.amount),
        transaction_date: transaction.transaction_date,
        category_id: transaction.category_id || '',
        bank_account_id: transaction.bank_account_id || '',
        credit_card_id: transaction.credit_card_id || '',
        status: transaction.status,
        payment_method: transaction.payment_method || '',
        notes: transaction.notes || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.store_id) return;

    // Prepare transaction data, converting empty strings to null for UUID fields
    const transactionData = {
      type: formData.type,
      description: formData.description,
      amount: parseFloat(formData.amount),
      transaction_date: formData.transaction_date,
      status: formData.status,
      payment_method: formData.payment_method || null,
      notes: formData.notes || null,
      category_id: formData.category_id || null,
      bank_account_id: formData.bank_account_id || null,
      credit_card_id: formData.credit_card_id || null,
      store_id: profile.store_id,
      created_by: profile.id,
      is_recurring: false,
    };

    if (editingTransaction) {
      await updateTransaction.mutateAsync({ id: editingTransaction.id, ...transactionData });
    } else {
      await createTransaction.mutateAsync(transactionData as any);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      await deleteTransaction.mutateAsync(id);
    }
  };

  const handleDuplicate = async (transaction: FinancialTransaction) => {
    await duplicateTransaction.mutateAsync(transaction);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const variants: Record<TransactionStatus, any> = {
      pendente: 'secondary',
      pago: 'default',
      recebido: 'default',
      cancelado: 'destructive',
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const getTypeBadge = (type: TransactionType) => {
    const colors: Record<TransactionType, string> = {
      receita: 'text-green-600',
      despesa: 'text-red-600',
      transferencia: 'text-blue-600',
    };
    const icons: Record<TransactionType, any> = {
      receita: ArrowUpCircle,
      despesa: ArrowDownCircle,
      transferencia: Calendar,
    };
    const Icon = icons[type];
    return (
      <div className={`flex items-center gap-1 ${colors[type]}`}>
        <Icon className="h-4 w-4" />
        <span className="capitalize">{type}</span>
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12">Carregando lançamentos...</div>;
  }

  const filteredCategories = categories.filter(cat => cat.type === formData.type.replace('transferencia', 'despesa'));

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Ações */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Lançamentos Financeiros</CardTitle>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Lançamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="receita">Receitas</SelectItem>
                <SelectItem value="despesa">Despesas</SelectItem>
                <SelectItem value="transferencia">Transferências</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="recebido">Recebido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de Lançamentos */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhum lançamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>{transaction.category?.name || '-'}</TableCell>
                      <TableCell>
                        {transaction.bank_account?.name || transaction.credit_card?.name || '-'}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDialog(transaction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDuplicate(transaction)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(transaction.id)}
                          >
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

      {/* Dialog de Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as TransactionType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Pagamento de fornecedor"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as TransactionStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="recebido">Recebido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria (opcional)</Label>
                <Select
                  value={formData.category_id || undefined}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Input
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  placeholder="Ex: Pix, Dinheiro"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Conta Bancária (opcional)</Label>
                <Select
                  value={formData.bank_account_id || undefined}
                  onValueChange={(value) => setFormData({ ...formData, bank_account_id: value, credit_card_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cartão de Crédito (opcional)</Label>
                <Select
                  value={formData.credit_card_id || undefined}
                  onValueChange={(value) => setFormData({ ...formData, credit_card_id: value, bank_account_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    {cards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingTransaction ? 'Atualizar' : 'Criar'} Lançamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
