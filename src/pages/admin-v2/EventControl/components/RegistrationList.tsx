/**
 * COMPONENTE LISTA DE INSCRIÇÕES
 * Lista paginada de inscritos com filtros aplicados
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEventControlRegistrations, type EventControlFilters } from "@/hooks/admin-v2/useEventControl";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Users
} from "lucide-react";
import React, { useMemo } from "react";
import { RegistrationCard } from "./RegistrationCard";

interface RegistrationListProps {
  eventDateId: string;
  filters: EventControlFilters;
  attendedBy: string;
}

const ITEMS_PER_PAGE = 10;

export const RegistrationList: React.FC<RegistrationListProps> = ({
  eventDateId,
  filters,
  attendedBy
}) => {
  const [currentPage, setCurrentPage] = React.useState(1);

  const {
    data: registrations,
    isLoading,
    error
  } = useEventControlRegistrations(eventDateId, filters);

  // Apply client-side filters (until migration is applied)
  const filteredRegistrations = useMemo(() => {
    if (!registrations) return [];

    let filtered = [...registrations];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(reg =>
        reg.patient.nome.toLowerCase().includes(searchTerm) ||
        reg.patient.cpf.includes(searchTerm)
      );
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      switch (filters.status) {
        case 'waiting':
          filtered = filtered.filter(reg => !reg.attendance_confirmed);
          break;
        case 'present':
          filtered = filtered.filter(reg => reg.attendance_confirmed && !reg.process_completed);
          break;
        case 'with_glasses':
          filtered = filtered.filter(reg => reg.purchased_glasses);
          break;
        case 'without_glasses':
          filtered = filtered.filter(reg => reg.attendance_confirmed && !reg.purchased_glasses);
          break;
        case 'completed':
          filtered = filtered.filter(reg => reg.process_completed);
          break;
      }
    }

    return filtered;
  }, [registrations, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredRegistrations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRegistrations = filteredRegistrations.slice(startIndex, endIndex);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Carregando inscrições...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Erro ao carregar inscrições</span>
          </div>
          <p className="text-sm text-gray-500 text-center mt-2">
            {error instanceof Error ? error.message : "Erro desconhecido"}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma inscrição encontrada
          </h3>
          <p className="text-gray-500 text-center">
            Este evento ainda não possui inscrições confirmadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (filteredRegistrations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum resultado encontrado
          </h3>
          <p className="text-gray-500 text-center">
            Tente ajustar os filtros ou termo de busca.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-gray-500" />
          <span className="text-gray-700">
            {filteredRegistrations.length} {filteredRegistrations.length === 1 ? 'inscrição' : 'inscrições'}
          </span>
          {filters.search && (
            <Badge variant="outline" className="text-xs">
              Busca ativa
            </Badge>
          )}
          {filters.status && filters.status !== 'all' && (
            <Badge variant="outline" className="text-xs">
              Filtro ativo
            </Badge>
          )}
        </div>

        {/* Pagination Info */}
        {totalPages > 1 && (
          <div className="text-sm text-gray-500">
            Página {currentPage} de {totalPages}
          </div>
        )}
      </div>

      {/* Registration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {paginatedRegistrations.map((registration) => (
          <RegistrationCard
            key={registration.id}
            registration={registration}
            attendedBy={attendedBy}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber)}
                  className="w-8 h-8 p-0"
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};
