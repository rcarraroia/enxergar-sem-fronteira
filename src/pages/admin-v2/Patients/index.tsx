/**
 * ADMIN V2 - GESTÃO DE PACIENTES
 * Baseado no modelo ReportsTemp com filtros por cidade e data do evento
 */

import { useState } from "react";
import { AdminLayout } from "@/components/admin-v2/shared/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Calendar,
  FileDown,
  Mail,
  Phone,
  Search,
  Users
} from "lucide-react";
import { useAvailableCities, useRegistrationsFiltered } from "@/hooks/useRegistrationsFiltered";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Registration } from "@/hooks/useRegistrations";
import { formatDate } from "@/utils/dateUtils";

const AdminPatientsV2 = () => {
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Buscar cidades disponíveis
  const { data: availableCities = [] } = useAvailableCities();

  // Buscar dados com filtros (registrations que contêm os dados dos pacientes)
  const { data: registrations = [], isLoading, error } = useRegistrationsFiltered({
    city: selectedCity !== "all" ? selectedCity : undefined,
    date: selectedDate ? new Date(selectedDate) : undefined
  });

  // Extrair pacientes únicos das registrations e ordenar alfabeticamente
  const uniquePatients = registrations
    .reduce((acc: any[], reg: Registration) => {
      const existingPatient = acc.find(p => p.id === reg.patient.id);
      if (!existingPatient) {
        acc.push({
          id: reg.patient.id,
          name: reg.patient.nome,
          email: reg.patient.email,
          phone: reg.patient.telefone,
          birth_date: reg.patient.data_nascimento,
          city: reg.event_date.event.city,
          created_at: reg.created_at
        });
      }
      return acc;
    }, [])
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const generatePDF = () => {
    if (uniquePatients.length === 0) {
      toast.error("Nenhum paciente encontrado para os filtros selecionados");
      return;
    }

    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      
      // Título do relatório
      const title = "RELATÓRIO DE PACIENTES CADASTRADOS";
      
      // Usar a função formatDate corrigida
      const dateDisplayText = selectedDate ? formatDate(selectedDate) : "Todas as Datas";
      
      const subtitle = `${selectedCity !== "all" ? selectedCity : "Todas as Cidades"} - ${dateDisplayText}`;
      
      doc.setFontSize(16);
      doc.text(title, 14, 20);
      
      doc.setFontSize(12);
      doc.text(subtitle, 14, 30);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, 14, 40);
      doc.text(`Total de pacientes: ${uniquePatients.length}`, 14, 50);

      // Preparar dados para a tabela
      const tableData = uniquePatients.map((patient, index) => [
        index + 1,
        patient.name || "N/A",
        patient.birth_date ? formatDate(patient.birth_date) : "N/A",
        patient.email || "N/A",
        patient.phone || "N/A",
        patient.city || "N/A"
      ]);

      // Cabeçalhos da tabela
      const headers = [
        "#",
        "Nome",
        "Data Nascimento",
        "Email",
        "Telefone", 
        "Cidade"
      ];

      // Gerar tabela
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 60,
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 9,
          fontStyle: "bold"
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });

      // Nome do arquivo
      const cityName = selectedCity !== "all" ? selectedCity.replace(/\s+/g, "_") : "todas_cidades";
      const dateStr = selectedDate ? selectedDate.replace(/-/g, "_") : new Date().toISOString().split("T")[0].replace(/-/g, "_");
      const filename = `pacientes_${cityName}_${dateStr}.pdf`;

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
    <AdminLayout 
      title="Gestão de Pacientes" 
      breadcrumbs={[
        { label: "Dashboard", path: "/admin-v2" },
        { label: "Pacientes", path: "/admin-v2/patients" }
      ]}
    >
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados. Verifique sua conexão e tente novamente.
          </AlertDescription>
        </Alert>
      )}

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
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Gerar Relatório PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-600">Total de Pacientes</div>
                <div className="text-2xl font-bold text-blue-900">
                  {isLoading ? "..." : uniquePatients.length}
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-green-600">Registros Confirmados</div>
                <div className="text-2xl font-bold text-green-900">
                  {isLoading ? "..." : registrations.filter((r: Registration) => r.status === "confirmed").length}
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-yellow-600">Registros Pendentes</div>
                <div className="text-2xl font-bold text-yellow-900">
                  {isLoading ? "..." : registrations.filter((r: Registration) => r.status === "pending").length}
                </div>
              </div>
            </div>

            {/* Preview */}
            {uniquePatients.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Preview dos dados (primeiros 5 pacientes):</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-2 py-1 text-left">Nome</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Data Nascimento</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Email</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Telefone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uniquePatients.slice(0, 5).map((patient) => (
                        <tr key={patient.id}>
                          <td className="border border-gray-300 px-2 py-1">{patient.name || "N/A"}</td>
                          <td className="border border-gray-300 px-2 py-1">
                            {patient.birth_date ? formatDate(patient.birth_date) : "N/A"}
                          </td>
                          <td className="border border-gray-300 px-2 py-1">{patient.email || "N/A"}</td>
                          <td className="border border-gray-300 px-2 py-1">{patient.phone || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {uniquePatients.length > 5 && (
                    <p className="text-sm text-gray-600 mt-2">
                      ... e mais {uniquePatients.length - 5} pacientes
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Botão de gerar */}
            <Button
              onClick={generatePDF}
              disabled={isGenerating || isLoading || uniquePatients.length === 0}
              className="w-full md:w-auto"
              size="lg"
            >
              <FileDown className="h-4 w-4 mr-2" />
              {isGenerating ? "Gerando PDF..." : "Gerar Relatório PDF"}
            </Button>

            {uniquePatients.length === 0 && !isLoading && (
              <p className="text-gray-600 text-center py-4">
                Nenhum paciente encontrado para os filtros selecionados.
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
            <li>• Selecione os filtros desejados (cidade e/ou data do evento)</li>
            <li>• Visualize o preview dos pacientes que serão incluídos no relatório</li>
            <li>• Clique em "Gerar Relatório PDF" para fazer o download</li>
            <li>• O arquivo será baixado automaticamente com nome descritivo</li>
            <li>• Os pacientes são listados em ordem alfabética</li>
          </ul>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminPatientsV2;