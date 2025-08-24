/**
 * ExcelExportExample - Exemplo de uso da exportação Excel
 * Pode ser usado em outras páginas do sistema
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExcelExport } from "@/hooks/useExcelExport";
import { Download, FileSpreadsheet } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface ExcelExportExampleProps {
  data: any[];
  title?: string;
  description?: string;
  filename?: string;
}

export const ExcelExportExample: React.FC<ExcelExportExampleProps> = ({
  data,
  title = "Exportar Dados",
  description = "Exporte os dados para Excel no formato profissional",
  filename
}) => {
  const { isExporting, exportRegistrations } = useExcelExport({
    defaultFilename: filename,
    onSuccess: (filename, stats) => {
      toast.success(
        `Arquivo exportado: ${filename}`,
        {
          description: `${stats.total} registros exportados com sucesso`
        }
      );
    },
    onError: (error) => {
      toast.error(`Erro na exportação: ${error.message}`);
    }
  });

  const handleExportComplete = async () => {
    await exportRegistrations(data, {
      includeAllFields: true
    });
  };

  const handleExportBasic = async () => {
    await exportRegistrations(data, {
      includeAllFields: false
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <div className="font-medium">Registros disponíveis</div>
              <div className="text-sm text-muted-foreground">
                {data.length} itens prontos para exportação
              </div>
            </div>
            <div className="text-2xl font-bold text-primary">
              {data.length}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={handleExportComplete}
              disabled={isExporting || data.length === 0}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exportando..." : "Exportação Completa"}
            </Button>

            <Button
              onClick={handleExportBasic}
              disabled={isExporting || data.length === 0}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exportando..." : "Exportação Básica"}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <div>• <strong>Completa:</strong> Inclui todos os campos (CPF, endereço)</div>
            <div>• <strong>Básica:</strong> Remove dados sensíveis</div>
            <div>• Formato seguindo gabarito WaSeller</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelExportExample;
