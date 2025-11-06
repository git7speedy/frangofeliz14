import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  DollarSign, 
  Plus,
  Download,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useCategorySummary, useMonthlyEvolution } from '@/hooks/useFinancialTransactions';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useState } from 'react';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];

interface DashboardFinanceiroProps {
  onNewTransaction: (type: 'receita' | 'despesa') => void;
}

export default function DashboardFinanceiro({ onNewTransaction }: DashboardFinanceiroProps) {
  const { summary, loadingSummary } = useFinancialData();
  const { categorySummary, isLoading: loadingCategories } = useCategorySummary();
  const { evolution, isLoading: loadingEvolution } = useMonthlyEvolution(6);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };

  // Dados para o gráfico de pizza
  const pieData = categorySummary
    .filter(cat => cat.category.type === 'despesa')
    .slice(0, 8)
    .map(cat => ({
      name: cat.category.name,
      value: cat.total,
      percentage: cat.percentage,
    }));

  // Dados para o gráfico de linha
  const lineData = evolution.map(item => ({
    month: formatMonth(item.month),
    Receitas: item.receitas,
    Despesas: item.despesas,
    Saldo: item.saldo,
  }));

  if (loadingSummary) {
    return <div className="flex items-center justify-center p-12">Carregando dados financeiros...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Saldo Total */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.totalContasBancarias || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Em contas bancárias
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
        </Card>

        {/* Receitas do Mês */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.totalReceitas || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total recebido
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600" />
        </Card>

        {/* Despesas do Mês */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary?.totalDespesas || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total pago
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600" />
        </Card>

        {/* Lucro Líquido */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className={`h-4 w-4 ${(summary?.lucroLiquido || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.lucroLiquido || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary?.lucroLiquido || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receitas - Despesas
            </p>
          </CardContent>
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${(summary?.lucroLiquido || 0) >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'}`} />
        </Card>
      </div>

      {/* Cards Adicionais */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Contas a Receber */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.totalContasReceber || 0)}
            </div>
            <p className="text-xs text-red-600 mt-1">
              Vencidas: {formatCurrency(summary?.totalContasVencidas || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" className="gap-2" onClick={() => onNewTransaction('receita')}>
              <Plus className="h-4 w-4" />
              Nova Receita
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => onNewTransaction('despesa')}>
              <Plus className="h-4 w-4" />
              Nova Despesa
            </Button>
            <Button size="sm" variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico de Pizza - Despesas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhuma despesa registrada
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Linha - Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `R$ ${value.toLocaleString()}`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="Receitas" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Despesas" stroke="#EF4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="Saldo" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Despesas */}
      <Card>
        <CardHeader>
          <CardTitle>Maiores Despesas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categorySummary
              .filter(cat => cat.category.type === 'despesa')
              .slice(0, 5)
              .map((cat, index) => (
                <div key={cat.category.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{cat.category.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({cat.transactionCount} {cat.transactionCount === 1 ? 'transação' : 'transações'})
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(cat.total)}</div>
                    <div className="text-sm text-muted-foreground">{cat.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            {categorySummary.filter(cat => cat.category.type === 'despesa').length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma despesa registrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
