
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  UserCheck, 
  DollarSign, 
  Settings,
  FileText,
  BarChart3,
  Plus
} from 'lucide-react';
import { SystemHealthCard } from '@/components/admin/SystemHealthCard';

const Admin = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Statistics queries
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      console.log('📊 Buscando estatísticas do admin...');
      
      const [patientsResult, eventsResult, registrationsResult, transactionsResult] = await Promise.all([
        supabase.from('patients').select('count'),
        supabase.from('events').select('count'),
        supabase.from('registrations').select('count'),
        supabase.from('asaas_transactions').select('amount')
      ]);

      const totalRevenue = transactionsResult.data?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

      return {
        patients: patientsResult.count || 0,
        events: eventsResult.count || 0,
        registrations: registrationsResult.count || 0,
        revenue: totalRevenue
      };
    },
    enabled: !!user && isAdmin
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
          <p className="text-muted-foreground mt-2">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
            <div className="flex items-center space-x-4">
              <Badge variant="default">Admin: {user?.email}</Badge>
              <Button variant="outline" onClick={() => signOut()}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* System Health Card */}
        <div className="mb-8">
          <SystemHealthCard />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.patients || 0}</div>
              <p className="text-xs text-muted-foreground">
                Pacientes cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Ativos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.events || 0}</div>
              <p className="text-xs text-muted-foreground">
                Eventos em andamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inscrições</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.registrations || 0}</div>
              <p className="text-xs text-muted-foreground">
                Inscrições confirmadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(stats?.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita acumulada
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/events')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Gerenciar Eventos
              </CardTitle>
              <CardDescription>
                Criar, editar e gerenciar eventos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Acessar Eventos
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/patients')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pacientes
              </CardTitle>
              <CardDescription>
                Ver e gerenciar pacientes cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Ver Pacientes
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/registrations')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Inscrições
              </CardTitle>
              <CardDescription>
                Gerenciar inscrições dos eventos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Ver Inscrições
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/payments')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pagamentos
              </CardTitle>
              <CardDescription>
                Gerenciar transações e pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Ver Pagamentos
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/sync')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Sincronização
              </CardTitle>
              <CardDescription>
                Monitorar integrações externas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Ver Sincronização
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/settings')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações
              </CardTitle>
              <CardDescription>
                Configurar sistema e integrações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
