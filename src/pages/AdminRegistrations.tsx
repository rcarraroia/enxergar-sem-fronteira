
import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useEventsAdmin } from '@/hooks/useEventsAdmin'
import { useRegistrations } from '@/hooks/useRegistrations'
import { RegistrationsList } from '@/components/admin/RegistrationsList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { 
  ArrowLeft,
  Users,
  Calendar,
  BarChart3,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const AdminRegistrations = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { events } = useEventsAdmin()
  const { data: allRegistrations } = useRegistrations()
  const [selectedEventId, setSelectedEventId] = useState<string>('all')

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const getTotalRegistrations = () => {
    if (!allRegistrations) return 0
    return allRegistrations.length
  }

  const getRegistrationsByStatus = (status: string) => {
    if (!allRegistrations) return 0
    return allRegistrations.filter(reg => reg.status === status).length
  }

  const getEventStats = () => {
    if (!events) return { totalEvents: 0, openEvents: 0, fullEvents: 0 }
    
    return {
      totalEvents: events.length,
      openEvents: events.filter(e => e.status === 'open').length,
      fullEvents: events.filter(e => e.status === 'full').length
    }
  }

  const stats = getEventStats()

  // Criar opções do select com informações detalhadas das datas
  const eventOptions = events?.flatMap(event => 
    event.event_dates.map(eventDate => ({
      id: eventDate.id, // Use event_date_id instead of event_id
      eventId: event.id,
      title: event.title,
      city: event.city,
      location: event.location,
      date: new Date(eventDate.date + 'T00:00:00').toLocaleDateString('pt-BR'),
      time: `${eventDate.start_time} - ${eventDate.end_time}`,
      displayName: `${event.city} - ${event.title} (${new Date(eventDate.date + 'T00:00:00').toLocaleDateString('pt-BR')})`
    }))
  ) || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/admin')}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Gestão de Inscrições</h1>
                <p className="text-sm text-muted-foreground">Visualizar e gerenciar participantes</p>
              </div>
            </div>
            
            <Button variant="outline" onClick={handleSignOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Estatísticas */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Inscrições</p>
                  <p className="text-2xl font-bold">{getTotalRegistrations()}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confirmadas</p>
                  <p className="text-2xl font-bold">{getRegistrationsByStatus('confirmed')}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{getRegistrationsByStatus('pending')}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Eventos</p>
                  <p className="text-2xl font-bold">{stats.totalEvents}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtro de Eventos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtrar por Evento</CardTitle>
            <CardDescription>
              Selecione um evento específico ou visualize todas as inscrições
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Selecione um evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Eventos</SelectItem>
                {eventOptions.map((eventDate) => (
                  <SelectItem key={eventDate.id} value={eventDate.id}>
                    {eventDate.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Lista de Inscrições */}
        <RegistrationsList 
          eventDateId={selectedEventId === 'all' ? undefined : selectedEventId}
          showEventInfo={selectedEventId === 'all'}
        />
      </main>
    </div>
  )
}

export default AdminRegistrations
