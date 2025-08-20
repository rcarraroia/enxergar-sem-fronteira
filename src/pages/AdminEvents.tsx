
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useEventsAdmin, EventFormData } from '@/hooks/useEventsAdmin'
import { EventForm } from '@/components/admin/EventForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Search,
  Loader2
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { formatDate, formatTimeRange } from '@/utils/dateUtils'

type ViewMode = 'list' | 'create' | 'edit'

const AdminEvents = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useEventsAdmin()
  
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Verificar se deve abrir o formulário de criação automaticamente
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'create') {
      console.log('🎯 AdminEvents: Abrindo formulário de criação automaticamente')
      setViewMode('create')
      // Limpar o parâmetro da URL
      navigate('/admin/events', { replace: true })
    }
  }, [searchParams, navigate])

  const filteredEvents = events?.filter(event =>
    event.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.organizers?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleCreateEvent = (data: EventFormData) => {
    createEvent.mutate(data, {
      onSuccess: () => {
        setViewMode('list')
      }
    })
  }

  const handleUpdateEvent = (data: EventFormData & { id: string }) => {
    updateEvent.mutate(data, {
      onSuccess: () => {
        setViewMode('list')
        setSelectedEvent(null)
      }
    })
  }

  const handleDeleteEvent = (eventId: string) => {
    deleteEvent.mutate(eventId)
  }

  const handleEdit = (event: any) => {
    // Converter event_dates para o formato esperado pelo formulário
    const eventWithDates = {
      ...event,
      dates: event.event_dates || []
    }
    setSelectedEvent(eventWithDates)
    setViewMode('edit')
  }

  const getStatusBadge = (status: string, eventDates: any[]) => {
    const totalAvailable = eventDates?.reduce((sum, date) => sum + date.available_slots, 0) || 0
    
    if (status === 'full' || totalAvailable === 0) {
      return <Badge variant="secondary">Lotado</Badge>
    }
    if (status === 'closed') {
      return <Badge variant="destructive">Fechado</Badge>
    }
    return <Badge variant="default">Aberto</Badge>
  }



  if (viewMode === 'create') {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setViewMode('list')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Lista
          </Button>
        </div>
        <EventForm
          onSubmit={handleCreateEvent}
          onCancel={() => setViewMode('list')}
          isLoading={createEvent.isPending}
        />
      </div>
    )
  }

  if (viewMode === 'edit' && selectedEvent) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => {
              setViewMode('list')
              setSelectedEvent(null)
            }}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Lista
          </Button>
        </div>
        <EventForm
          initialData={selectedEvent}
          onSubmit={handleUpdateEvent}
          onCancel={() => {
            setViewMode('list')
            setSelectedEvent(null)
          }}
          isLoading={updateEvent.isPending}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Atendimentos</h1>
          <p className="text-muted-foreground">
            Crie e gerencie atendimentos oftalmológicos gratuitos com múltiplas datas
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/admin')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <Button onClick={() => setViewMode('create')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Atendimento
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por cidade, local ou organizador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Atendimentos Cadastrados</CardTitle>
          <CardDescription>
            {filteredEvents.length} atendimento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando atendimentos...</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum atendimento encontrado com este filtro' : 'Nenhum atendimento cadastrado'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Datas</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Vagas Totais</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const totalSlots = event.event_dates?.reduce((sum, date) => sum + date.total_slots, 0) || 0
                  const availableSlots = event.event_dates?.reduce((sum, date) => sum + date.available_slots, 0) || 0
                  
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{event.city}</div>
                          <div className="text-sm text-muted-foreground">
                            Org: {event.organizers?.name || 'Organizador Local'}
                          </div>
                          {event.description && (
                            <div className="text-sm text-muted-foreground">
                              {event.description.slice(0, 60)}
                              {event.description.length > 60 && '...'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {event.event_dates?.map((date, index) => (
                            <div key={date.id} className="text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(date.date)}
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground ml-4">
                                <Clock className="h-3 w-3" />
                                {formatTimeRange(date.start_time, date.end_time)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {availableSlots}/{totalSlots}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(event.status, event.event_dates || [])}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(event)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o atendimento em "{event.city}"? 
                                  Esta ação não pode ser desfeita e excluirá todas as datas e inscrições associadas.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminEvents
