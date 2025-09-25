

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Calendar as CalendarIcon, 
  Download,
  RefreshCw,
  Search,
  X
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RegistrationFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedCity: string
  onCityChange: (value: string) => void
  selectedDate: Date | undefined
  onDateChange: (date: Date | undefined) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  eventStatusFilter: string
  onEventStatusChange: (value: string) => void
  availableCities: string[]
  onExport: () => void
  onRefresh: () => void
  filteredCount: number
}

export function RegistrationFilters({
  searchTerm,
  onSearchChange,
  selectedCity,
  onCityChange,
  selectedDate,
  onDateChange,
  statusFilter,
  onStatusChange,
  eventStatusFilter,
  onEventStatusChange,
  availableCities,
  onExport,
  onRefresh,
  filteredCount
}: RegistrationFiltersProps) {
  const clearFilters = () => {
    onSearchChange("");
    onCityChange("all");
    onDateChange(undefined);
    onStatusChange("all");
    onEventStatusChange("all");
  };

  const hasActiveFilters = searchTerm || selectedCity !== "all" || selectedDate || 
                          statusFilter !== "all" || eventStatusFilter !== "all";

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Filtros e Relatórios</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredCount} inscrições encontradas
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filtro de Busca */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Busca Geral</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Filtros em Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro de Cidade */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cidade do Evento</Label>
            <Select value={selectedCity} onValueChange={onCityChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Cidades</SelectItem>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Data */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data do Evento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    "Selecionar data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={onDateChange}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Filtro de Status da Inscrição */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status da Inscrição</Label>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="attended">Compareceu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Status do Evento */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status do Evento</Label>
            <Select value={eventStatusFilter} onValueChange={onEventStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Status do evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Eventos</SelectItem>
                <SelectItem value="active">Ativos e Futuros</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros Ativos */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
            <div className="flex flex-wrap gap-1">
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Busca: "{searchTerm}"
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => onSearchChange("")}
                  />
                </Badge>
              )}
              {selectedCity && selectedCity !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Cidade: {selectedCity}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => onCityChange("all")}
                  />
                </Badge>
              )}
              {selectedDate && (
                <Badge variant="secondary" className="text-xs">
                  Data: {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => onDateChange(undefined)}
                  />
                </Badge>
              )}
              {statusFilter && statusFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Status: {statusFilter === "confirmed" ? "Confirmada" : 
                          statusFilter === "pending" ? "Pendente" : 
                          statusFilter === "cancelled" ? "Cancelada" : "Compareceu"}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => onStatusChange("all")}
                  />
                </Badge>
              )}
              {eventStatusFilter && eventStatusFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Evento: {eventStatusFilter === "active" ? "Ativos" : "Concluídos"}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => onEventStatusChange("all")}
                  />
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="ml-auto text-xs"
            >
              Limpar todos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
