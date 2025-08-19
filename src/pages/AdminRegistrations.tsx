
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
  BarChart3,
  Download,
  FileText
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

const AdminRegistrations = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { events } = useEventsAdmin()
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const [selectedCity, setSelectedCity] = useState<string>('all')

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const getTotalRegistrations = () => {
    if (!events) return 0
    
    let filteredEvents = events
    
    // Filtrar por cidade se selecionada
    if (selectedCity !== 'all') {
      filteredEvents = events.filter(event => event.city === selectedCity)
    }
    
    // Filtrar por evento específico se selecionado
    if (selectedEventId !== 'all') {
      filteredEvents = events.filter(event => event.id === selectedEventId)
    }
    
    return filteredEvents.reduce((total, event) => {
      const eventTotal = event.event_dates.reduce((sum, date) => sum + (date.total_slots - date.available_slots), 0)
      return total + eventTotal
    }, 0)
  }

  const getEventStats = () => {
    if (!events) return { totalEvents: 0, openEvents: 0, fullEvents: 0 }
    
    return {
      totalEvents: events.length,
      openEvents: events.filter(e => e.status === 'open').length,
      fullEvents: events.filter(e => e.status === 'full').length
    }
  }

  const handleExportCSV = () => {
    // Implementar exportação CSV
    toast.info('Exportando relatório em CSV...')
  }

  const handleExportPDF = () => {
    // Implementar exportação PDF
    toast.info('Gerando relatório em PDF...')
  }

  const stats = getEventStats()

  // Criar opções do select com informações das datas e cidades
  const eventOptions = events?.map(event => {
    const dates = event.event_dates.map(ed => 
      new Date(ed.date + 'T00:00:00').toLocaleDateString('pt-BR')
    ).join(', ')
    
    return {
      id: event.id,
      city: event.city,
      dates: dates,
      label: `${event.city} - ${dates}`
    }
  }) || []

  // Obter cidades únicas
  const cities = [...new Set(events?.map(event => event.city) || [])]

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

        {/* Filtros e Relatórios */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros e Relatórios</CardTitle>
            <CardDescription>
              Selecione os filtros para visualizar inscrições específicas e gere relatórios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Filtro por Cidade */}
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Cidades</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro por Evento */}
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Eventos</SelectItem>
                  {eventOptions.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Botões de Exportação */}
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>

              <Button variant="outline" onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Gerar PDF
              </Button>
            </div>
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
