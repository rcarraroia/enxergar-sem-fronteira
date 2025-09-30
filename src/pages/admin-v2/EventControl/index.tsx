/**
 * PÁGINA DE CONTROLE DE EVENTOS
 * Interface para atendentes gerenciarem presenças e compras de óculos
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventControlFilters } from "@/hooks/admin-v2/useEventControl";
import { useAuth } from "@/hooks/useAuth";
import {
  Calendar,
  UserCheck
} from "lucide-react";
import React, { useState } from "react";
import { EventSelector } from "./components/EventSelector";
import { EventStats } from "./components/EventStats";
import { FilterBar } from "./components/FilterBar";
import { RegistrationList } from "./components/RegistrationList";

const EventControlPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedEventDateId, setSelectedEventDateId] = useState<string>("");
  const [filters, setFilters] = useState<EventControlFilters>({});

  const handleEventSelect = (eventDateId: string) => {
    setSelectedEventDateId(eventDateId);
    // Reset filters when changing event
    setFilters({});
  };

  const handleFiltersChange = (newFilters: EventControlFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Eventos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie presenças, compras de óculos e finalize atendimentos
          </p>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <UserCheck className="h-4 w-4" />
          <span>Atendente: {user?.email}</span>
        </div>
      </div>

      {/* Event Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Selecionar Evento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EventSelector
            onEventSelect={handleEventSelect}
            selectedEventDateId={selectedEventDateId}
          />
        </CardContent>
      </Card>

      {/* Event Stats */}
      {selectedEventDateId && (
        <EventStats eventDateId={selectedEventDateId} />
      )}

      {/* Filters and Registration List */}
      {selectedEventDateId && (
        <div className="space-y-4">
          <FilterBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          <RegistrationList
            eventDateId={selectedEventDateId}
            filters={filters}
            attendedBy={user?.email || ""}
          />
        </div>
      )}

      {/* Empty State */}
      {!selectedEventDateId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Selecione um evento
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              Escolha um evento na lista acima para começar a gerenciar as presenças
              e atendimentos dos pacientes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventControlPage;
