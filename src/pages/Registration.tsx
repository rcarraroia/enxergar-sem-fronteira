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
import { formatTime, formatDate } from '@/utils/timeFormat'

export default function Registration() {
  const { data: events, isLoading, error } = useEvents()
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedEventDateId, setSelectedEventDateId] = useState<string | null>(null)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [searchParams] = useSearchParams()

  // Verificar se há eventId e eventDateId na URL
  useEffect(() => {
    const eventIdFromUrl = searchParams.get('eventId')
    const eventDateIdFromUrl = searchParams.get('eventDateId')
    
    console.log('🔍 Parâmetros da URL:', { eventIdFromUrl, eventDateIdFromUrl })
    
    if (eventIdFromUrl && events) {
      const event = events.find(e => e.id === eventIdFromUrl)
      if (event) {
        setSelectedEventId(eventIdFromUrl)
        
        // Se eventDateId foi fornecido, usar esse
        if (eventDateIdFromUrl) {
          const eventDate = event.event_dates.find(ed => ed.id === eventDateIdFromUrl)
          if (eventDate) {
            setSelectedEventDateId(eventDateIdFromUrl)
            setShowRegistrationForm(true)
            console.log('✅ Evento e data selecionados automaticamente da URL')
          }
        } else if (event.event_dates.length === 1) {
          // Se só há uma data, seleciona automaticamente
          setSelectedEventDateId(event.event_dates[0].id)
          setShowRegistrationForm(true)
          console.log('✅ Única data do evento selecionada automaticamente')
        } else {
          // Se há múltiplas datas, mostrar seleção
          setShowRegistrationForm(true)
          console.log('📅 Múltiplas datas disponíveis, aguardando seleção')
        }
      }
    }
  }, [searchParams, events])

  const handleRegisterClick = (eventId: string) => {
    console.log('🎯 Iniciando cadastro para evento:', eventId)
    const event = events?.find(e => e.id === eventId)
    
    if (!event) {
      console.error('❌ Evento não encontrado:', eventId)
      return
    }

    setSelectedEventId(eventId)
    
    // Se o evento tem apenas uma data, seleciona automaticamente
    if (event.event_dates.length === 1) {
      setSelectedEventDateId(event.event_dates[0].id)
      setShowRegistrationForm(true)
    } else {
      // Se tem múltiplas datas, vai para seleção de data
      setSelectedEventDateId(null)
      setShowRegistrationForm(true)
    }
  }

  const handleDateSelection = (dateId: string) => {
    console.log('📅 Data selecionada:', dateId)
    setSelectedEventDateId(dateId)
  }

  const handleFormClose = () => {
    console.log('✅ Formulário fechado com sucesso')
    setTimeout(() => {
      setShowRegistrationForm(false)
      setSelectedEventId(null)
      setSelectedEventDateId(null)
    }, 100)
  }

  const handleBackToEvents = () => {
    console.log('🔙 Voltando para lista de eventos')
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Realizar Cadastro</h2>
              <Button variant="outline" onClick={handleBackToEvents}>
                Voltar aos Eventos
              </Button>
            </div>

            {/* Mostrar informações do evento selecionado */}
            {selectedEvent && (
              <Card>
                <CardHeader>
                  <CardTitle>Evento Selecionado</CardTitle>
                  <CardDescription>{selectedEvent.city}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{selectedEvent.location}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedEvent.address}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                    <Select onValueChange={handleDateSelection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma data" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedEvent.event_dates.map((eventDate) => (
                          <SelectItem key={eventDate.id} value={eventDate.id}>
                            {formatDate(eventDate.date)} - {formatTime(eventDate.start_time)} às {formatTime(eventDate.end_time)} 
                            ({eventDate.available_slots} vagas disponíveis)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mostrar informações da data selecionada */}
            {selectedEvent && selectedEventDateId && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Selecionada</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const selectedDate = selectedEvent.event_dates.find(ed => ed.id === selectedEventDateId)
                    if (!selectedDate) return <p>Data não encontrada</p>
                    
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>{formatDate(selectedDate.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>{formatTime(selectedDate.start_time)} às {formatTime(selectedDate.end_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <span>{selectedDate.available_slots} vagas disponíveis</span>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Formulário de cadastro */}
            {selectedEventDateId && (
              <PatientRegistrationForm 
                eventId={selectedEventId || undefined} 
                eventDateId={selectedEventDateId}
                onSuccess={handleFormClose}
              />
            )}
          </div>
        ) : (
          <section>
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
                                <span>{formatTime(eventDate.start_time)} às {formatTime(eventDate.end_time)}</span>
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
