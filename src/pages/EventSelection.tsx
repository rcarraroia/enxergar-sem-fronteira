import { Footer } from '@/components/Footer';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvents } from '@/hooks/useEvents';
import { formatDate, formatTime } from '@/utils/timeFormat';
import { ArrowRight, Calendar, Clock, Loader2, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EventSelection = () => {
  const navigate = useNavigate();
  const { data: events, isLoading } = useEvents();
  const handleDateSelection = (eventId: string, eventDateId: string) => {
    navigate(`/registro?eventId=${eventId}&eventDateId=${eventDateId}`);
  };

  const formatWeekday = (dateString: string) => {
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Carregando eventos...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold mb-4">Nenhum evento disponível</h1>
            <p className="text-muted-foreground mb-8">
              Não há eventos abertos para inscrição no momento.
            </p>
            <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Selecione um Evento</h1>
            <p className="text-muted-foreground">
              Escolha o evento e a data que melhor se adequa à sua agenda.
            </p>
          </div>

          <div className="space-y-6">
            {events.map(event => (
              <Card key={event.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{event.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{event.address}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Datas Disponíveis:</h3>

                    <div className="grid gap-3">
                      {event.event_dates.map(eventDate => {
                        const isAvailable = eventDate.available_slots > 0;
                        const occupancyPercentage =
                          eventDate.total_slots > 0
                            ? ((eventDate.total_slots - eventDate.available_slots) /
                                eventDate.total_slots) *
                              100
                            : 0;

                        return (
                          <div
                            key={eventDate.id}
                            className={`p-4 border rounded-lg transition-all ${
                              isAvailable
                                ? 'border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10'
                                : 'border-gray-200 bg-gray-50 opacity-60'
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Data e horário */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  <span className="font-medium">{formatDate(eventDate.date)}</span>
                                  <span className="text-sm text-muted-foreground capitalize">
                                    ({formatWeekday(eventDate.date)})
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-primary" />
                                  <span className="text-sm">
                                    {formatTime(eventDate.start_time)} -{' '}
                                    {formatTime(eventDate.end_time)}
                                  </span>
                                </div>
                              </div>

                              {/* Vagas e status */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-secondary" />
                                  <span className="text-sm">
                                    {eventDate.available_slots} vagas disponíveis
                                  </span>
                                </div>

                                <Badge
                                  variant={isAvailable ? 'default' : 'secondary'}
                                  className="w-fit"
                                >
                                  {isAvailable ? 'Inscrições Abertas' : 'Lotado'}
                                </Badge>
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-primary h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${occupancyPercentage}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {occupancyPercentage.toFixed(0)}% preenchido
                                </p>
                              </div>

                              {/* Botão de inscrição */}
                              <div className="pt-2">
                                <Button
                                  onClick={() => handleDateSelection(event.id, eventDate.id)}
                                  disabled={!isAvailable}
                                  className="w-full sm:w-auto"
                                  size="default"
                                >
                                  {isAvailable ? (
                                    <>
                                      Inscrever-se
                                      <ArrowRight className="h-4 w-4 ml-2" />
                                    </>
                                  ) : (
                                    'Lotado'
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventSelection;
