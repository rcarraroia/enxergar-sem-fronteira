
import { ExcelExportButton } from "@/components/admin/ExcelExportButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import type { Registration } from "@/hooks/useRegistrations";
import { useAvailableCities, useRegistrationsFiltered } from "@/hooks/useRegistrationsFiltered";
import { formatDate } from "@/utils/dateUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AlertTriangle, Calendar, FileDown, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ReportsTemp = () => {
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const { user, userRole, isAdmin } = useAuth();

  // Buscar cidades disponíveis
  const { data: availableCities = [], isLoading: citiesLoading, error: citiesError } = useAvailableCities();

  // Buscar dados com filtros
  const {
    data: registrations = [],
    isLoading,
    error: registrationsError,
    refetch
  } = useRegistrationsFiltered({
    city: selectedCity !== "all" ? selectedCity : undefined,
    date: selectedDate ? new Date(selectedDate) : undefined
  });

  // Debug info
  useEffect(() => {
    if (debugMode) {
      console.log("🔍 ReportsTemp Debug Info:", {
        user: user?.email,
        userRole,
        isAdmin,
        selectedCity,
        selectedDate,
        availableCities,
        registrationsCount: registrations.length,
        citiesError,
        registrationsError
      });
    }
  }, [debugMode, user, userRole, isAdmin, selectedCity, selectedDate, availableCities, registrations, citiesError, registrationsError]);

  const generatePDF = () => {
    if (registrations.length === 0) {
      toast.error("Nenhum agendamento encontrado para os filtros selecionados");
      return;
    }

    setIsGenerating(true);

    try {
      const doc = new jsPDF("landscape"); // Modo paisagem para mais espaço

      // Título do relatório
      const title = "RELATÓRIO DE AGENDAMENTOS";

      // Usar a função formatDate corrigida
      const dateDisplayText = selectedDate ? formatDate(selectedDate) : "Todas as Datas";

      const subtitle = `${selectedCity !== "all" ? selectedCity : "Todas as Cidades"} - ${dateDisplayText}`;

      doc.setFontSize(16);
      doc.text(title, 14, 20);

      doc.setFontSize(12);
      doc.text(subtitle, 14, 30);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, 14, 40);
      doc.text(`Total de registros: ${registrations.length}`, 14, 50);

      // Preparar dados para a tabela (sem CPF, ordenado alfabeticamente)
      const tableData = registrations.map((reg: Registration) => [
        reg.patient.nome,
        reg.patient.telefone,
        reg.patient.email,
        reg.event_date.event.city,
        formatDate(reg.event_date.date),
        reg.event_date.start_time,
        reg.status === "confirmed" ? "Confirmado" :
          reg.status === "pending" ? "Pendente" :
            reg.status === "attended" ? "Compareceu" : "Cancelado",
        new Date(reg.created_at).toLocaleDateString("pt-BR")
      ]);

      // Cabeçalhos da tabela (sem CPF)
      const headers = [
        "Nome",
        "Telefone",
        "Email",
        "Cidade",
        "Data Evento",
        "Horário",
        "Status",
        "Agendado em"
      ];

      // Gerar tabela com larguras otimizadas para paisagem
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 60,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          valign: "middle",
          halign: "left"
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 10,
          fontStyle: "bold",
          halign: "center"
        },
        columnStyles: {
          0: { cellWidth: 40 }, // Nome - mais espaço
          1: { cellWidth: 30 }, // Telefone
          2: { cellWidth: 50 }, // Email - mais espaço
          3: { cellWidth: 25 }, // Cidade
          4: { cellWidth: 25 }, // Data
          5: { cellWidth: 20 }, // Horário
          6: { cellWidth: 25 }, // Status
          7: { cellWidth: 25 }  // Agendado em
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        tableWidth: "auto",
        margin: { left: 14, right: 14 }
      });

      // Nome do arquivo
      const cityName = selectedCity !== "all" ? selectedCity.replace(/\s+/g, "_") : "todas_cidades";
      const dateStr = selectedDate ? selectedDate.replace(/-/g, "_") : new Date().toISOString().split("T")[0].replace(/-/g, "_");
      const filename = `relatorio_agendamentos_${cityName}_${dateStr}.pdf`;

      // Salvar PDF
      doc.save(filename);

      toast.success(`Relatório gerado: ${filename}`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar relatório PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto"> {/* Aumentei a largura máxima */}
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerador de Relatórios - Agendamentos
          </h1>
          <p className="text-gray-600">
            Solução provisória para exportar relatórios em PDF
          </p>

          {/* Debug Info */}
          {(citiesError || registrationsError) && (
            <Alert className="mt-4 max-w-2xl mx-auto">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Erro detectado:</strong>
                {citiesError && <div>Cidades: {citiesError.message}</div>}
                {registrationsError && <div>Registros: {registrationsError.message}</div>}
              </AlertDescription>
            </Alert>
          )}

          {/* Auth Debug */}
          <div className="mt-4 text-sm text-gray-500">
            Usuário: {user?.email} | Role: {userRole} | Admin: {isAdmin ? "Sim" : "Não"}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDebugMode(!debugMode)}
              className="ml-2"
            >
              {debugMode ? "Ocultar" : "Mostrar"} Debug
            </Button>
          </div>

          {debugMode && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-sm">
              <h4 className="font-bold mb-2">Informações de Debug:</h4>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify({
                  user: user?.email,
                  userRole,
                  isAdmin,
                  citiesCount: availableCities.length,
                  registrationsCount: registrations.length,
                  isLoading,
                  citiesLoading,
                  errors: {
                    cities: citiesError?.message,
                    registrations: registrationsError?.message
                  }
                }, null, 2)}
              </pre>
              <Button
                onClick={() => refetch()}
                size="sm"
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar Dados
              </Button>
            </div>
          )}
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros do Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Cidades</SelectItem>
                    {availableCities.map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data do Evento</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados e Geração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileDown className="h-5 w-5" />
                Gerar Relatórios
              </div>
              <div className="flex items-center gap-2">
                <ExcelExportButton
                  data={registrations}
                  selectedCity={selectedCity}
                  selectedDate={selectedDate}
                  isLoading={isLoading}
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-600">Total de Registros</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {isLoading ? "..." : registrations.length}
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-green-600">Confirmados</div>
                  <div className="text-2xl font-bold text-green-900">
                    {isLoading ? "..." : registrations.filter((r: Registration) => r.status === "confirmed").length}
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-yellow-600">Pendentes</div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {isLoading ? "..." : registrations.filter((r: Registration) => r.status === "pending").length}
                  </div>
                </div>
              </div>

              {/* Preview com scroll horizontal melhorado */}
              {registrations.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Preview dos dados (primeiros 5 registros):</h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold min-w-[200px]">Nome</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold min-w-[120px]">Telefone</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold min-w-[200px]">Email</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold min-w-[100px]">Cidade</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold min-w-[100px]">Data</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold min-w-[80px]">Horário</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold min-w-[100px]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.slice(0, 5).map((reg: Registration) => (
                          <tr key={reg.id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 break-words">{reg.patient.nome}</td>
                            <td className="border border-gray-300 px-4 py-3">{reg.patient.telefone}</td>
                            <td className="border border-gray-300 px-4 py-3 break-words">{reg.patient.email}</td>
                            <td className="border border-gray-300 px-4 py-3">{reg.event_date.event.city}</td>
                            <td className="border border-gray-300 px-4 py-3">
                              {formatDate(reg.event_date.date)}
                            </td>
                            <td className="border border-gray-300 px-4 py-3">{reg.event_date.start_time}</td>
                            <td className="border border-gray-300 px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${reg.status === "confirmed" ? "bg-green-100 text-green-800" :
                                reg.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                  reg.status === "attended" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                                }`}>
                                {reg.status === "confirmed" ? "Confirmado" :
                                  reg.status === "pending" ? "Pendente" :
                                    reg.status === "attended" ? "Compareceu" : "Cancelado"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {registrations.length > 5 && (
                      <p className="text-sm text-gray-600 mt-2 px-4 pb-2">
                        ... e mais {registrations.length - 5} registros
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Botões de gerar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={generatePDF}
                  disabled={isGenerating || isLoading || registrations.length === 0}
                  className="flex-1 sm:flex-none"
                  size="lg"
                  variant="outline"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  {isGenerating ? "Gerando PDF..." : "Gerar PDF"}
                </Button>

                <div className="flex-1 sm:flex-none">
                  <ExcelExportButton
                    data={registrations}
                    selectedCity={selectedCity}
                    selectedDate={selectedDate}
                    isLoading={isLoading}
                  />
                </div>
              </div>

              {registrations.length === 0 && !isLoading && (
                <p className="text-gray-600 text-center py-4">
                  Nenhum agendamento encontrado para os filtros selecionados.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">Instruções de uso:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Selecione os filtros desejados (cidade e/ou data)</li>
              <li>• Visualize o preview dos dados que serão incluídos no relatório</li>
              <li>• <strong>Excel:</strong> Formato profissional seguindo gabarito WaSeller com estilos e formatação</li>
              <li>• <strong>PDF:</strong> Formato simples para visualização rápida</li>
              <li>• Escolha entre exportação completa (com CPF) ou básica (sem dados sensíveis)</li>
              <li>• Os arquivos são baixados automaticamente com nomes descritivos</li>
              <li>• Os registros estão ordenados alfabeticamente por nome</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsTemp;
