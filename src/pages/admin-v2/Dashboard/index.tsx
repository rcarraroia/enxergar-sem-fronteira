/**
 * NOVO PAINEL ADMINISTRATIVO - DASHBOARD
 * Versão reconstruída sem React Error #310
 */

import { ActivityFeed } from "@/components/admin-v2/Dashboard/ActivityFeed";
import { QuickActions } from "@/components/admin-v2/Dashboard/QuickActions";
import { StatsChart } from "@/components/admin-v2/Dashboard/StatsChart";
import { SystemAlerts } from "@/components/admin-v2/Dashboard/SystemAlerts";
import { AdminLayout } from "@/components/admin-v2/shared/Layout";
import { MetricCard } from "@/components/admin-v2/shared/MetricCard";
import { useAdminMetricsV2 } from "@/hooks/admin-v2/useAdminMetrics";
import { Activity, Calendar, UserCheck, Users } from "lucide-react";

const AdminDashboard = () => {
  const { data: metrics, isLoading, error } = useAdminMetricsV2();

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard" breadcrumbs={[{ label: "Dashboard", path: "/admin-v2" }]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando métricas...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Dashboard" breadcrumbs={[{ label: "Dashboard", path: "/admin-v2" }]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Erro ao carregar dashboard</p>
            <p className="text-sm text-muted-foreground">Verifique sua conexão e tente novamente</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Dashboard Administrativo"
      breadcrumbs={[{ label: "Dashboard", path: "/admin-v2" }]}
    >
      {/* System Alerts */}
      <div className="mb-8">
        <React.Suspense fallback={<div>Carregando alertas...</div>}>
          <SystemAlerts />
        </React.Suspense>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total de Eventos"
          value={metrics?.totalEvents || 0}
          icon={Calendar}
          trend={{ value: 12, direction: "up", period: "último mês" }}
          loading={isLoading}
        />
        <MetricCard
          title="Inscrições Ativas"
          value={metrics?.totalRegistrations || 0}
          icon={Users}
          trend={{ value: 8, direction: "up", period: "última semana" }}
          loading={isLoading}
        />
        <MetricCard
          title="Pacientes Cadastrados"
          value={metrics?.totalPatients || 0}
          icon={UserCheck}
          trend={{ value: 15, direction: "up", period: "último mês" }}
          loading={isLoading}
        />
        <MetricCard
          title="Taxa de Ocupação"
          value={`${metrics?.occupancyRate || 0}%`}
          icon={Activity}
          trend={{ value: 5, direction: "up", period: "média mensal" }}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div>
          <React.Suspense fallback={<div>Carregando ações...</div>}>
            <QuickActions />
          </React.Suspense>
        </div>

        {/* Activity Feed */}
        <div>
          <React.Suspense fallback={<div>Carregando atividades...</div>}>
            <ActivityFeed />
          </React.Suspense>
        </div>

        {/* Stats Chart */}
        <div>
          <React.Suspense fallback={<div>Carregando gráficos...</div>}>
            <StatsChart />
          </React.Suspense>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
