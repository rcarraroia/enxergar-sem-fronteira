/**
 * =====================================================
 * LISTA DE PACIENTES COM TRATAMENTO DE ERROS
 * =====================================================
 * Exemplo de componente que usa o sistema de erros
 */

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertCircle, 
  Edit, 
  Plus, 
  RefreshCw, 
  Search, 
  Trash2,
  Users
} from "lucide-react";
import type { Patient } from "@/lib/validation/schemas";
import { 
  deletePatient, 
  getPatientStats, 
  listPatients,
  searchPatientsByEmail 
} from "@/lib/api/patients";
import { 
  EmptyErrorState,
  ErrorDisplay,
  ErrorList,
  useAsyncOperation,
  useErrorHandler,
  withErrorBoundary
} from "@/lib/errors";
import { toast } from "sonner";

interface PatientListProps {
  onEditPatient?: (patient: Patient) => void
  onCreatePatient?: () => void
}

const PatientList: React.FC<PatientListProps> = ({
  onEditPatient,
  onCreatePatient
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, lastMonth: 0 });
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);

  const { handle: handleError } = useErrorHandler();

  // Operação para carregar pacientes
  const {
    execute: loadPatients,
    isLoading: isLoadingPatients,
    error: loadPatientsError,
    retry: retryLoadPatients
  } = useAsyncOperation({
    onSuccess: (data: Patient[]) => {
      setPatients(data);
    },
    retryable: true,
    maxRetries: 3
  });

  // Operação para carregar estatísticas
  const {
    execute: loadStats,
    isLoading: isLoadingStats,
    error: loadStatsError
  } = useAsyncOperation({
    onSuccess: (data: typeof stats) => {
      setStats(data);
    },
    retryable: true
  });

  // Operação para buscar pacientes
  const {
    execute: searchPatients,
    isLoading: isSearching,
    error: searchError
  } = useAsyncOperation({
    onSuccess: (data: Patient[]) => {
      setPatients(data);
    }
  });

  // Operação para deletar paciente
  const {
    execute: executeDeletePatient,
    isLoading: isDeleting
  } = useAsyncOperation({
    onSuccess: () => {
      toast.success("Paciente removido com sucesso!");
      // Recarregar lista
      handleLoadPatients();
    },
    showSuccessToast: false // Já mostramos o toast customizado
  });

  // Carregar dados iniciais
  useEffect(() => {
    handleLoadPatients();
    handleLoadStats();
  }, []);

  // Handlers
  const handleLoadPatients = async () => {
    const result = await loadPatients(() => listPatients({ limit: 100 }));
    if (!result.success) {
      console.error("Erro ao carregar pacientes:", result.error);
    }
  };

  const handleLoadStats = async () => {
    const result = await loadStats(() => getPatientStats());
    if (!result.success) {
      console.error("Erro ao carregar estatísticas:", result.error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      handleLoadPatients();
      return;
    }

    const result = await searchPatients(() => 
      searchPatientsByEmail(searchTerm)
    );
    
    if (!result.success) {
      console.error("Erro na busca:", result.error);
    }
  };

  const handleDeletePatient = async (patient: Patient) => {
    if (!confirm(`Tem certeza que deseja remover o paciente ${patient.nome}?`)) {
      return;
    }

    const result = await executeDeletePatient(() => 
      deletePatient(patient.id!)
    );
    
    if (!result.success) {
      console.error("Erro ao deletar paciente:", result.error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Renderização de estados de erro
  if (loadPatientsError && patients.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <ErrorDisplay
            error={loadPatientsError}
            onRetry={retryLoadPatients}
            showDetails={process.env.NODE_ENV === "development"}
            variant="card"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? "..." : stats.total}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoadingStats ? "..." : stats.thisMonth}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mês Anterior</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoadingStats ? "..." : stats.lastMonth}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Erro nas estatísticas */}
      {loadStatsError && (
        <ErrorDisplay
          error={loadStatsError}
          variant="inline"
          onDismiss={() => {}} // Implementar se necessário
        />
      )}

      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Pacientes Cadastrados</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="flex gap-2 flex-1 sm:flex-initial">
                <Input
                  placeholder="Buscar por email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-w-[200px]"
                />
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  variant="outline"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                onClick={handleLoadPatients}
                disabled={isLoadingPatients}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingPatients ? "animate-spin" : ""}`} />
              </Button>
              {onCreatePatient && (
                <Button onClick={onCreatePatient}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Paciente
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Erros de busca */}
          {searchError && (
            <div className="mb-4">
              <ErrorDisplay
                error={searchError}
                variant="alert"
                onRetry={() => handleSearch()}
              />
            </div>
          )}

          {/* Lista de pacientes */}
          {isLoadingPatients ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Carregando pacientes...</p>
            </div>
          ) : patients.length === 0 ? (
            <EmptyErrorState
              title="Nenhum paciente encontrado"
              description={
                searchTerm 
                  ? `Nenhum resultado para "${searchTerm}"`
                  : "Ainda não há pacientes cadastrados."
              }
              action={
                onCreatePatient ? {
                  label: "Cadastrar primeiro paciente",
                  onClick: onCreatePatient
                } : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      {patient.nome}
                    </TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>{patient.telefone}</TableCell>
                    <TableCell>
                      {patient.cidade && patient.estado 
                        ? `${patient.cidade}, ${patient.estado}`
                        : patient.cidade || patient.estado || "-"
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Ativo</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {onEditPatient && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditPatient(patient)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePatient(patient)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Exportar com Error Boundary
export default withErrorBoundary(PatientList, {
  fallback: (
    <Card>
      <CardContent className="p-6">
        <ErrorDisplay
          error="Erro crítico no componente de lista de pacientes"
          variant="card"
        />
      </CardContent>
    </Card>
  )
});