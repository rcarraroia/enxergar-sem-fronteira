import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEventsAdmin } from "@/hooks/useEventsAdmin";
import { RegistrationsList } from "@/components/admin/RegistrationsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Loader2,
  Mail,
  MapPin,
  Users
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

const AdminEventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { events, isLoading } = useEventsAdmin();
  const { sendEventReminder, isLoading: isLoadingEmail } = useNotifications();

  const event = events?.find(e => e.id === eventId);

  const getStatusBadge = (status: string, totalAvailable: number) => {
    if (status === "full" || totalAvailable === 0) {
      return <Badge variant="secondary">Lotado</Badge>;
    }
    if (status === "closed") {
      return <Badge variant="destructive">Fechado</Badge>;
    }
    return <Badge variant="default">Aberto</Badge>;
  };

  const handleSendReminders = () => {
    // Esta funcionalidade será expandida quando tivermos acesso aos dados de inscrição
    console.log("Enviando lembretes para participantes do evento:", event?.city);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Carregando evento...
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Evento não encontrado</h2>
          <Button onClick={() => navigate("/admin/events")}>
            Voltar para Eventos
          </Button>
        </div>
      </div>
    );
  }

  // Calcular totais de todas as datas do evento
  const totalSlots = event.event_dates.reduce((sum, date) => sum + date.total_slots, 0);
  const totalAvailable = event.event_dates.reduce((sum, date) => sum + date.available_slots, 0);
  const registeredCount = totalSlots - totalAvailable;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/admin/events")}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Detalhes do Evento</h1>
                <p className="text-sm text-muted-foreground">{event.city}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleSendReminders}
                disabled={isLoadingEmail}
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar Lembretes
              </Button>
              <Button onClick={() => navigate("/admin/events")}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Evento
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Informações do Evento */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{event.city}</CardTitle>
              {getStatusBadge(event.status, totalAvailable)}
            </div>
            {event.description && (
              <CardDescription className="text-base mt-2">
                {event.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {/* Informações gerais do evento */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Local</p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Vagas Totais</p>
                  <p className="text-sm text-muted-foreground">
                    {registeredCount}/{totalSlots} inscritos
                  </p>
                </div>
              </div>
            </div>

            {/* Datas do evento */}
            <div>
              <h3 className="font-semibold mb-4">Datas do Evento</h3>
              <div className="grid gap-4">
                {event.event_dates.map((eventDate, index) => (
                  <Card key={eventDate.id} className="p-4">
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">Data {index + 1}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(`${eventDate.date  }T00:00:00`).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">Horário</p>
                          <p className="text-sm text-muted-foreground">
                            {eventDate.start_time} - {eventDate.end_time}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">Vagas</p>
                          <p className="text-sm text-muted-foreground">
                            {eventDate.total_slots - eventDate.available_slots}/{eventDate.total_slots} inscritos
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Badge variant={eventDate.available_slots > 0 ? "default" : "secondary"}>
                          {eventDate.available_slots > 0 ? `${eventDate.available_slots} disponíveis` : "Lotado"}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="font-medium mb-2">Endereço Completo:</p>
              <p className="text-muted-foreground">{event.address}</p>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Inscrições */}
        <RegistrationsList eventId={eventId} />
      </main>
    </div>
  );
};

export default AdminEventDetails;
