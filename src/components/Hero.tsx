import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, MapPin, Clock, Users, ArrowRight, Eye, Heart, Stethoscope } from 'lucide-react';
const Hero = () => {
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
    value: '24/7',
    label: 'Suporte Médico'
  }];
  return <section id="home" className="relative min-h-screen pt-16">
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
              <Button size="lg" className="btn-hero group">
                <Calendar className="h-5 w-5 mr-2" />
                Agendar Consulta
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <MapPin className="h-5 w-5 mr-2" />
                Ver Próximos Eventos
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8">
              {stats.map((stat, index) => <Card key={index} className={`p-4 text-center medical-card animate-slide-up stagger-${index + 1}`}>
                  <stat.icon className="h-6 w-6 text-primary mx-auto mb-2 medical-icon" />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </Card>)}
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative animate-float">
            <Card className="p-8 medical-card">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Próximo Evento</h3>
                  <p className="text-muted-foreground">Consultas oftalmológicas gratuitas</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-medical-bg">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">15 de Janeiro, 2025</div>
                      <div className="text-sm text-muted-foreground">Terça-feira</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-medical-bg">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">8:00 - 17:00</div>
                      <div className="text-sm text-muted-foreground">Atendimento contínuo</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-medical-bg">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">Centro Comunitário</div>
                      <div className="text-sm text-muted-foreground">São Paulo, SP</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/10">
                    <Users className="h-5 w-5 text-secondary" />
                    <div>
                      <div className="font-medium text-foreground">127 vagas disponíveis</div>
                      <div className="text-sm text-success">73% preenchido</div>
                    </div>
                  </div>
                </div>

                <Button className="w-full btn-secondary-hero">
                  Inscrever-se Agora
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;