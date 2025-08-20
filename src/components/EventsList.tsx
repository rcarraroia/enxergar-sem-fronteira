import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvents, Event } from '@/hooks/useEvents';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatTime } from '@/utils/timeFormat';

const EventsList = () => {
  const { data: events, isLoading, isError } = useEvents();
  const navigate = useNavigate();

  const handleEventRegistration = (eventId: string, eventDateId: string) => {
    console.log('🎯 Navegando para registro de evento específico:', { eventId, eventDateId })
    // Navegação simples e direta - SEM redirecionamento automático
    navigate(`/registration?eventId=${eventId}&eventDateId=${eventDateId}`)
  }

  const formatWeekday = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long'
    });
  };

  const getOccupancyPercentage = (available: number, total: number) => {
    return ((total - available) / total) * 100;
  };

  if (isLoading) {
    return <div>Carregando eventos...</div>;
  }

  if (isError) {
    return <div>Erro ao carregar eventos.</div>;
  }

  if (!events || events.length === 0) {
    return <div>Nenhum evento encontrado.</div>;
  }

  return (
    <section id="events" className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-8">
          Próximos Eventos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: Event) => (
            <Card key={event.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <CardHeader className="p-4">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {event.title} - {event.city}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {event.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {event.event_dates && event.event_dates.length > 0 ? (
                  event.event_dates.map((date) => (
                    <div key={date.id} className="mb-4 border-b pb-4 last:border-b-0">
                      <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-100">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-gray-900">{formatDate(date.date)}</div>
                          <div className="text-sm text-gray-500 capitalize">{formatWeekday(date.date)}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-100">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-gray-900">{formatTime(date.start_time)} - {formatTime(date.end_time)}</div>
                          <div className="text-sm text-gray-500">Atendimento contínuo</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-100">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-gray-900">{event.location}</div>
                          <div className="text-sm text-gray-500">{event.address}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-100">
                        <Users className="h-5 w-5 text-secondary" />
                        <div>
                          <div className="font-medium text-gray-900">{date.available_slots} vagas disponíveis</div>
                          <div className="text-sm text-success">{getOccupancyPercentage(date.available_slots, date.total_slots).toFixed(0)}% preenchido</div>
                        </div>
                      </div>

                      <Button className="w-full mt-4" onClick={() => handleEventRegistration(event.id, date.id)}>
                        Inscrever-se
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">
                      Não há datas disponíveis para este evento.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventsList;
