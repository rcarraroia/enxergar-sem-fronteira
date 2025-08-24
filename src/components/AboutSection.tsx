
import { Card } from "@/components/ui/card";
import { Award, Clock, Eye, Globe, Heart, Shield, Stethoscope, Users } from "lucide-react";

const AboutSection = () => {
  const features = [
    {
      icon: Eye,
      title: "Atendimento Especializado",
      description: "Consultas oftalmológicas completas com profissionais qualificados"
    },
    {
      icon: Heart,
      title: "Cuidado Humanizado",
      description: "Tratamento personalizado e acolhedor para todos os pacientes"
    },
    {
      icon: Shield,
      title: "Acesso Universal",
      description: "Atendimento gratuito e de qualidade para comunidades carentes"
    },
    {
      icon: Clock,
      title: "Segurança e Qualidade",
      description: "Protocolos rigorosos de segurança e equipamentos modernos"
    }
  ];

  const mission = {
    title: "Missão de Transformar Vidas",
    description: "O Projeto Enxergar Sem Fronteira nasceu da necessidade de levar cuidados oftalmológicos de qualidade para comunidades que não têm acesso a serviços especializados de saúde visual.",
    vision: "Nossa Visão",
    visionText: "Ser Brasil onde todas as pessoas tenham acesso a cuidados oftalmológicos de qualidade, independentemente de sua condição socioeconômica ou localização geográfica.",
    stats: [
      { value: "95%", label: "Taxa de Satisfação" },
      { value: "5 Anos", label: "de Experiência" },
      { value: "50+", label: "Cidades Atendidas" },
      { value: "10k+", label: "Consultas Realizadas" }
    ]
  };

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Mission Section - Moved to top */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold text-foreground mb-6">{mission.title}</h2>
          <p className="text-subtitle text-muted-foreground max-w-4xl mx-auto mb-8">
            {mission.description}
          </p>

          {/* Project Details */}
          <div className="bg-medical-bg rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Projeto Visão Itinerante</h3>
            <p className="text-muted-foreground mb-6">
              Formado em 2020, o Projeto Visão Itinerante surgiu como uma iniciativa do Instituto 
              Coração Valente, com o objetivo de democratizar o acesso à saúde oftalmológica no 
              interior do Brasil.
            </p>
            <p className="text-muted-foreground mb-6">
              Nossa equipe multidisciplinar percorre comunidades carentes oferecendo 
              consultas, exames e cirurgias oftalmológicas gratuitas, com foco na 
              prevenção e tratamento precoce de doenças que podem levar à cegueira.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {mission.stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Vision */}
          <Card className="p-8 medical-card">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center">
                <Globe className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">{mission.vision}</h3>
            <p className="text-muted-foreground">{mission.visionText}</p>
          </Card>
        </div>

        {/* Features Grid - Moved to bottom */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className={`p-6 text-center medical-card animate-slide-up stagger-${index + 1}`}>
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
