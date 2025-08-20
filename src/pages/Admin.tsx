
import React from 'react'
import Header from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/admin/MetricCard'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { QuickActions } from '@/components/admin/QuickActions'
import { NotificationTemplatesCard } from '@/components/admin/NotificationTemplatesCard'
import { useAdminMetrics } from '@/hooks/useAdminMetrics'
import { Calendar, Users, UserCheck, Activity } from 'lucide-react'

const Admin = () => {
  const { data: metrics, isLoading } = useAdminMetrics()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  const handleCreateEvent = () => {
    console.log('Criar evento')
  }

  const handleViewTodayRegistrations = () => {
    console.log('Ver inscrições de hoje')
  }

  const handleExportReports = () => {
    console.log('Exportar relatórios')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">
            Gerencie o sistema Enxergar sem Fronteiras
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total de Eventos"
            value={metrics?.totalEvents || 0}
            icon={Calendar}
            trend={{ value: 12, label: "último mês", isPositive: true }}
          />
          <MetricCard
            title="Inscrições Ativas"
            value={metrics?.totalRegistrations || 0}
            icon={Users}
            trend={{ value: 8, label: "última semana", isPositive: true }}
          />
          <MetricCard
            title="Pacientes Cadastrados"
            value={metrics?.totalPatients || 0}
            icon={UserCheck}
            trend={{ value: 15, label: "último mês", isPositive: true }}
          />
          <MetricCard
            title="Taxa de Ocupação"
            value={`${metrics?.occupancyRate || 0}%`}
            icon={Activity}
            trend={{ value: 5, label: "média mensal", isPositive: true }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickActions 
                onCreateEvent={handleCreateEvent}
                onViewTodayRegistrations={handleViewTodayRegistrations}
                onExportReports={handleExportReports}
              />
            </CardContent>
          </Card>

          {/* Notification Templates */}
          <NotificationTemplatesCard />
        </div>

        {/* Activity Feed */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed activities={[]} />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Admin
