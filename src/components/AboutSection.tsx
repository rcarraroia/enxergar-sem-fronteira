
import { Card } from '@/components/ui/card';
import { Eye, Heart, Users, Shield, Target, Award } from 'lucide-react';

const AboutSection = () => {
  const features = [
    {
      icon: Eye,
      title: 'Atendimento Especializado',
      description: 'Consultas oftalmológicas completas com equipamentos de última geração e profissionais qualificados.'
    },
    {
      icon: Heart,
      title: 'Cuidado Humanizado',
      description: 'Tratamento acolhedor e personalizado, respeitando as necessidades de cada paciente.'
    },
    {
      icon: Users,
      title: 'Acesso Universal',
      description: 'Atendimento gratuito para comunidades carentes, democratizando o acesso à saúde visual.'
    },
    {
      icon: Shield,
      title: 'Segurança e Qualidade',
      description: 'Protocolos rigorosos de segurança e qualidade em todos os procedimentos médicos.'
    }
  ];

  const achievements = [
    {
      icon: Target,
      value: '95%',
      label: 'Eficácia no Diagnóstico'
    },
    {
      icon: Award,
      value: '5 Anos',
      label: 'de Experiência'
    },
    {
      icon: Users,
      value: '50+',
      label: 'Cidades Atendidas'
    },
    {
      icon: Heart,
      value: '10k+',
      label: 'Vidas Impactadas'
    }
  ];

  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
            <Heart className="h-4 w-4 text-secondary mr-2" />
            <span className="text-secondary font-semibold text-sm">Sobre o Projeto</span>
          </div>
          
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Missão de Transformar Vidas
          </h2>
          <p className="text-subtitle text-muted-foreground max-w-3xl mx-auto">
            O Projeto Enxergar Sem Fronteira nasceu da necessidade de levar cuidado oftalmológico de qualidade para comunidades que não têm acesso a serviços especializados de saúde visual.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Story */}
          <div className="space-y-6 animate-slide-up">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Projeto Visão Itinerante</h3>
              <p className="text-muted-foreground leading-relaxed">
                Fundado em 2020, o Projeto Visão Itinerante surge como uma iniciativa do Instituto Coração Valente, 
                com o objetivo de democratizar o acesso à saúde oftalmológica no Brasil.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Nossa equipe multidisciplinar percorre comunidades carentes oferecendo consultas, exames e 
                cirurgias oftalmológicas gratuitas, sempre com foco na prevenção e tratamento precoce de 
                doenças que podem levar à cegueira.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <Card key={index} className="p-4 text-center medical-card">
                  <achievement.icon className="h-6 w-6 text-primary mx-auto mb-2 medical-icon" />
                  <div className="text-xl font-bold text-foreground">{achievement.value}</div>
                  <div className="text-xs text-muted-foreground">{achievement.label}</div>
                </Card>
              ))}
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative">
            <Card className="p-8 medical-card animate-float">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-gradient-hero rounded-full flex items-center justify-center mx-auto">
                  <Eye className="h-12 w-12 text-white" />
                </div>
                
                <div>
                  <h4 className="text-xl font-bold text-foreground mb-2">Nossa Visão</h4>
                  <p className="text-muted-foreground">
                    "Um Brasil onde todas as pessoas tenham acesso a cuidados oftalmológicos de qualidade, 
                    independentemente de sua condição socioeconômica."
                  </p>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-center space-x-2 text-primary">
                    <Heart className="h-5 w-5" fill="currentColor" />
                    <span className="font-semibold">Projeto Enxergar Sem Fronteira</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className={`p-6 text-center medical-card animate-slide-up stagger-${index + 1} hover:shadow-medical transition-all duration-300`}>
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Partners Section */}
        <div className="mt-20 text-center animate-fade-in">
          <Card className="p-8 medical-card">
            <h3 className="text-2xl font-bold text-foreground mb-6">Nossos Parceiros</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-full overflow-hidden bg-white shadow-md">
                  <img 
                    src="/lovable-uploads/6077b647-edf0-4d73-86a2-647f7c51d76c.png" 
                    alt="Instituto Coração Valente"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm font-medium text-foreground">Instituto Coração Valente</p>
                <p className="text-xs text-muted-foreground">Ipatinga-MG</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-full overflow-hidden bg-white shadow-md">
                  <img 
                    src="/lovable-uploads/7395f0a2-2919-485c-95e3-5b2a860ccbaf.png" 
                    alt="Paróquia São José"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm font-medium text-foreground">Paróquia São José</p>
                <p className="text-xs text-muted-foreground">Timóteo-MG</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-full overflow-hidden bg-white shadow-md">
                  <img 
                    src="/lovable-uploads/c75287af-b68b-421f-991e-f0793f759207.png" 
                    alt="Paróquia Cristo Libertador"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm font-medium text-foreground">Paróquia Cristo Libertador</p>
                <p className="text-xs text-muted-foreground">Ipatinga-MG</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-full overflow-hidden bg-white shadow-md">
                  <img 
                    src="/lovable-uploads/729adc6d-e9d5-4598-96df-c9180d4c769d.png" 
                    alt="Wladimir Careca"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm font-medium text-foreground">Wladimir Careca</p>
                <p className="text-xs text-muted-foreground">Timóteo-MG</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
