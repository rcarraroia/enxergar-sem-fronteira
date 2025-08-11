
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, Eye, ArrowRight } from 'lucide-react';

const EventsSection = () => {
  const events = [
    {
      id: 1,
      title: 'Consultas Oftalmológicas - Centro',
      date: '15 Jan 2025',
      time: '08:00 - 17:00',
      location: 'Centro Comunitário São Paulo',
      address: 'Rua das Flores, 123 - Centro, São Paulo/SP',
      availableSlots: 127,
      totalSlots: 200,
      status: 'open'
    },
    {
      id: 2,
      title: 'Atendimento Itinerante - Zona Sul',
      date: '22 Jan 2025',
      time: '08:00 - 16:00',
      location: 'UBS Vila Madalena',
      address: 'Av. Paulista, 456 - Vila Madalena, São Paulo/SP',
      availableSlots: 89,
      totalSlots: 150,
      status: 'open'
    },
    {
      id: 3,
      title: 'Triagem Oftalmológica - Zona Norte',
      date: '29 Jan 2025',
      time: '09:00 - 15:00',
      location: 'Centro de Saúde Santana',
      address: 'Rua do Norte, 789 - Santana, São Paulo/SP',
      availableSlots: 45,
      totalSlots: 100,
      status: 'filling'
    },
    {
      id: 4,
      title: 'Consultas Especializadas - ABC',
      date: '05 Fev 2025',
      time: '08:00 - 17:00',
      location: 'Hospital Regional ABC',
      address: 'Av. Industrial, 321 - Santo André/SP',
      availableSlots: 0,
      totalSlots: 80,
      status: 'full'
    }
  ];

  const getStatusInfo = (status: string, available: number, total: number) => {
    switch (status) {
      case 'open':
        return {
          badge: 'Inscrições Abertas',
          variant: 'default' as const,
          bgColor: 'bg-secondary/10',
          textColor: 'text-secondary'
        };
      case 'filling':
        return {
          badge: 'Vagas Limitadas',
          variant: 'secondary' as const,
          bgColor: 'bg-warning/10',
          textColor: 'text-warning'
        };
      case 'full':
        return {
          badge: 'Lotado',
          variant: 'destructive' as const,
          bgColor: 'bg-destructive/10',
          textColor: 'text-destructive'
        };
      default:
        return {
          badge: 'Inscrições Abertas',
          variant: 'default' as const,
          bgColor: 'bg-secondary/10',
          textColor: 'text-secondary'
        };
    }
  };

  return (
    <section id="events" className="py-20 bg-medical-bg">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Calendar className="h-4 w-4 text-primary mr-2" />
            <span className="text-primary font-semibold text-sm">Agenda de Eventos</span>
          </div>
          
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Próximos Atendimentos
          </h2>
          <p className="text-subtitle text-muted-foreground max-w-2xl mx-auto">
            Confira nossa agenda de atendimentos oftalmológicos gratuitos. 
            Cadastre-se nos eventos disponíveis em sua região.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
          {events.map((event, index) => {
            const statusInfo = getStatusInfo(event.status, event.availableSlots, event.totalSlots);
            const occupancyPercentage = ((event.totalSlots - event.availableSlots) / event.totalSlots) * 100;
            
            return (
              <Card key={event.id} className={`p-6 medical-card animate-slide-up stagger-${(index % 4) + 1} hover:shadow-medical transition-all duration-300`}>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">{event.title}</h3>
                        <Badge variant={statusInfo.variant} className="mt-1">
                          {statusInfo.badge}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-muted-foreground">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">{event.date}</span>
                      <Clock className="h-4 w-4 text-primary ml-4" />
                      <span>{event.time}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-3 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{event.location}</span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-7">{event.address}</p>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className={`p-4 rounded-lg ${statusInfo.bgColor}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">Vagas</span>
                      </div>
                      <span className={`font-semibold ${statusInfo.textColor}`}>
                        {event.availableSlots} de {event.totalSlots}
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${occupancyPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {occupancyPercentage.toFixed(0)}% preenchido
                    </p>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className={`w-full ${event.status === 'full' ? 'opacity-50 cursor-not-allowed' : 'btn-hero group'}`}
                    disabled={event.status === 'full'}
                  >
                    {event.status === 'full' ? 'Evento Lotado' : 'Inscrever-se'}
                    {event.status !== 'full' && (
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12 animate-fade-in">
          <Card className="p-8 medical-card max-w-2xl mx-auto">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Não encontrou uma data?</h3>
              <p className="text-muted-foreground">
                Cadastre-se em nossa lista de espera e seja notificado sobre novos eventos em sua região.
              </p>
              <Button className="btn-secondary-hero">
                Entrar na Lista de Espera
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
