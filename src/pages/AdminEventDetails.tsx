
import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEventsAdmin } from '@/hooks/useEventsAdmin'
import { RegistrationsList } from '@/components/admin/RegistrationsList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  Edit,
  Loader2,
  Mail
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

const AdminEventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { events, isLoading } = useEventsAdmin()
  const { sendEventReminder, isLoading: isLoadingEmail } = useNotifications()

  const event = events?.find(e => e.id === eventId)

  const getStatusBadge = (status: string, availableSlots: number) => {
    if (status === 'full' || availableSlots === 0) {
      return <Badge variant="secondary">Lotado</Badge>
    }
    if (status === 'closed') {
      return <Badge variant="destructive">Fechado</Badge>
    }
    return <Badge variant="default">Aberto</Badge>
  }

  const handleSendReminders = () => {
    // Esta funcionalidade será expandida quando tivermos acesso aos dados de inscrição
    console.log('Enviando lembretes para participantes do evento:', event?.title)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Carregando evento...
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Evento não encontrado</h2>
          <Button onClick={() => navigate('/admin/events')}>
            Voltar para Eventos
          </Button>
        </div>
      </div>
    )
  }

  const registeredCount = event.total_slots - event.available_slots

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/admin/events')}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Detalhes do Evento</h1>
                <p className="text-sm text-muted-foreground">{event.title}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleSendReminders}
                disabled={isLoadingEmail}
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar Lembretes
              </Button>
              <Button onClick={() => navigate('/admin/events')}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Evento
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Informações do Evento */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{event.title}</CardTitle>
              {getStatusBadge(event.status, event.available_slots)}
            </div>
            {event.description && (
              <CardDescription className="text-base mt-2">
                {event.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Data</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Horário</p>
                  <p className="text-sm text-muted-foreground">
                    {event.start_time} - {event.end_time}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Local</p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Vagas</p>
                  <p className="text-sm text-muted-foreground">
                    {registeredCount}/{event.total_slots} inscritos
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="font-medium mb-2">Endereço Completo:</p>
              <p className="text-muted-foreground">{event.address}</p>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Inscrições */}
        <RegistrationsList eventId={eventId} />
      </main>
    </div>
  )
}

export default AdminEventDetails
