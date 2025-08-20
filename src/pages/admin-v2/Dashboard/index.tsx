/**
 * NOVO PAINEL ADMINISTRATIVO - DASHBOARD
 * Versão reconstruída sem React Error #310
 */

import React from 'react'
import { AdminLayout } from '@/components/admin-v2/shared/Layout'
import { MetricCard } from '@/components/admin-v2/shared/MetricCard'
import { ActivityFeed } from '@/components/admin-v2/Dashboard/ActivityFeed'
import { QuickActions } from '@/components/admin-v2/Dashboard/QuickActions'
import { StatsChart } from '@/components/admin-v2/Dashboard/StatsChart'
import { SystemAlerts } from '@/components/admin-v2/Dashboard/SystemAlerts'
import { useAdminMetricsV2 } from '@/hooks/admin-v2/useAdminMetrics'
import { Calendar, Users, UserCheck, Activity } from 'lucide-react'

const AdminDashboard = () => {
  const { data: metrics, isLoading } = useAdminMetricsV2()

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard" breadcrumbs={[{ label: 'Dashboard', path: '/admin-v2' }]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando métricas...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      title="Dashboard Administrativo" 
      breadcrumbs={[{ label: 'Dashboard', path: '/admin-v2' }]}
    >
      {/* Status de Reconstrução */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <h3 className="font-semibold text-blue-900">🚧 Painel em Reconstrução - Fase 2</h3>
        </div>
        <p className="text-blue-700 text-sm mt-1">
          Dashboard funcional com dados reais implementado. 
          Sistema principal (home, cadastro) permanece intocado e operacional.
        </p>
      </div>

      {/* System Alerts */}
      <div className="mb-8">
        <SystemAlerts />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total de Eventos"
          value={metrics?.totalEvents || 0}
          icon={Calendar}
          trend={{ value: 12, direction: 'up', period: 'último mês' }}
          loading={isLoading}
        />
        <MetricCard
          title="Inscrições Ativas"
          value={metrics?.totalRegistrations || 0}
          icon={Users}
          trend={{ value: 8, direction: 'up', period: 'última semana' }}
          loading={isLoading}
        />
        <MetricCard
          title="Pacientes Cadastrados"
          value={metrics?.totalPatients || 0}
          icon={UserCheck}
          trend={{ value: 15, direction: 'up', period: 'último mês' }}
          loading={isLoading}
        />
        <MetricCard
          title="Taxa de Ocupação"
          value={`${metrics?.occupancyRate || 0}%`}
          icon={Activity}
          trend={{ value: 5, direction: 'up', period: 'média mensal' }}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <QuickActions />

        {/* Activity Feed */}
        <ActivityFeed />

        {/* Stats Chart */}
        <StatsChart />
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard