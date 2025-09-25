/**
 * Exemplo de Uso do Sistema de Tratamento de Erros
 *
 * Demonstra como usar o sistema de tratamento de erros
 * em diferentes cenários da aplicação.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

// Sistema de erros
import {
    createBusinessLogicError,
    createNetworkError,
    createValidationError,
    ErrorBoundary,
    ErrorDisplay,
    ErrorList,
    useApiErrorHandler,
    useErrorHandler
} from "@/lib/errors";

// ============================================================================
// EXEMPLO PRINCIPAL
// ============================================================================

export function ErrorSystemExample() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Sistema de Tratamento de Erros</h1>
        <p className="text-gray-600">
          Exemplos de uso do sistema de tratamento de erros estruturado.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ValidationErrorExample />
        <NetworkErrorExample />
        <ApiErrorExample />
        <ErrorBoundaryExample />
      </div>

      <ErrorListExample />
    </div>
  );
}

// ============================================================================
// EXEMPLO DE ERRO DE VALIDAÇÃO
// ============================================================================

function ValidationErrorExample() {
  const [email, setEmail] = useState("");
  const { handleValidationError, errors, clearErrors } = useErrorHandler({
    showToast: false // Não mostrar toast para este exemplo
  });

  const handleSubmit = () => {
    clearErrors();

    if (!email) {
      handleValidationError("Email é obrigatório", "email");
      return;
    }

    if (!email.includes("@")) {
      handleValidationError("Email deve ter formato válido", "email");
      return;
    }

    // Simular sucesso
    alert("Email válido!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Erro de Validação</CardTitle>
        <CardDescription>
          Exemplo de validação de formulário com erros estruturados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu email"
          />
        </div>

        <Button onClick={handleSubmit} className="w-full">
          Validar Email
        </Button>

        {errors.length > 0 && (
          <div className="space-y-2">
            {errors.map((error, index) => (
              <ErrorDisplay
                key={index}
                error={error}
                variant="inline"
                onDismiss={() => clearErrors()}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXEMPLO DE ERRO DE REDE
// ============================================================================

function NetworkErrorExample() {
  const { handleNetworkError, errors, clearErrors } = useErrorHandler({
    showToast: false
  });

  const simulateNetworkError = (type: "timeout" | "500" | "404") => {
    clearErrors();

    switch (type) {
      case "timeout":
        handleNetworkError(
          { name: "AbortError", message: "Request timeout" },
          "/api/slow-endpoint"
        );
        break;
      case "500":
        handleNetworkError(
          { status: 500, message: "Internal Server Error" },
          "/api/server-error"
        );
        break;
      case "404":
        handleNetworkError(
          { status: 404, message: "Not Found" },
          "/api/missing-endpoint"
        );
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Erros de Rede</CardTitle>
        <CardDescription>
          Simulação de diferentes tipos de erros de rede
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button
            onClick={() => simulateNetworkError("timeout")}
            variant="outline"
            className="w-full"
          >
            Simular Timeout
          </Button>
          <Button
            onClick={() => simulateNetworkError("500")}
            variant="outline"
            className="w-full"
          >
            Simular Erro 500
          </Button>
          <Button
            onClick={() => simulateNetworkError("404")}
            variant="outline"
            className="w-full"
          >
            Simular Erro 404
          </Button>
        </div>

        {errors.length > 0 && (
          <ErrorDisplay
            error={errors[0]}
            variant="card"
            onDismiss={clearErrors}
            onRetry={() => alert("Tentando novamente...")}
            showDetails
          />
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXEMPLO DE ERRO DE API
// ============================================================================

function ApiErrorExample() {
  const { withErrorHandling, withRetry } = useApiErrorHandler();
  const [result, setResult] = useState<string>("");

  const simulateApiCall = async (shouldFail = false) => {
    // Simular chamada de API
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (shouldFail) {
      throw new Error("API call failed");
    }

    return "API call successful!";
  };

  const handleApiCall = async () => {
    setResult("Carregando...");

    const result = await withErrorHandling(
      () => simulateApiCall(false),
      { action: "fetch_data", resource: "user_profile" }
    );

    if (result.success) {
      setResult(result.data);
    } else {
      setResult("Erro na API");
    }
  };

  const handleApiCallWithRetry = async () => {
    setResult("Tentando com retry...");

    const result = await withRetry(
      () => simulateApiCall(Math.random() > 0.7), // 30% chance de sucesso
      3,
      { action: "fetch_data_with_retry", resource: "user_profile" }
    );

    if (result.success) {
      setResult(result.data);
    } else {
      setResult("Falhou após 3 tentativas");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Erros de API</CardTitle>
        <CardDescription>
          Exemplo de tratamento de erros em chamadas de API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button onClick={handleApiCall} className="w-full">
            Chamada de API Normal
          </Button>
          <Button onClick={handleApiCallWithRetry} variant="outline" className="w-full">
            Chamada com Retry
          </Button>
        </div>

        {result && (
          <div className="p-3 bg-gray-100 rounded text-sm">
            <strong>Resultado:</strong> {result}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXEMPLO DE ERROR BOUNDARY
// ============================================================================

function ErrorBoundaryExample() {
  const [shouldError, setShouldError] = useState(false);

  const ProblematicComponent = () => {
    if (shouldError) {
      throw new Error("Componente quebrou intencionalmente!");
    }

    return (
      <div className="p-4 bg-green-100 text-green-800 rounded">
        ✅ Componente funcionando normalmente
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Boundary</CardTitle>
        <CardDescription>
          Exemplo de captura de erros em componentes React
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => setShouldError(!shouldError)}
          variant={shouldError ? "destructive" : "default"}
          className="w-full"
        >
          {shouldError ? "Corrigir Componente" : "Quebrar Componente"}
        </Button>

        <ErrorBoundary
          level="component"
          onError={(error) => console.log("Error caught:", error)}
        >
          <ProblematicComponent />
        </ErrorBoundary>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXEMPLO DE LISTA DE ERROS
// ============================================================================

function ErrorListExample() {
  const [errors, setErrors] = useState([
    createValidationError("Nome é obrigatório", "name"),
    createNetworkError(500, "/api/users", "GET"),
    createBusinessLogicError(
      "idade_minima",
      "Usuário deve ter pelo menos 18 anos",
      18,
      16
    )
  ]);

  const clearError = (index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllErrors = () => {
    setErrors([]);
  };

  const addRandomError = () => {
    const randomErrors = [
      createValidationError("Email inválido", "email"),
      createNetworkError(404, "/api/missing", "GET"),
      createBusinessLogicError("saldo_insuficiente", "Saldo insuficiente para esta operação")
    ];

    const randomError = randomErrors[Math.floor(Math.random() * randomErrors.length)];
    setErrors(prev => [...prev, randomError]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Erros</CardTitle>
        <CardDescription>
          Exemplo de exibição de múltiplos erros em lista
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={addRandomError} variant="outline">
            Adicionar Erro
          </Button>
          <Button onClick={clearAllErrors} variant="ghost">
            Limpar Todos
          </Button>
        </div>

        <Separator />

        <ErrorList
          errors={errors}
          onDismiss={clearError}
          onDismissAll={clearAllErrors}
          showDetails={false}
        />

        {errors.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum erro ativo. Clique em "Adicionar Erro" para testar.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ErrorSystemExample;
