
import React, { useEffect, useState } from 'react'
import { OrganizerLayout } from '@/components/organizer/OrganizerLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Users, 
  CalendarPlus, 
  TrendingUp,
  Clock,
  MapPin,
  Plus,
  Eye,
  FileText,
  Settings
} from 'lucide-react'
import { useOrganizerEvents } from '@/hooks/useOrganizerEvents'
import { useOrganizerRegistrations } from '@/hooks/useOrganizerRegistrations'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const OrganizerDashboard = () => {
  const { events, loading: eventsLoading } = useOrganizerEvents()
  const { stats, loading: statsLoading } = useOrganizerRegistrations()
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])

  useEffect(() => {
    if (events.length > 0) {
      // Filtrar eventos próximos (próximos 7 dias)
      const today = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(today.getDate() + 7)

      const upcoming = events
        .filter(event => 
          event.event_dates?.some(date => {
            const eventDate = new Date(date.date)
            return eventDate >= today && eventDate <= nextWeek
          })
        )
        .slice(0, 5)

      setUpcomingEvents(upcoming)
    }
  }, [events])

  const activeEvents = events.filter(event => event.status === 'open').length
  const totalRegistrations = stats?.totalRegistrations || 0
  const thisWeekRegistrations = stats?.thisWeekRegistrations || 0

  const quickActions = [
    {
      title: 'Criar Novo Evento',
      description: 'Organize um novo evento',
      icon: Plus,
      href: '/organizer/events/new',
      color: 'bg-blue-500'
    },
    {
      title: 'Ver Todos os Eventos',
      description: 'Gerencie seus eventos',
      icon: Calendar,
      href: '/organizer/events',
      color: 'bg-green-500'
    },
    {
      title: 'Relatório de Inscrições',
      description: 'Veja estatísticas detalhadas',
      icon: FileText,
      href: '/organizer/registrations',
      color: 'bg-purple-500'
    },
    {
      title: 'Configurar Perfil',
      description: 'Atualize suas informações',
      icon: Settings,
      href: '/organizer/profile',
      color: 'bg-orange-500'
    }
  ]

  if (eventsLoading || statsLoading) {
    return (
      <OrganizerLayout>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </OrganizerLayout>
    )
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Bem-vindo ao seu painel de controle. Aqui você pode gerenciar seus eventos e acompanhar as inscrições.
          </p>
        </div>

        {/* Métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Total de Eventos
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-sm text-muted-foreground">
                {activeEvents} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-2">
                  <CalendarPlus className="h-4 w-4 text-green-600" />
                  Eventos Ativos
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeEvents}</div>
              <p className="text-sm text-muted-foreground">
                Recebendo inscrições
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Total de Inscrições
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalRegistrations}</div>
              <p className="text-sm text-muted-foreground">
                Todas as inscrições
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Inscrições esta Semana
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{thisWeekRegistrations}</div>
              <p className="text-sm text-muted-foreground">
                Últimos 7 dias
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ações rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Link key={index} to={action.href}>
                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className={`inline-flex p-2 rounded-lg ${action.color} text-white mb-3`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {action.description}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Próximos eventos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Próximos Eventos (7 dias)
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/organizer/events">
                <Eye className="h-4 w-4 mr-2" />
                Ver Todos
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.city}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.registrations_count || 0} inscrições
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {event.event_dates?.map((date: any) => {
                        const eventDate = new Date(date.date)
                        const today = new Date()
                        const nextWeek = new Date()
                        nextWeek.setDate(today.getDate() + 7)
                        
                        if (eventDate >= today && eventDate <= nextWeek) {
                          return (
                            <div key={date.id} className="text-sm">
                              <div className="font-medium">
                                {format(eventDate, 'dd/MM', { locale: ptBR })}
                              </div>
                              <div className="text-gray-500">
                                {date.start_time}
                              </div>
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum evento programado para os próximos 7 dias</p>
                <Button className="mt-4" asChild>
                  <Link to="/organizer/events/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Novo Evento
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Eventos recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Eventos Recentes</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/organizer/events">Ver Todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.city}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.registrations_count || 0} inscrições
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        event.status === 'open' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status === 'open' ? 'Ativo' : 'Inativo'}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/organizer/events/${event.id}/edit`}>
                          Editar
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Você ainda não criou nenhum evento</p>
                <Button className="mt-4" asChild>
                  <Link to="/organizer/events/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Evento
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OrganizerLayout>
  )
}

export default OrganizerDashboard
