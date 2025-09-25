
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEvents } from "@/hooks/useEvents";
import { formatDate, formatTime } from "@/utils/dateUtils";
import { ArrowRight, Calendar, Clock, Eye, MapPin, RefreshCw, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const EventsSection = () => {
  const { data: events, isLoading, refetch, isFetching } = useEvents();
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const getStatusInfo = (availableSlots: number, totalSlots: number) => {
    if (availableSlots === 0) {
      return {
        badge: "Lotado",
        variant: "destructive" as const,
        bgColor: "bg-destructive/10",
        textColor: "text-destructive"
      };
    }
    if (availableSlots <= totalSlots * 0.3) {
      return {
        badge: "Vagas Limitadas",
        variant: "secondary" as const,
        bgColor: "bg-warning/10",
        textColor: "text-warning"
      };
    }
    return {
      badge: "Inscrições Abertas",
      variant: "default" as const,
      bgColor: "bg-secondary/10",
      textColor: "text-secondary"
    };
  };

  const handleEventClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isNavigating) {
      console.log("⚠️ EventsSection: Navegação já em andamento, ignorando clique");
      return;
    }

    setIsNavigating(true);
    console.log("🎯 EventsSection: Redirecionando para seleção de eventos (ÚNICO)");
    navigate("/eventos");
  };

  const handleWaitingListClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isNavigating) {
      console.log("⚠️ EventsSection: Navegação já em andamento, ignorando clique da lista de espera");
      return;
    }

    setIsNavigating(true);
    console.log("🎯 EventsSection: Redirecionando para lista de espera (ÚNICO)");
    navigate("/eventos");
  };

  const handleRefresh = () => {
    console.log("🔄 Atualizando lista de eventos...");
    refetch();
  };

  // Expandir eventos para mostrar cada data como um card separado
  const expandedEvents = events ? events.flatMap(event =>
    event.event_dates.map(eventDate => ({
      ...event,
      currentDate: eventDate,
      // Manter apenas a data atual no array para facilitar o processamento
      event_dates: [eventDate]
    }))
  ).sort((a, b) =>
    new Date(a.currentDate.date).getTime() - new Date(b.currentDate.date).getTime()
  ) : [];

  // Debug: Log todos os eventos expandidos
  console.log("🔍 DEBUG - Todos os eventos expandidos:", expandedEvents.map(e => ({
    city: e.city,
    date: e.currentDate.date,
    available_slots: e.currentDate.available_slots,
    total_slots: e.currentDate.total_slots
  })));

  // Debug: Log eventos que serão exibidos (primeiros 4)
  console.log("📱 DEBUG - Eventos que serão exibidos (primeiros 4):", expandedEvents.slice(0, 4).map(e => ({
    city: e.city,
    date: e.currentDate.date
  })));

  if (isLoading) {
    return (
      <section id="events" className="py-20 bg-medical-bg">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando eventos...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="events" className="py-20 bg-medical-bg">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Calendar className="h-4 w-4 text-primary mr-2" />
            <span className="text-primary font-semibold text-sm">Agenda de Eventos</span>
          </div>

          <div className="flex items-center justify-center gap-4 mb-4">
            <h2 className="text-4xl font-bold text-foreground">
              Próximos Atendimentos
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              className="ml-2"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <p className="text-subtitle text-muted-foreground max-w-2xl mx-auto">
            Confira nossa agenda de atendimentos oftalmológicos gratuitos.
            Cadastre-se nos eventos disponíveis em sua região.
          </p>

          {isFetching && (
            <div className="text-sm text-muted-foreground mt-2">
              Atualizando vagas disponíveis...
            </div>
          )}
        </div>

        {expandedEvents && expandedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {expandedEvents.slice(0, 4).map((expandedEvent, index) => {
              // Usar a data específica do evento expandido
              const eventDate = expandedEvent.currentDate;
              const availableSlots = eventDate.available_slots;
              const totalSlots = eventDate.total_slots;
              const statusInfo = getStatusInfo(availableSlots, totalSlots);
              const occupancyPercentage = totalSlots > 0 ? ((totalSlots - availableSlots) / totalSlots) * 100 : 0;

              console.log(`📊 Card ${expandedEvent.city} - Data ${eventDate.date}: ${availableSlots}/${totalSlots} vagas`);

              return (
                <Card key={`${expandedEvent.id}-${eventDate.id}`} className={`p-6 medical-card animate-slide-up stagger-${(index % 4) + 1} hover:shadow-medical transition-all duration-300`}>
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">{expandedEvent.city}</h3>
                          <p className="text-sm text-muted-foreground">
                            Organizado por: {expandedEvent.organizers?.name || "Organizador Local"}
                          </p>
                          <Badge variant={statusInfo.variant} className="mt-1">
                            {statusInfo.badge}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Event Details - showing specific date */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-muted-foreground">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{formatDate(eventDate.date)}</span>
                        <Clock className="h-4 w-4 text-primary ml-4" />
                        <span>{formatTime(eventDate.start_time)} - {formatTime(eventDate.end_time)}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-3 text-muted-foreground">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium text-foreground">{expandedEvent.location}</span>
                        </div>
                        <p className="text-sm text-muted-foreground ml-7">{expandedEvent.address}</p>
                      </div>
                    </div>

                    {/* Availability - mostra vagas da data específica */}
                    <div className={`p-4 rounded-lg ${statusInfo.bgColor}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="font-medium text-foreground">Vagas Disponíveis</span>
                        </div>
                        <span className={`font-semibold ${statusInfo.textColor}`}>
                          {availableSlots} de {totalSlots}
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
                        {occupancyPercentage.toFixed(0)}% preenchido para esta data
                      </p>
                    </div>

                    {/* Action Button */}
                    <Button
                      className={`w-full ${availableSlots === 0 ? "opacity-50 cursor-not-allowed" : "btn-hero group"}`}
                      disabled={availableSlots === 0 || isNavigating}
                      onClick={handleEventClick}
                    >
                      {isNavigating ? "Redirecionando..." : availableSlots === 0 ? "Data Lotada" : "Inscrever-se"}
                      {availableSlots > 0 && !isNavigating && (
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground mb-8">Nenhum evento disponível no momento</p>
          </div>
        )}

        {/* Call to Action - Lista de Espera */}
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
              <Button
                className="btn-secondary-hero"
                onClick={handleWaitingListClick}
                disabled={isNavigating}
              >
                {isNavigating ? "Redirecionando..." : "Entrar na Lista de Espera"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
