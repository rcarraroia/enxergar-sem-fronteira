/**
 * useExcelExport - Hook para facilitar exportação de dados para Excel
 */

import {
    convertRegistrationsToExportData,
    type ExportData,
    type ExportOptions,
    exportToExcel,
    generateDataStats
} from "@/utils/excelExporter";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UseExcelExportOptions {
  onSuccess?: (filename: string, stats: any) => void;
  onError?: (error: Error) => void;
  defaultFilename?: string;
}

export const useExcelExport = (options: UseExcelExportOptions = {}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { onSuccess, onError, defaultFilename } = options;

  const exportRegistrations = useCallback(async (
    registrations: any[],
    exportOptions: Partial<ExportOptions & {
      includeAllFields?: boolean;
      selectedCity?: string;
      selectedDate?: string;
    }> = {}
  ) => {
    if (registrations.length === 0) {
      toast.error("Nenhum dado disponível para exportação");
      return false;
    }

    setIsExporting(true);

    try {
      // Converter dados para formato de exportação
      let exportData = convertRegistrationsToExportData(registrations);

      // Se não incluir todos os campos, remover campos sensíveis
      if (!exportOptions.includeAllFields) {
        exportData = exportData.map(item => ({
          ...item,
          cpf: "", // Remove CPF por privacidade
          endereco: "", // Remove endereço por privacidade
        }));
      }

      // Gerar nome do arquivo baseado nos filtros
      let filename = defaultFilename;
      if (!filename) {
        const cityName = exportOptions.selectedCity !== "all" && exportOptions.selectedCity
          ? exportOptions.selectedCity.replace(/\s+/g, "_")
          : "todas_cidades";
        const dateStr = exportOptions.selectedDate
          ? exportOptions.selectedDate.replace(/-/g, "_")
          : new Date().toISOString().split("T")[0]?.replace(/-/g, "_");
        const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, "");

        filename = `agendamentos_${cityName}_${dateStr}_${timestamp}.xlsx`;
      }

      // Exportar para Excel
      await exportToExcel(exportData, {
        filename,
        sheetName: "Agendamentos",
        formatData: true,
        ...exportOptions
      });

      // Gerar estatísticas
      const stats = generateDataStats(exportData);

      // Callback de sucesso
      if (onSuccess) {
        onSuccess(filename, stats);
      } else {
        // Toast padrão de sucesso
        toast.success(
          `Excel exportado com sucesso! ${stats.total} registros exportados.`,
          {
            description: `Confirmados: ${stats.confirmados} | Pendentes: ${stats.pendentes} | Cidades: ${stats.cidades}`
          }
        );
      }

      return true;

    } catch (error) {
      console.error("Erro na exportação Excel:", error);

      const exportError = error instanceof Error ? error : new Error("Erro desconhecido na exportação");

      if (onError) {
        onError(exportError);
      } else {
        toast.error("Erro ao exportar arquivo Excel");
      }

      return false;
    } finally {
      setIsExporting(false);
    }
  }, [defaultFilename, onSuccess, onError]);

  const exportCustomData = useCallback(async (
    data: ExportData[],
    exportOptions: ExportOptions = {}
  ) => {
    if (data.length === 0) {
      toast.error("Nenhum dado disponível para exportação");
      return false;
    }

    setIsExporting(true);

    try {
      const filename = exportOptions.filename ||
        `dados_exportados_${new Date().toISOString().split("T")[0]}.xlsx`;

      await exportToExcel(data, {
        sheetName: "Dados",
        formatData: true,
        ...exportOptions,
        filename
      });

      const stats = generateDataStats(data);

      if (onSuccess) {
        onSuccess(filename, stats);
      } else {
        toast.success(`Excel exportado: ${filename}`);
      }

      return true;

    } catch (error) {
      console.error("Erro na exportação Excel:", error);

      const exportError = error instanceof Error ? error : new Error("Erro desconhecido na exportação");

      if (onError) {
        onError(exportError);
      } else {
        toast.error("Erro ao exportar arquivo Excel");
      }

      return false;
    } finally {
      setIsExporting(false);
    }
  }, [onSuccess, onError]);

  return {
    isExporting,
    exportRegistrations,
    exportCustomData
  };
};

export default useExcelExport;
