import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Table as TableIcon, Sheet } from 'lucide-react';
import { useFinancialTransactions, useCategorySummary, useMonthlyEvolution } from '@/hooks/useFinancialTransactions';
import { useFinancialData } from '@/hooks/useFinancialData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Relatorios() {
  // Helper function to get date in YYYY-MM-DD format
  const getDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get first day of current month
  const getFirstDayOfMonth = () => {
    const today = new Date();
    return getDateString(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getDateString(new Date()));
  const [reportType, setReportType] = useState('mensal');

  const { transactions } = useFinancialTransactions({ startDate, endDate });
  const { categorySummary } = useCategorySummary(startDate, endDate);
  const { evolution } = useMonthlyEvolution(12);
  const { summary } = useFinancialData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const exportToCSV = () => {
    let csvContent = '';
    let fileName = '';

    if (reportType === 'transacoes') {
      csvContent = 'Data,Tipo,Descrição,Categoria,Valor,Status\n';
      transactions.forEach(t => {
        csvContent += `${t.transaction_date},${t.type},${t.description},${t.category?.name || ''},${t.amount},${t.status}\n`;
      });
      fileName = 'transacoes.csv';
    } else if (reportType === 'categorias') {
      csvContent = 'Categoria,Tipo,Total,Transações,Porcentagem\n';
      categorySummary.forEach(c => {
        csvContent += `${c.category.name},${c.category.type},${c.total},${c.transactionCount},${c.percentage.toFixed(2)}%\n`;
      });
      fileName = 'categorias.csv';
    } else if (reportType === 'mensal') {
      csvContent = 'Mês,Receitas,Despesas,Saldo\n';
      evolution.forEach(e => {
        csvContent += `${e.month},${e.receitas},${e.despesas},${e.saldo}\n`;
      });
      fileName = 'evolucao_mensal.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const exportToPDF = () => {
    alert('Exportação para PDF será implementada em breve!');
  };

  const totalReceitas = transactions.filter(t => t.type === 'receita' && (t.status === 'recebido' || t.status === 'pago')).reduce((sum, t) => sum + Number(t.amount), 0);
  const totalDespesas = transactions.filter(t => t.type === 'despesa' && (t.status === 'recebido' || t.status === 'pago')).reduce((sum, t) => sum + Number(t.amount), 0);
  const saldoPeriodo = totalReceitas - totalDespesas;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros do Relatório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Evolução Mensal</SelectItem>
                  <SelectItem value="categorias">Por Categoria</SelectItem>
                  <SelectItem value="transacoes">Transações Detalhadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} className="gap-2">
              <Sheet className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={exportToPDF} className="gap-2">
              <FileText className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Período */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receitas do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalReceitas)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDespesas)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldoPeriodo)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relatório por Categoria */}
      {reportType === 'categorias' && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categorySummary.length > 0 ? (
                categorySummary.map((cat) => (
                  <div key={cat.category.id} className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.category.color }} />
                      <div>
                        <p className="font-medium">{cat.category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cat.transactionCount} {cat.transactionCount === 1 ? 'transação' : 'transações'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(cat.total)}</p>
                      <p className="text-xs text-muted-foreground">{cat.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relatório de Evolução Mensal */}
      {reportType === 'mensal' && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evolution.length > 0 ? (
                evolution.map((month) => (
                  <div key={month.month} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">{month.month}</p>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <p className="text-muted-foreground">Receitas</p>
                        <p className="font-semibold text-green-600">{formatCurrency(month.receitas)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Despesas</p>
                        <p className="font-semibold text-red-600">{formatCurrency(month.despesas)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Saldo</p>
                        <p className={`font-semibold ${month.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(month.saldo)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relatório de Transações */}
      {reportType === 'transacoes' && (
        <Card>
          <CardHeader>
            <CardTitle>Transações Detalhadas ({transactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.transaction_date), 'dd/MM/yyyy', { locale: ptBR })} - {transaction.category?.name || 'Sem categoria'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'receita' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{transaction.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma transação encontrada</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
