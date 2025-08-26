/**
 * Exemplo de Integração com n8n
 *
 * Demonstra como configurar e testar a integração com workflows n8n
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Copy, XCircle } from 'lucide-react';
import React, { useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface WebhookTest {
  url: string;
  method: string;
  payload: any;
  response?: any;
  status?: 'pending' | 'success' | 'error';
  error?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const N8nIntegrationExample: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState(
    process.env.VITE_N8N_PUBLIC_WEBHOOK_URL || 'https://your-n8n.com/webhook/chat'
  );
  const [testMessage, setTestMessage] = useState('Olá! Este é um teste de integração.');
  const [testResult, setTestResult] = useState<WebhookTest | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const testWebhook = async () => {
    setIsLoading(true);
    setTestResult({
      url: webhookUrl,
      method: 'POST',
      payload: {
        message: testMessage,
        sessionId: `test-${Date.now()}`,
        type: 'public',
        timestamp: new Date().toISOString()
      },
      status: 'pending'
    });

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage,
          sessionId: `test-${Date.now()}`,
          type: 'public',
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();

      setTestResult(prev => ({
        ...prev!,
        response: data,
        status: response.ok ? 'success' : 'error',
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      }));
    } catch (error) {
      setTestResult(prev => ({
        ...prev!,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      case 'pending':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Testando...</Badge>;
      default:
        return <Badge variant="outline">Não testado</Badge>;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integração com n8n</CardTitle>
          <p className="text-muted-foreground">
            Configure e teste a integração com workflows n8n
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="test" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="test">Teste de Webhook</TabsTrigger>
              <TabsTrigger value="workflow">Workflow n8n</TabsTrigger>
              <TabsTrigger value="examples">Exemplos</TabsTrigger>
            </TabsList>

            {/* Tab: Teste de Webhook */}
            <TabsContent value="test" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Configuração do Teste */}
                <Card>
                  <CardHeader>
                    <CardTitle>Configuração do Teste</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url">URL do Webhook</Label>
                      <Input
                        id="webhook-url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://your-n8n.com/webhook/chat"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="test-message">Mensagem de Teste</Label>
                      <Textarea
                        id="test-message"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="Digite uma mensagem para testar..."
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={testWebhook}
                      disabled={isLoading || !webhookUrl || !testMessage}
                      className="w-full"
                    >
                      {isLoading ? 'Testando...' : 'Testar Webhook'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Resultado do Teste */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Resultado do Teste
                      {testResult && renderStatusBadge(testResult.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!testResult && (
                      <p className="text-muted-foreground text-center py-8">
                        Execute um teste para ver os resultados
                      </p>
                    )}

                    {testResult && (
                      <div className="space-y-4">
                        {/* Request */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Request Enviado</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(JSON.stringify(testResult.payload, null, 2))}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(testResult.payload, null, 2)}
                          </pre>
                        </div>

                        {/* Response */}
                        {testResult.response && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label>Response Recebido</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(JSON.stringify(testResult.response, null, 2))}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                              {JSON.stringify(testResult.response, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Error */}
                        {testResult.error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              {testResult.error}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Workflow n8n */}
            <TabsContent value="workflow" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuração do Workflow n8n</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">1. Criar Webhook Node</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm mb-3">Configure o node Webhook com as seguintes configurações:</p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• <strong>HTTP Method:</strong> POST</li>
                        <li>• <strong>Path:</strong> chat (ou outro path de sua escolha)</li>
                        <li>• <strong>Response Mode:</strong> Respond to Webhook</li>
                        <li>• <strong>Response Code:</strong> 200</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">2. Processar Mensagem</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm mb-3">Exemplo de código para processar a mensagem:</p>
                      <pre className="text-xs overflow-x-auto">
                        {`// Node: Function
const userMessage = $json.message;
const sessionId = $json.sessionId;
const chatType = $json.type;

// Lógica de processamento
let response = 'Obrigado pela sua mensagem!';

if (userMessage.toLowerCase().includes('preço')) {
  response = 'Nossos preços começam em R$ 99/mês. Gostaria de mais detalhes?';
} else if (userMessage.toLowerCase().includes('contato')) {
  response = 'Você pode nos contatar pelo telefone (11) 1234-5678 ou email contato@empresa.com';
}

return {
  success: true,
  data: {
    response,
    sessionId,
    sessionComplete: false,
    actions: [],
    metadata: {
      processedAt: new Date().toISOString()
    }
  }
};`}
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">3. Resposta Esperada</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm mb-3">O workflow deve retornar uma resposta no formato:</p>
                      <pre className="text-xs overflow-x-auto">
                        {`{
  "success": true,
  "data": {
    "response": "Resposta do agente",
    "sessionId": "session-123",
    "sessionComplete": false,
    "actions": [
      {
        "type": "redirect",
        "url": "/contact"
      }
    ],
    "metadata": {
      "sentiment": "positive",
      "confidence": 0.95
    }
  },
  "error": null
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Exemplos */}
            <TabsContent value="examples" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Exemplo Simples */}
                <Card>
                  <CardHeader>
                    <CardTitle>Exemplo Simples</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Workflow básico que responde com mensagem fixa
                    </p>
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                      {`{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "chat",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": {
          "success": true,
          "data": {
            "response": "Olá! Como posso ajudar?",
            "sessionId": "={{$json.sessionId}}",
            "sessionComplete": false
          }
        }
      }
    }
  ]
}`}
                    </pre>
                  </CardContent>
                </Card>

                {/* Exemplo com IA */}
                <Card>
                  <CardHeader>
                    <CardTitle>Exemplo com IA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Workflow que integra com OpenAI para respostas inteligentes
                    </p>
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                      {`{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "name": "OpenAI",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "operation": "chat",
        "model": "gpt-3.5-turbo",
        "messages": [
          {
            "role": "system",
            "content": "Você é um assistente virtual..."
          },
          {
            "role": "user",
            "content": "={{$json.message}}"
          }
        ]
      }
    },
    {
      "name": "Format Response",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "return { success: true, data: { response: $json.choices[0].message.content, sessionId: $('Webhook').first().json.sessionId } };"
      }
    }
  ]
}`}
                    </pre>
                  </CardContent>
                </Card>

                {/* Exemplo com Banco de Dados */}
                <Card>
                  <CardHeader>
                    <CardTitle>Exemplo com Banco de Dados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Workflow que salva conversas no banco de dados
                    </p>
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                      {`{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "name": "Save Message",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "insert",
        "table": "chat_messages",
        "columns": [
          "session_id",
          "message",
          "sender",
          "created_at"
        ],
        "values": [
          "={{$json.sessionId}}",
          "={{$json.message}}",
          "user",
          "={{new Date().toISOString()}}"
        ]
      }
    },
    {
      "name": "Generate Response",
      "type": "n8n-nodes-base.function"
    }
  ]
}`}
                    </pre>
                  </CardContent>
                </Card>

                {/* Exemplo com Validação */}
                <Card>
                  <CardHeader>
                    <CardTitle>Exemplo com Validação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Workflow com validação e tratamento de erros
                    </p>
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                      {`{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "name": "Validate Input",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": [
          {
            "leftValue": "={{$json.message}}",
            "operation": "isNotEmpty"
          }
        ]
      }
    },
    {
      "name": "Process Valid",
      "type": "n8n-nodes-base.function"
    },
    {
      "name": "Handle Error",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "return { success: false, error: 'Mensagem inválida' };"
      }
    }
  ]
}`}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default N8nIntegrationExample;
