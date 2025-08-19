
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Users, 
  UserCheck, 
  Building2, 
  Heart, 
  Settings,
  Activity,
  RefreshCw,
  Shield,
  FileText,
  BarChart3,
  Plus,
  Eye
} from 'lucide-react'
import { useAdminMetrics } from '@/hooks/useAdminMetrics'
import { useRecentActivity } from '@/hooks/useRecentActivity'
import { useSystemAlerts } from '@/hooks/useSystemAlerts'
import { MetricCard } from '@/components/admin/MetricCard'
import { AlertBanner } from '@/components/admin/AlertBanner'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { QuickActions } from '@/components/admin/QuickActions'

const Admin = () => {
  const navigate = useNavigate()
  const { data: metrics, isLoading: metricsLoading } = useAdminMetrics()
  const { data: activities = [], isLoading: activitiesLoading } = useRecentActivity()
  const { data: alerts = [], isLoading: alertsLoading } = useSystemAlerts()

  const handleCreateEvent = () => {
    navigate('/admin/events')
  }

  const handleViewTodayRegistrations = () => {
    navigate('/admin/registrations')
  }

  const handleExportReports = () => {
    // TODO: Implementar exportação de relatórios
    console.log('Exportar relatórios')
  }

  const handleSendReminders = () => {
    // TODO: Implementar envio de lembretes
    console.log('Enviar lembretes')
  }

  const handleAlertAction = (actionUrl: string) => {
    navigate(actionUrl)
  }

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema Enxergar sem Fronteiras
          </p>
        </div>
        <Button onClick={handleCreateEvent} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      {/* Alertas do Sistema */}
      {!alertsLoading && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.slice(0, 3).map((alert) => (
            <AlertBanner
              key={alert.id}
              alert={alert}
              onAction={handleAlertAction}
            />
          ))}
        </div>
      )}

      {/* Cards Operacionais Principais */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Operações Principais</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Eventos"
            icon={Calendar}
            value={metrics?.totalEvents || 0}
            subtitle={`${metrics?.activeEvents || 0} eventos ativos`}
            trend={{
              value: metrics?.thisWeekEvents || 0,
              label: "novos esta semana",
              isPositive: true
            }}
            actions={[
              { label: "Gerenciar Eventos", onClick: () => navigate('/admin/events') },
              { label: "Ver Calendário", onClick: () => navigate('/admin/events') }
            ]}
          />

          <MetricCard
            title="Pacientes"
            icon={Users}
            value={metrics?.totalPatients || 0}
            subtitle="Total de cadastros"
            trend={{
              value: metrics?.newPatientsThisWeek || 0,
              label: "novos esta semana",
              isPositive: true
            }}
            actions={[
              { label: "Ver Pacientes", onClick: () => navigate('/admin/patients') },
              { label: "Ver Inscrições", onClick: () => navigate('/admin/registrations') }
            ]}
          />

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Organizadores Locais
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  {metrics?.totalOrganizers || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                Parceiros cadastrados
              </p>
              <div className="space-y-2">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/admin/organizers')}
                >
                  Gerenciar Organizadores
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/admin/organizers')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Relatórios
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  Campanhas de Arrecadação
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  R$ {(metrics?.totalDonations || 0).toLocaleString()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                Total arrecadado
              </p>
              <div className="space-y-2">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/admin/donations')}
                >
                  Ver Doações
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/admin/payments')}
                >
                  Gerenciar Pagamentos
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  Configurações
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                Configurações do sistema
              </p>
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => navigate('/admin/settings')}
              >
                Configurar Sistema
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção de Atividades e Ações Rápidas */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ActivityFeed activities={activities} />
        <QuickActions
          onCreateEvent={handleCreateEvent}
          onViewTodayRegistrations={handleViewTodayRegistrations}
          onExportReports={handleExportReports}
          onSendReminders={handleSendReminders}
        />
      </div>

      {/* Seção Sistema - Informações Técnicas */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Sistema</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                Sincronização
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate('/admin/sync')}
              >
                Ver Status
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-green-600" />
                Saúde do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">
                  {metrics?.systemHealth === 'healthy' ? 'Saudável' : 'Com problemas'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate('/admin')}
              >
                Ver Detalhes
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                Monitoramento
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate('/admin')}
              >
                Ver Métricas
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-orange-600" />
                Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate('/admin')}
              >
                Ver Logs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Admin
