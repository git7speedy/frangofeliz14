import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';

// Importar componentes dos módulos
import DashboardFinanceiro from '@/pages/Financas/DashboardFinanceiro';
import Lancamentos from '@/pages/Financas/Lancamentos';
import Categorias from '@/pages/Financas/Categorias';
import ContasBancarias from '@/pages/Financas/ContasBancarias';
import CartoesCredito from '@/pages/Financas/CartoesCredito';
import ContasReceber from '@/pages/Financas/ContasReceber';
import QuadroSonhos from '@/pages/Financas/QuadroSonhos';
import Relatorios from '@/pages/Financas/Relatorios';

export default function Financas() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [triggerNewTransaction, setTriggerNewTransaction] = useState<{ type: 'receita' | 'despesa' | null }>({ type: null });

  const handleNewTransaction = (type: 'receita' | 'despesa') => {
    setActiveTab('lancamentos');
    setTimeout(() => {
      setTriggerNewTransaction({ type });
    }, 100);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Finanças</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas, despesas e objetivos financeiros
          </p>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2 h-auto p-1">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          
          <TabsTrigger value="lancamentos" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Lançamentos</span>
          </TabsTrigger>
          
          <TabsTrigger value="contas" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Contas</span>
          </TabsTrigger>
          
          <TabsTrigger value="cartoes" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Cartões</span>
          </TabsTrigger>
          
          <TabsTrigger value="receber" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">A Receber</span>
          </TabsTrigger>
          
          <TabsTrigger value="sonhos" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Sonhos</span>
          </TabsTrigger>
          
          <TabsTrigger value="categorias" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            <span className="hidden sm:inline">Categorias</span>
          </TabsTrigger>
          
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <DashboardFinanceiro onNewTransaction={handleNewTransaction} />
        </TabsContent>

        {/* Lançamentos */}
        <TabsContent value="lancamentos" className="space-y-6">
          <Lancamentos 
            triggerNew={triggerNewTransaction}
            onTriggerComplete={() => setTriggerNewTransaction({ type: null })}
          />
        </TabsContent>

        {/* Contas Bancárias */}
        <TabsContent value="contas" className="space-y-6">
          <ContasBancarias />
        </TabsContent>

        {/* Cartões de Crédito */}
        <TabsContent value="cartoes" className="space-y-6">
          <CartoesCredito />
        </TabsContent>

        {/* Contas a Receber */}
        <TabsContent value="receber" className="space-y-6">
          <ContasReceber />
        </TabsContent>

        {/* Quadro de Sonhos */}
        <TabsContent value="sonhos" className="space-y-6">
          <QuadroSonhos />
        </TabsContent>

        {/* Categorias */}
        <TabsContent value="categorias" className="space-y-6">
          <Categorias />
        </TabsContent>

        {/* Relatórios */}
        <TabsContent value="relatorios" className="space-y-6">
          <Relatorios />
        </TabsContent>
      </Tabs>
    </div>
  );
}
