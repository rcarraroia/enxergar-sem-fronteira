/**
 * PÁGINA DE ACESSO AO ADMIN V2
 * Portal para o ambiente de visualização da reconstrução
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle, 
  Construction,
  Eye,
  Shield
} from "lucide-react";

const AdminV2Access = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Você não tem permissão para acessar esta área.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Construction className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Ambiente de Visualização
            </h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Admin V2
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground">
            Acompanhe o progresso da reconstrução do painel administrativo
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Status da Reconstrução */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Construction className="h-5 w-5 text-blue-600" />
                Status da Reconstrução
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Arquitetura base criada</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Componentes base implementados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-sm">Dashboard principal - Em desenvolvimento</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Garantias de Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Garantias de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Sistema principal intocado</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Home page operacional</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Cadastros funcionando</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas Importantes */}
        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Ambiente Isolado:</strong> Esta versão está completamente isolada do sistema de produção. 
            Todas as alterações são feitas em ambiente separado, garantindo zero impacto no evento de sexta-feira.
          </AlertDescription>
        </Alert>

        {/* Acesso ao Painel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visualizar Progresso
            </CardTitle>
            <CardDescription>
              Acesse o painel administrativo em reconstrução para acompanhar o desenvolvimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => navigate("/admin-v2")}
                className="flex-1"
                size="lg"
              >
                <Eye className="h-4 w-4 mr-2" />
                Acessar Admin V2
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <Button 
                onClick={() => navigate("/admin")}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Voltar ao Admin Atual
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações Técnicas */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            <strong>Cronograma:</strong> 18 dias úteis | 
            <strong> Conclusão prevista:</strong> 16 de Setembro | 
            <strong> Evento protegido:</strong> 29 de Agosto
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminV2Access;