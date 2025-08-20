
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useEvents } from '@/hooks/useEvents'
import PatientRegistrationForm from '@/components/PatientRegistrationForm'
import { RegistrationSuccessModal } from '@/components/RegistrationSuccessModal'
import Header from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, Users } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const Registration = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data: events, isLoading } = useEvents()
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [registeredPatientName, setRegisteredPatientName] = useState('')

  // Pegar parâmetros da URL
  const eventId = searchParams.get('eventId')
  const eventDateId = searchParams.get('eventDateId')

  useEffect(() => {
    if (!eventId || !eventDateId) {
      navigate('/', { replace: true })
    }
  }, [eventId, eventDateId, navigate])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  if (!eventId || !eventDateId) {
    return null
  }

  const event = events?.find(e => e.id === eventId)
  const eventDate = event?.event_dates?.find(ed => ed.id === eventDateId)

  if (!event || !eventDate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Evento não encontrado</h1>
            <p className="text-muted-foreground mb-4">
              O evento que você está procurando não existe ou não está mais disponível.
            </p>
            <Button onClick={() => navigate('/events')}>
              Ver Eventos Disponíveis
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Verificar se ainda há vagas disponíveis
  if (eventDate.available_slots <= 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Evento Lotado</h1>
            <p className="text-muted-foreground mb-4">
              Infelizmente, não há mais vagas disponíveis para esta data do evento.
            </p>
            <Button onClick={() => navigate('/events')}>
              Ver Outras Datas Disponíveis
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const handleRegistrationSuccess = (patientName: string) => {
    setRegisteredPatientName(patientName)
    setShowSuccessModal(true)
  }

  const handleCloseModal = () => {
    setShowSuccessModal(false)
    navigate('/')
  }

  const formatEventDate = (dateString: string, timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':')
      const date = new Date(dateString + 'T00:00:00')
      date.setHours(parseInt(hours), parseInt(minutes))
      
      return format(date, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
        locale: ptBR
      })
    } catch (error) {
      return `${dateString} às ${timeString}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Event Info */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {event.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Informações do Evento</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatEventDate(eventDate.date, eventDate.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{eventDate.start_time} - {eventDate.end_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Vagas: {eventDate.available_slots}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Form */}
          <PatientRegistrationForm 
            eventDateId={eventDateId}
            onSuccess={handleRegistrationSuccess}
          />
        </div>
      </main>

      <Footer />

      {showSuccessModal && (
        <RegistrationSuccessModal 
          isOpen={showSuccessModal}
          onClose={handleCloseModal}
          eventInfo={{
            city: event.city,
            title: event.title,
            date: eventDate.date,
            start_time: eventDate.start_time,
            end_time: eventDate.end_time,
            location: event.location,
            address: event.address
          }}
          patientName={registeredPatientName}
        />
      )}
    </div>
  )
}

export default Registration
