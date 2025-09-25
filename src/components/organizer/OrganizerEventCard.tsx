

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Copy,
  Edit,
  Eye,
  MapPin,
  Pause,
  Play,
  Trash2,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Event {
  id: string
  title: string
  description?: string
  location: string
  city: string
  status: "open" | "closed" | "cancelled"
  registrations_count?: number
  event_dates?: {
    id: string
    date: string
    start_time: string
    end_time: string
  }[]
}

interface OrganizerEventCardProps {
  event: Event
  onDuplicate: (eventId: string) => void
  onToggleStatus: (eventId: string, currentStatus: string) => void
  onDelete: (eventId: string) => void
}

export const OrganizerEventCard = ({ 
  event, 
  onDuplicate, 
  onToggleStatus, 
  onDelete 
}: OrganizerEventCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="default">Ativo</Badge>;
      case "closed":
        return <Badge variant="secondary">Pausado</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
          {getStatusBadge(event.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{event.city}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>{event.registrations_count || 0} inscrições</span>
          </div>
          {event.event_dates && event.event_dates.length > 0 && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>
                {format(new Date(event.event_dates[0]?.date || new Date()), "dd/MM/yyyy", { locale: ptBR })}
                {event.event_dates.length > 1 && ` (+${event.event_dates.length - 1})`}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/organizer/events/${event.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Link>
          </Button>
          
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/organizer/events/${event.id}/edit`}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Link>
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDuplicate(event.id)}
          >
            <Copy className="h-4 w-4 mr-1" />
            Duplicar
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onToggleStatus(event.id, event.status)}
          >
            {event.status === "open" ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Ativar
              </>
            )}
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(event.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
