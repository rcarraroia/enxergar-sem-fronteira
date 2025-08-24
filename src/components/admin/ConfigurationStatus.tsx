import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSecureConfig } from "@/hooks/useSecureConfig";
import {
    AlertTriangle,
    CheckCircle,
    CreditCard,
    Database,
    Key,
    Mail,
    MessageSquare,
    RefreshCw,
    Shield,
    XCircle
} from "lucide-react";

export function ConfigurationStatus() {
    const {
        configStatus,
        isLoading,
        error,
        refetch,
        migrateApiKeys
    } = useSecureConfig();

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Status das Configurações Seguras
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Carregando status das configurações...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Status das Configurações Seguras
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Erro ao carregar configurações: {error.message}
                        </AlertDescription>
                    </Alert>
                    <Button onClick={() => refetch()} className="mt-2" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Tentar Novamente
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const getStatusBadge = (status: "secure" | "warning" | "critical") => {
        switch (status) {
            case "secure":
                return <Badge variant="default" className="bg-green-100 text-green-800">Seguro</Badge>;
            case "warning":
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
            case "critical":
                return <Badge variant="destructive">Crítico</Badge>;
            default:
                return <Badge variant="outline">Desconhecido</Badge>;
        }
    };

    const getStatusIcon = (status: "secure" | "warning" | "critical") => {
        switch (status) {
            case "secure":
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case "warning":
                return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
            case "critical":
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <XCircle className="h-4 w-4 text-gray-400" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Status das Configurações Seguras
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {configStatus?.secure_configs || 0}
                            </div>
                            <div className="text-sm text-gray-600">Configurações Seguras</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                                {configStatus?.warning_configs || 0}
                            </div>
                            <div className="text-sm text-gray-600">Necessitam Atenção</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                                {configStatus?.critical_configs || 0}
                            </div>
                            <div className="text-sm text-gray-600">Críticas</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Configurações Individuais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supabase */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                Supabase
                            </div>
                            {getStatusBadge(configStatus?.supabase?.status || "critical")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">URL configurada</span>
                            {getStatusIcon(configStatus?.supabase?.url_status || "critical")}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Chave anônima</span>
                            {getStatusIcon(configStatus?.supabase?.anon_key_status || "critical")}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Chave de serviço</span>
                            {getStatusIcon(configStatus?.supabase?.service_key_status || "critical")}
                        </div>
                    </CardContent>
                </Card>

                {/* ASAAS API */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                ASAAS API
                            </div>
                            {getStatusBadge(configStatus?.asaas?.status || "critical")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Chave API</span>
                            {getStatusIcon(configStatus?.asaas?.api_key_status || "critical")}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Webhook configurado</span>
                            {getStatusIcon(configStatus?.asaas?.webhook_status || "warning")}
                        </div>
                        {configStatus?.asaas?.keys_in_database && (
                            <Alert variant="destructive" className="mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    Chaves encontradas no banco de dados - RISCO DE SEGURANÇA
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* WhatsApp API */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                WhatsApp API
                            </div>
                            {getStatusBadge(configStatus?.whatsapp?.status || "critical")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Token configurado</span>
                            {getStatusIcon(configStatus?.whatsapp?.token_status || "critical")}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Webhook configurado</span>
                            {getStatusIcon(configStatus?.whatsapp?.webhook_status || "warning")}
                        </div>
                        {configStatus?.whatsapp?.keys_in_database && (
                            <Alert variant="destructive" className="mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    Chaves encontradas no banco de dados - RISCO DE SEGURANÇA
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Email */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email (SMTP)
                            </div>
                            {getStatusBadge(configStatus?.email?.status || "warning")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Servidor SMTP</span>
                            {getStatusIcon(configStatus?.email?.smtp_status || "warning")}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Autenticação</span>
                            {getStatusIcon(configStatus?.email?.auth_status || "warning")}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Ações */}
            {(configStatus?.asaas?.keys_in_database || configStatus?.whatsapp?.keys_in_database) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Ação Necessária: Migrar Chaves do Banco
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>RISCO CRÍTICO DE SEGURANÇA:</strong> Chaves de API foram encontradas
                                armazenadas no banco de dados. Isso representa um risco grave de segurança.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2 mb-4">
                            <p className="text-sm font-medium">Chaves encontradas no banco:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                                {configStatus?.asaas?.keys_in_database && (
                                    <li>• Chaves ASAAS na tabela organizers</li>
                                )}
                                {configStatus?.whatsapp?.keys_in_database && (
                                    <li>• Chaves WhatsApp na tabela organizers</li>
                                )}
                            </ul>
                        </div>

                        <Button
                            onClick={migrateApiKeys}
                            variant="destructive"
                            className="w-full"
                        >
                            <Key className="h-4 w-4 mr-2" />
                            Migrar Chaves para Variáveis de Ambiente
                        </Button>

                        <p className="text-xs text-gray-500 mt-2">
                            Esta ação irá mover as chaves para variáveis de ambiente seguras
                            e remover do banco de dados.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Instruções */}
            <Card>
                <CardHeader>
                    <CardTitle>Próximos Passos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <p>Para melhorar a segurança das configurações:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li>Configure todas as variáveis de ambiente necessárias</li>
                            <li>Remova chaves sensíveis do banco de dados</li>
                            <li>Configure webhooks para APIs externas</li>
                            <li>Teste todas as integrações após a migração</li>
                            <li>Configure rotação automática de chaves</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}