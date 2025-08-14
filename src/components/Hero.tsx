import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, MapPin, Clock, Users, ArrowRight, Eye, Heart, Stethoscope } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useNavigate } from 'react-router-dom';
import { formatTime, formatDate } from '@/utils/timeFormat';

const Hero = () => {
  const { data: events } = useEvents();
  const navigate = useNavigate();
  
  // Pegar o próximo evento (primeiro da lista ordenada por data mais próxima)
  const nextEvent = events?.[0];
  const nextEventDate = nextEvent?.event_dates?.[0];

  const stats = [{
    icon: Eye,
    value: '10.000+',
    label: 'Consultas Realizadas'
  }, {
    icon: Heart,
    value: '95%',
    label: 'Taxa de Satisfação'
  }, {
    icon: Users,
    value: '50+',
    label: 'Cidades Atendidas'
  }, {
    icon: Stethoscope,
    value: '24',
    label: 'horas por dia, 7 dias por semana',
    sublabel: 'Suporte Médico'
  }];

  const handleRegisterClick = () => {
    if (nextEvent && nextEventDate) {
      console.log('🎯 Redirecionando para cadastro do próximo evento:', nextEvent.id);
      // Redirecionar direto para o cadastro com o evento específico
      navigate(`/registration?eventId=${nextEvent.id}&eventDateId=${nextEventDate.id}`);
    } else {
      navigate('/registration');
    }
  };

  const formatWeekday = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long'
    });
  };

  const getOccupancyPercentage = (available: number, total: number) => {
    return ((total - available) / total) * 100;
  };

  return (
    <section id="home" className="relative min-h-screen pt-16">
      {/* Background with gradient */}
      <div className="absolute inset-0 hero-gradient opacity-5"></div>
      
      <div className="relative container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20">
                <Heart className="h-4 w-4 text-secondary mr-2" />
                <span className="text-secondary font-semibold text-sm">Cuidado Oftalmológico Gratuito</span>
              </div>
              
              <h1 className="text-hero bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Levamos cuidado oftalmológico até você
              </h1>
              
              <p className="text-subtitle text-muted-foreground max-w-xl">O Projeto Enxergar sem Fronteira e uma parceira de varias entidades com Projeto Visão Itinerante que visa oferece atendimento oftalmológico gratuito em comunidades carentes, levando saúde visual de qualidade onde mais se precisa.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="btn-hero group" onClick={handleRegisterClick}>
                <Calendar className="h-5 w-5 mr-2" />
                Agendar Consulta
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })}>
                <MapPin className="h-5 w-5 mr-2" />
                Ver Próximos Eventos
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8">
              {stats.map((stat, index) => (
                <Card key={index} className={`p-4 text-center medical-card animate-slide-up stagger-${index + 1}`}>
                  <stat.icon className="h-6 w-6 text-primary mx-auto mb-2 medical-icon" />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className={`text-xs text-muted-foreground ${stat.sublabel ? 'leading-tight' : ''}`}>
                    {stat.label}
                  </div>
                  {stat.sublabel && (
                    <div className="text-xs font-medium text-primary mt-1">
                      {stat.sublabel}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Visual Element - Próximo Evento */}
          <div className="relative animate-float">
            <Card className="p-8 medical-card">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {nextEvent ? 'Próximo Evento' : 'Nenhum Evento Disponível'}
                  </h3>
                  {nextEvent && (
                    <div className="text-2xl font-bold text-primary mt-2 mb-2">
                      {nextEvent.city}
                    </div>
                  )}
                  <p className="text-muted-foreground">
                    {nextEvent ? 'Consultas oftalmológicas gratuitas' : 'Aguarde novos eventos'}
                  </p>
                </div>

                {nextEvent && nextEventDate ? (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-medical-bg">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">{formatDate(nextEventDate.date)}</div>
                          <div className="text-sm text-muted-foreground capitalize">{formatWeekday(nextEventDate.date)}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-medical-bg">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">{formatTime(nextEventDate.start_time)} - {formatTime(nextEventDate.end_time)}</div>
                          <div className="text-sm text-muted-foreground">Atendimento contínuo</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-medical-bg">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">{nextEvent.location}</div>
                          <div className="text-sm text-muted-foreground">{nextEvent.address}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/10">
                        <Users className="h-5 w-5 text-secondary" />
                        <div>
                          <div className="font-medium text-foreground">{nextEventDate.available_slots} vagas disponíveis</div>
                          <div className="text-sm text-success">{getOccupancyPercentage(nextEventDate.available_slots, nextEventDate.total_slots).toFixed(0)}% preenchido</div>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full btn-secondary-hero" onClick={handleRegisterClick}>
                      Inscrever-se Agora
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Não há eventos disponíveis no momento
                    </p>
                    <Button className="w-full btn-secondary-hero" onClick={() => navigate('/registration')}>
                      Entrar na Lista de Espera
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
