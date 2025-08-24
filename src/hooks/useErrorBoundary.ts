
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ErrorInfo {
  message: string
  stack?: string
  timestamp: Date
  component?: string
}

export const useErrorBoundary = (componentName?: string) => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorInfo: ErrorInfo = {
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date(),
        component: componentName
      };
      
      console.error(`❌ Erro capturado${componentName ? ` em ${componentName}` : ""}:`, errorInfo);
      
      setErrors(prev => [...prev.slice(-9), errorInfo]); // Manter apenas os últimos 10 erros
      
      // Mostrar toast apenas para erros críticos
      if (!event.message.includes("Non-Error promise rejection")) {
        toast.error(`Erro${componentName ? ` em ${componentName}` : ""}: ${event.message}`);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorInfo: ErrorInfo = {
        message: `Promise rejeitada: ${event.reason}`,
        timestamp: new Date(),
        component: componentName
      };
      
      console.error(`❌ Promise não tratada${componentName ? ` em ${componentName}` : ""}:`, errorInfo);
      
      setErrors(prev => [...prev.slice(-9), errorInfo]);
      
      // Prevenir o erro não tratado padrão para alguns casos
      if (typeof event.reason === "string" && event.reason.includes("AbortError")) {
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [componentName]);

  const clearErrors = () => setErrors([]);

  return {
    errors,
    clearErrors,
    hasErrors: errors.length > 0
  };
};
