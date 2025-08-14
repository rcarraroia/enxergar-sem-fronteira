
import React, { useState, useEffect } from 'react'
import { PatientRegistrationForm } from '@/components/PatientRegistrationForm'
import { useEvents } from '@/hooks/useEvents'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Calendar, MapPin, Users, Clock, Loader2, UserPlus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

export default function Registration() {
  const { data: events, isLoading, error } = useEvents()
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedEventDateId, setSelectedEventDateId] = useState<string | null>(null)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [searchParams] = useSearchParams()

  // Verificar se há eventId na URL
  useEffect(() => {
    const eventIdFromUrl = searchParams.get('eventId')
    if (eventIdFromUrl && events) {
      const event = events.find(e => e.id === eventIdFromUrl)
      if (event) {
        setSelectedEventId(eventIdFromUrl)
        // Se só há uma data, seleciona automaticamente
        if (event.event_dates.length === 1) {
          setSelectedEventDateId(event.event_dates[0].id)
        }
      }
    }
  }, [searchParams, events])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleRegisterClick = (eventId: string, eventDateId?: string) => {
    setSelectedEventId(eventId)
    if (eventDateId) {
      setSelectedEventDateId(eventDateId)
    }
    setShowRegistrationForm(true)
  }

  const handleFormClose = () => {
    setTimeout(() => {
      setShowRegistrationForm(false)
      setSelectedEventId(null)
      setSelectedEventDateId(null)
    }, 100)
  }

  const handleBackToEvents = () => {
    setShowRegistrationForm(false)
    setSelectedEventId(null)
    setSelectedEventDateId(null)
  }

  const selectedEvent = events?.find(e => e.id === selectedEventId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando eventos...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center py-8">
            <p className="text-destructive">Erro ao carregar eventos</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Enxergar sem Fronteiras
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Cadastre-se para participar de nossos eventos oftalmológicos gratuitos e 
            transforme sua visão e qualidade de vida.
          </p>
        </div>

        {showRegistrationForm ? (
          <div className="space-y-6" key="registration-form">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Realizar Cadastro</h2>
              <Button variant="outline" onClick={handleBackToEvents}>
                Voltar aos Eventos
              </Button>
            </div>

            {/* Seleção de data se o evento tem múltiplas datas */}
            {selectedEvent && selectedEvent.event_dates.length > 1 && !selectedEventDateId && (
              <Card>
                <CardHeader>
                  <CardTitle>Selecione a Data</CardTitle>
                  <CardDescription>
                    Este evento possui múltiplas datas. Escolha a que melhor se adequa à sua agenda.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label htmlFor="event-date">Data do Evento</Label>
                    <Select onValueChange={setSelectedEventDateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma data" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedEvent.event_dates.map((eventDate) => (
                          <SelectItem key={eventDate.id} value={eventDate.id}>
                            {formatDate(eventDate.date)} - {eventDate.start_time} às {eventDate.end_time} 
                            ({eventDate.available_slots} vagas disponíveis)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedEventDateId && (
              <PatientRegistrationForm 
                eventId={selectedEventId} 
                eventDateId={selectedEventDateId}
                onSuccess={handleFormClose}
              />
            )}
          </div>
        ) : (
          <section key="events-list">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Eventos Disponíveis
            </h2>
            
            {!events || events.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-8">Nenhum evento disponível no momento</p>
                <Card className="max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle>Lista de Espera</CardTitle>
                    <CardDescription>
                      Cadastre-se para ser notificado sobre novos eventos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => setShowRegistrationForm(true)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Entrar na Lista de Espera
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => {
                  const totalAvailable = event.event_dates.reduce((sum, date) => sum + date.available_slots, 0)
                  const totalSlots = event.event_dates.reduce((sum, date) => sum + date.total_slots, 0)
                  
                  return (
                    <Card key={event.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <Badge variant={totalAvailable > 0 ? "default" : "secondary"}>
                            {totalAvailable > 0 ? "Vagas Disponíveis" : "Lotado"}
                          </Badge>
                        </div>
                        <CardDescription>{event.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Mostrar todas as datas */}
                        <div className="space-y-3">
                          {event.event_dates.map((eventDate, index) => (
                            <div key={eventDate.id} className="border-l-2 border-primary pl-3 space-y-2">
                              <div className="text-sm font-medium">Data {index + 1}</div>
                              
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span>{formatDate(eventDate.date)}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-primary" />
                                <span>{eventDate.start_time} às {eventDate.end_time}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-primary" />
                                <span>{eventDate.available_slots} de {eventDate.total_slots} vagas disponíveis</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 text-sm pt-2 border-t">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{event.location}</span>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {event.address}
                        </div>

                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={totalAvailable === 0}
                          onClick={() => handleRegisterClick(event.id)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          {totalAvailable === 0 ? 'Evento Lotado' : 'Realizar Cadastro'}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
