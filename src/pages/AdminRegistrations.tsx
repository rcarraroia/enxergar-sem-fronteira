
import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useEventsAdmin } from '@/hooks/useEventsAdmin'
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
  BarChart3
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const AdminRegistrations = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { events } = useEventsAdmin()
  const [selectedEventId, setSelectedEventId] = useState<string>('all')

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const getTotalRegistrations = () => {
    return events?.reduce((total, event) => {
      return total + (event.total_slots - event.available_slots)
    }, 0) || 0
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
                  <p className="text-sm font-medium text-muted-foreground">Eventos Ativos</p>
                  <p className="text-2xl font-bold">{stats.openEvents}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Eventos Lotados</p>
                  <p className="text-2xl font-bold">{stats.fullEvents}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600" />
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
                {events?.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} - {new Date(event.date).toLocaleDateString('pt-BR')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Lista de Inscrições */}
        <RegistrationsList 
          eventId={selectedEventId === 'all' ? undefined : selectedEventId}
          showEventInfo={selectedEventId === 'all'}
        />
      </main>
    </div>
  )
}

export default AdminRegistrations
