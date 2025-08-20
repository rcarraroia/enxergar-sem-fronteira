
import React, { useState, useEffect, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, MapPin, Clock, Users, Eye } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { PatientRegistrationForm } from '@/components/PatientRegistrationForm'
import { RegistrationSuccessModal } from '@/components/RegistrationSuccessModal'
import { toast } from 'sonner'

interface EventDate {
  id: string
  date: string
  start_time: string
  end_time: string
  total_slots: number
  available_slots: number
}

interface Event {
  id: string
  title: string
  description: string
  location: string
  address: string
  city: string
  status: string
  event_dates: EventDate[]
}

const Registration = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [selectedEventDate, setSelectedEventDate] = useState<EventDate | null>(null)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return

      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          location,
          address,
          city,
          status,
          event_dates (
            id,
            date,
            start_time,
            end_time,
            total_slots,
            available_slots
          )
        `)
        .eq('id', eventId)
        .single()

      if (error) {
        console.error('Erro ao carregar evento:', error)
        toast.error('Evento não encontrado')
        navigate('/')
        return
      }

      setEvent(data as Event)
      setLoading(false)
    }

    fetchEvent()
  }, [eventId, navigate])

  const handleSelectDate = (eventDate: EventDate) => {
    if (eventDate.available_slots <= 0) {
      toast.error('Esta data não possui mais vagas disponíveis')
      return
    }
    setSelectedEventDate(eventDate)
    setShowRegistrationForm(true)
  }

  const handleRegistrationSuccess = () => {
    setShowRegistrationForm(false)
    setShowSuccessModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Evento não encontrado</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')}>
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Enxergar sem Fronteiras</h1>
          </div>
        </div>

        {/* Event Info */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{event.title}</CardTitle>
              <Badge 
                variant={event.status === 'open' ? 'default' : 'secondary'}
              >
                {event.status === 'open' ? 'Inscrições Abertas' : 'Fechado'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-muted-foreground mb-4">
                  {event.description || 'Atendimento oftalmológico gratuito para a comunidade'}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="ml-6">{event.address}, {event.city}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Datas Disponíveis</h3>
                <div className="space-y-2">
                  {event.event_dates.map((eventDate) => (
                    <Card key={eventDate.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center text-sm font-medium">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(eventDate.date).toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Clock className="h-4 w-4 mr-2" />
                            {eventDate.start_time} - {eventDate.end_time}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Users className="h-4 w-4 mr-2" />
                            {eventDate.available_slots} vagas disponíveis
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSelectDate(eventDate)}
                          disabled={eventDate.available_slots <= 0 || event.status !== 'open'}
                          size="sm"
                        >
                          {eventDate.available_slots <= 0 ? 'Esgotado' : 'Inscrever-se'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form Modal */}
        {showRegistrationForm && selectedEventDate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Formulário de Inscrição</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowRegistrationForm(false)}
                >
                  ✕
                </Button>
              </div>
              <div className="p-4">
                <Suspense fallback={<div>Carregando formulário...</div>}>
                  <PatientRegistrationForm
                    eventDateId={selectedEventDate.id}
                    onSuccess={handleRegistrationSuccess}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <RegistrationSuccessModal
            isOpen={showSuccessModal}
            onClose={() => {
              setShowSuccessModal(false)
              navigate('/')
            }}
          />
        )}
      </div>
    </div>
  )
}

export default Registration
