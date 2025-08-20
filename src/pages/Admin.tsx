
import React from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/admin/MetricCard'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { QuickActions } from '@/components/admin/QuickActions'
import { NotificationTemplatesCard } from '@/components/admin/NotificationTemplatesCard'
import { useAdminMetrics } from '@/hooks/useAdminMetrics'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Calendar, Users, UserCheck, Activity } from 'lucide-react'

const Admin = () => {
  const { data: metrics, isLoading } = useAdminMetrics()

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  const navigate = useNavigate()

  const handleCreateEvent = () => {
    console.log('🎯 Admin: Navegando para criação de evento')
    navigate('/admin/events?action=create')
  }

  const handleCreateOrganizer = () => {
    console.log('🎯 Admin: Navegando para criação de organizador')
    navigate('/admin/organizers?action=create')
  }

  const handleViewTodayRegistrations = () => {
    console.log('🎯 Admin: Navegando para inscrições de hoje')
    const today = new Date().toISOString().split('T')[0]
    navigate(`/admin/registrations?date=${today}`)
  }

  const handleExportReports = async () => {
    console.log('🎯 Admin: Iniciando exportação de relatórios')
    try {
      // CORREÇÃO: Chamada para a Edge Function correta
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-admin-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: 'general',
          format: 'csv'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar relatório')
      }

      // Download do arquivo CSV
      const csvContent = await response.text()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `relatorio-geral-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      console.log('✅ Admin: Relatório exportado com sucesso')
      toast.success('Relatório exportado com sucesso!')
      
    } catch (error) {
      console.error('❌ Admin: Erro ao exportar relatório:', error)
      toast.error('Erro ao exportar relatório: ' + error.message)
    }
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
                onCreateOrganizer={handleCreateOrganizer}
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
