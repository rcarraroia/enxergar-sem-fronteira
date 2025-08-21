/**
 * ADMIN V2 - GESTÃO DE EVENTOS
 * Sistema completo de CRUD de eventos
 */

import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AdminLayout } from '@/components/admin-v2/shared/Layout'
import { DataTable } from '@/components/admin-v2/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  MapPin,
  Clock,
  Users,
  AlertCircle
} from 'lucide-react'
import { useEventsV2, type EventV2, type EventFilters } from '@/hooks/admin-v2/useEventsV2'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const AdminEventsV2 = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<EventFilters>({
    search: searchParams.get('search') || '',
    status: 'all'
  })

  const { data: events = [], isLoading, error } = useEventsV2(filters)

  const handleCreateEvent = () => {
    navigate('/admin-v2/events/create')
  }

  const handleEditEvent = (event: EventV2) => {
    navigate(`/admin-v2/events/edit/${event.id}`)
  }

  const handleViewEvent = (event: EventV2) => {
    navigate(`/admin-v2/events/view/${event.id}`)
  }

  const handleDeleteEvent = async (event: EventV2) => {
    // Funcionalidade de deletar temporariamente desabilitada
    alert('Funcionalidade de exclusão temporariamente indisponível')
  }

  const formatEventDates = (upcomingDates: any[]) => {
    if (!upcomingDates || upcomingDates.length === 0) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              A configurar
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            Datas serão configuradas
          </span>
        </div>
      )
    }

    const sortedDates = upcomingDates.sort((a, b) => a.date.localeCompare(b.date))
    const firstDate = sortedDates[0]
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    
    // Usar a data diretamente sem conversão de timezone
    const eventDateString = firstDate.date // YYYY-MM-DD
    const isUpcoming = eventDateString >= today

    // Converter apenas para exibição, mantendo a data local
    const [year, month, day] = eventDateString.split('-')
    const displayDate = `${day}/${month}/${year}`

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span className="text-sm">
            {displayDate}
          </span>
          <Badge 
            variant={isUpcoming ? 'default' : 'secondary'}
            className={isUpcoming ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
          >
            {isUpcoming ? 'Próximo' : 'Passado'}
          </Badge>
        </div>
        {upcomingDates.length > 1 && (
          <span className="text-xs text-muted-foreground">
            +{upcomingDates.length - 1} data(s) adicional(is)
          </span>
        )}
      </div>
    )
  }

  const columns = [
    {
      key: 'title',
      label: 'Evento',
      render: (value: string, event: EventV2) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {event.location}
          </div>
        </div>
      )
    },
    {
      key: 'city',
      label: 'Cidade',
      render: (value: string) => (
        <div className="text-sm">{value || 'N/A'}</div>
      )
    },
    {
      key: 'upcoming_dates',
      label: 'Datas',
      render: (value: any[], event: EventV2) => formatEventDates(value)
    },
    {
      key: 'occupied_slots',
      label: 'Ocupação',
      render: (value: number, event: EventV2) => {
        const totalSlots = event.total_slots || 0
        const occupiedSlots = value || 0
        const occupancyRate = event.occupancy_rate || 0
        
        return (
          <div className="text-center">
            <div className="text-sm font-medium">{occupiedSlots}/{totalSlots}</div>
            <div className="text-xs text-muted-foreground">
              {occupancyRate}% ocupado
            </div>
          </div>
        )
      }
    },
    {
      key: 'created_at',
      label: 'Criado em',
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
        </span>
      )
    }
  ]

  const actions = [
    {
      label: 'Visualizar',
      onClick: handleViewEvent,
      icon: Eye
    },
    {
      label: 'Editar',
      onClick: handleEditEvent,
      icon: Edit
    },
    {
      label: 'Excluir',
      onClick: handleDeleteEvent,
      variant: 'destructive' as const,
      icon: Trash2
    }
  ]

  if (error) {
    return (
      <AdminLayout 
        title="Gestão de Eventos" 
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Eventos', path: '/admin/events' }
        ]}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar eventos. Verifique sua conexão e tente novamente.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      title="Gestão de Eventos" 
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin-v2' },
        { label: 'Eventos', path: '/admin-v2/events' }
      ]}
      actions={
        <Button onClick={handleCreateEvent}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      }
    >


      <DataTable
        data={events}
        columns={columns}
        actions={actions}
        loading={isLoading}
        searchable={true}
        searchPlaceholder="Buscar eventos..."
        onSearch={(search) => setFilters(prev => ({ ...prev, search }))}
        emptyMessage="Nenhum evento encontrado. Clique em 'Novo Evento' para começar."
      />
    </AdminLayout>
  )
}

export default AdminEventsV2