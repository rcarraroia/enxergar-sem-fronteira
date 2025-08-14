
import React, { useState } from 'react'
import { PatientRegistrationForm } from '@/components/PatientRegistrationForm'
import { useEvents } from '@/hooks/useEvents'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Users, Clock, Loader2, UserPlus } from 'lucide-react'

export default function Registration() {
  const { data: events, isLoading, error } = useEvents()
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleRegisterClick = (eventId: string) => {
    setSelectedEventId(eventId)
    setShowRegistrationForm(true)
  }

  const handleFormClose = () => {
    setShowRegistrationForm(false)
    setSelectedEventId(null)
  }

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
              <Button variant="outline" onClick={handleFormClose}>
                Voltar aos Eventos
              </Button>
            </div>
            <PatientRegistrationForm 
              selectedEventId={selectedEventId} 
              onSuccess={handleFormClose}
            />
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
                {events.map((event) => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <Badge variant={event.available_slots > 0 ? "default" : "secondary"}>
                          {event.available_slots > 0 ? "Vagas Disponíveis" : "Lotado"}
                        </Badge>
                      </div>
                      <CardDescription>{event.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{event.start_time} às {event.end_time}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{event.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-primary" />
                        <span>{event.available_slots} de {event.total_slots} vagas disponíveis</span>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {event.address}
                      </div>

                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={event.available_slots === 0}
                        onClick={() => handleRegisterClick(event.id)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {event.available_slots === 0 ? 'Evento Lotado' : 'Realizar Cadastro'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
