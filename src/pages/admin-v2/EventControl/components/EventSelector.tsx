/**
 * COMPONENTE SELETOR DE EVENTOS
 * Permite selecionar evento por data para controle de atendimento
 */

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useEventsV2 } from "@/hooks/admin-v2/useEventsV2";
import { format, isFuture, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import React from "react";

interface EventSelectorProps {
  onEventSelect: (eventDateId: string) => void;
  selectedEventDateId: string;
}

export const EventSelector: React.FC<EventSelectorProps> = ({
  onEventSelect,
  selectedEventDateId
}) => {
  const { data: events, isLoading, error } = useEventsV2();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando eventos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar eventos</p>
        <p className="text-sm text-gray-500 mt-1">
          {error instanceof Error ? error.message : "Erro desconhecido"}
        </p>
      </div>
    );
  }

  // Processar eventos para criar lista de datas
  const eventDates = events?.flatMap(event =>
    event.event_dates?.map(eventDate => ({
      id: eventDate.id,
      eventId: event.id,
      eventTitle: event.title,
      eventLocation: event.location,
      eventCity: event.city,
      date: eventDate.date,
      startTime: eventDate.start_time,
      endTime: eventDate.end_time,
      totalSlots: eventDate.total_slots,
      availableSlots: eventDate.available_slots
    })) || []
  ) || [];

  // Ordenar por data (mais próximas primeiro)
  const sortedEventDates = eventDates.sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Filtrar apenas eventos de hoje e futuros (para controle de atendimento)
  const relevantEventDates = sortedEventDates.filter(eventDate => {
    const eventDateObj = new Date(eventDate.date);
    return isToday(eventDateObj) || isFuture(eventDateObj);
  });

  const getDateBadge = (date: string) => {
    const eventDate = new Date(date);

    if (isToday(eventDate)) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Hoje</Badge>;
    } else if (isFuture(eventDate)) {
      return <Badge variant="secondary">Futuro</Badge>;
    } else {
      return <Badge variant="outline">Passado</Badge>;
    }
  };

  const formatEventDate = (date: string, startTime: string, endTime: string) => {
    const eventDate = new Date(date);
    const formattedDate = format(eventDate, "dd/MM/yyyy - EEEE", { locale: ptBR });
    return `${formattedDate} • ${startTime} às ${endTime}`;
  };

  const selectedEvent = relevantEventDates.find(ed => ed.id === selectedEventDateId);

  return (
    <div className="space-y-4">
      <Select value={selectedEventDateId} onValueChange={onEventSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione um evento para gerenciar..." />
        </SelectTrigger>
        <SelectContent>
          {relevantEventDates.length === 0 ? (
            <SelectItem value="" disabled>
              Nenhum evento disponível para controle
            </SelectItem>
          ) : (
            relevantEventDates.map((eventDate) => (
              <SelectItem key={eventDate.id} value={eventDate.id}>
                <div className="flex flex-col space-y-1 py-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{eventDate.eventTitle}</span>
                    {getDateBadge(eventDate.date)}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatEventDate(eventDate.date, eventDate.startTime, eventDate.endTime)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{eventDate.eventLocation} - {eventDate.eventCity}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{eventDate.availableSlots}/{eventDate.totalSlots} vagas</span>
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Event Details */}
      {selectedEvent && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-blue-900">{selectedEvent.eventTitle}</h3>
                {getDateBadge(selectedEvent.date)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-blue-700">
                  <Calendar className="h-4 w-4" />
                  <span>{formatEventDate(selectedEvent.date, selectedEvent.startTime, selectedEvent.endTime)}</span>
                </div>

                <div className="flex items-center space-x-2 text-blue-700">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedEvent.eventLocation} - {selectedEvent.eventCity}</span>
                </div>

                <div className="flex items-center space-x-2 text-blue-700">
                  <Users className="h-4 w-4" />
                  <span>{selectedEvent.totalSlots - selectedEvent.availableSlots} inscritos de {selectedEvent.totalSlots} vagas</span>
                </div>

                <div className="flex items-center space-x-2 text-blue-700">
                  <Clock className="h-4 w-4" />
                  <span>Duração: {selectedEvent.startTime} - {selectedEvent.endTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
