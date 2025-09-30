/**
 * COMPONENTE DE FILTROS E BUSCA
 * Permite filtrar registros por status e buscar por nome/CPF
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { EventControlFilters } from "@/hooks/admin-v2/useEventControl";
import { Filter, Search, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface FilterBarProps {
  filters: EventControlFilters;
  onFiltersChange: (filters: EventControlFilters) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange
}) => {
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        ...filters,
        search: searchInput.trim() || undefined
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleStatusChange = (status: string) => {
    const newStatus = status === "all" ? undefined : status as EventControlFilters['status'];
    onFiltersChange({
      ...filters,
      status: newStatus
    });
  };

  const clearFilters = () => {
    setSearchInput("");
    onFiltersChange({});
  };

  const hasActiveFilters = filters.search || filters.status;

  const statusOptions = [
    { value: "all", label: "Todos", count: null },
    { value: "waiting", label: "Aguardando", count: null },
    { value: "present", label: "Presentes", count: null },
    { value: "with_glasses", label: "Com Óculos", count: null },
    { value: "without_glasses", label: "Sem Óculos", count: null },
    { value: "completed", label: "Finalizados", count: null }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filtros</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              Filtros ativos
            </Badge>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status || "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por status..." />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{option.label}</span>
                  {option.count !== null && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {option.count}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <span className="text-sm text-gray-500">Filtros ativos:</span>

          {filters.search && (
            <Badge variant="outline" className="text-xs">
              Busca: "{filters.search}"
              <button
                onClick={() => {
                  setSearchInput("");
                  onFiltersChange({ ...filters, search: undefined });
                }}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.status && filters.status !== "all" && (
            <Badge variant="outline" className="text-xs">
              Status: {statusOptions.find(opt => opt.value === filters.status)?.label}
              <button
                onClick={() => onFiltersChange({ ...filters, status: undefined })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
