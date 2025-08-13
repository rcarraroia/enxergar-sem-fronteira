
import React from 'react'
import { useEvents } from '@/hooks/useEvents'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Users, Clock, Loader2 } from 'lucide-react'

export const EventsList = () => {
  const { data: events, isLoading, error } = useEvents()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando eventos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Erro ao carregar eventos</p>
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum evento disponível no momento</p>
      </div>
    )
  }

  return (
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
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{new Date(event.date).toLocaleDateString('pt-BR')}</span>
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
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
