/**
 * ExcelExportButton - Botão para exportar dados para Excel
 * Segue o formato do gabarito WaSeller
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  convertRegistrationsToExportData,
  exportToExcel,
  generateDataStats
} from "@/utils/excelExporter";
import {
  Calendar,
  ChevronDown,
  Clock,
  Download,
  FileSpreadsheet,
  MapPin,
  Users
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ExcelExportButtonProps {
  data: any[];
  selectedCity?: string;
  selectedDate?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ExcelExportButton: React.FC<ExcelExportButtonProps> = ({
  data = [],
  selectedCity = "all",
  selectedDate = "",
  isLoading = false,
  disabled = false
}) => {
  const [isExporting, setIsExporting] = useState(false);

  // Converter dados para formato de exportação
  const exportData = convertRegistrationsToExportData(data);
  const stats = generateDataStats(exportData);

  const handleExport = async (includeAllFields = true) => {
    if (data.length === 0) {
      toast.error("Nenhum dado disponível para exportação");
      return;
    }

    setIsExporting(true);

    try {
      // Preparar dados para exportação
      let processedData = exportData;

      // Se não incluir todos os campos, remover campos sensíveis
      if (!includeAllFields) {
        processedData = exportData.map(item => ({
          ...item,
          cpf: "", // Remove CPF por privacidade
          endereco: "", // Remove endereço por privacidade
        }));
      }

      // Gerar nome do arquivo baseado nos filtros
      const cityName = selectedCity !== "all" ? selectedCity.replace(/\s+/g, "_") : "todas_cidades";
      const dateVal = selectedDate ?? "";
      const dateStr = dateVal ? dateVal.replace(/-/g, "_") : new Date().toISOString().split("T")[0]?.replace(/-/g, "_") || "";
      const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, "");

      const filename = `agendamentos_${cityName}_${dateStr}_${timestamp}.xlsx`;

      // Exportar para Excel
      await exportToExcel(processedData, {
        filename,
        sheetName: "Agendamentos",
        formatData: true
      });

      // Mostrar estatísticas do export
      toast.success(
        `Excel exportado com sucesso! ${stats.total} registros exportados.`,
        {
          description: `Confirmados: ${stats.confirmados} | Pendentes: ${stats.pendentes} | Cidades: ${stats.cidades}`
        }
      );

    } catch (error) {
      console.error("Erro na exportação Excel:", error);
      toast.error("Erro ao exportar arquivo Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const isDisabled = disabled || isLoading || isExporting || data.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isDisabled}
          variant="default"
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {isExporting ? "Exportando..." : "Exportar Excel"}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Exportar para Excel
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Estatísticas dos dados */}
        <div className="px-2 py-2 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-blue-600" />
              <span className="text-muted-foreground">Total:</span>
              <Badge variant="secondary">{stats.total}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-green-600" />
              <span className="text-muted-foreground">Cidades:</span>
              <Badge variant="secondary">{stats.cidades}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-muted-foreground">Confirmados:</span>
              <Badge variant="outline">{stats.confirmados}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-muted-foreground">Pendentes:</span>
              <Badge variant="outline">{stats.pendentes}</Badge>
            </div>
          </div>

          {stats.periodoInicioFormatted && stats.periodoFimFormatted && (
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-3 w-3 text-purple-600" />
              <span className="text-muted-foreground">Período:</span>
              <span className="text-xs">
                {stats.periodoInicioFormatted} - {stats.periodoFimFormatted}
              </span>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Opções de exportação */}
        <DropdownMenuItem
          onClick={() => handleExport(true)}
          disabled={isDisabled}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">Exportação Completa</div>
            <div className="text-xs text-muted-foreground">
              Inclui todos os campos (CPF, endereço, etc.)
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport(false)}
          disabled={isDisabled}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-m">Exsica</div>
            <div className="text-xs text-muted-foreground">
              Sem dados sensíveis (CPF, endereço)
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Informações sobre o formato */}
        <div className="px-2 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 mb-1">
            <Clock className="h-3 w-3" />
            Formato: Gabarito WaSeller
          </div>
          <div>• Dados formatados automaticamente</div>
          <div>• Estilos e cores aplicados</div>
          <div>• Colunas com largura otimizada</div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExcelExportButton;
