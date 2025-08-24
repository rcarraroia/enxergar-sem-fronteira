/**
 * QuickBulkSender - Componente simplificado para envio rápido de mensagens em massa
 *
 * Interface mais simples e direta para envio de mensagens para eventos específicos.
 */

import { useAuth } from "@/hooks/useAuth";
import { useBulkMessaging } from "@/hooks/useBulkMessaging";
import { supabase } from "@/integrations/supabase/client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

// UI Components
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Icons
import { AlertTriangle, CheckCircle, Mail, MessageSquare, Send, Smartphone, Users } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface Event {
  id: string
  title: string
  location: string
  city: string
  registrations_count: number
}

interface Template {
  id: string
  name: string
  type: string
  subject?: string
  content: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export const QuickBulkSender: React.FC = () => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [events, setEvents] = useState<Event[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [messageTypes, setMessageTypes] = useState<("email" | "sms" | "whatsapp")[]>(["email"]);
  const [loading, setLoading] = useState(true);

  // ============================================================================
  // HOOKS
  // ============================================================================

  const { isAdmin } = useAuth();
  const { sendBulkMessages, loading: sending, lastResult } = useBulkMessaging();

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar eventos com contagem de inscrições
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select(`
          id,
          title,
          location,
          city,
          registrations:registrations(count)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (eventsError) {throw eventsError;}

      const processedEvents = eventsData?.map(event => ({
        ...event,
        registrations_count: event.registrations?.[0]?.count || 0
      })) || [];

      setEvents(processedEvents);

      // Carregar templates
      const { data: templatesData, error: templatesError } = await supabase
        .from("notification_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (templatesError) {throw templatesError;}

      setTemplates(templatesData || []);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleMessageTypeToggle = (type: "email" | "sms" | "whatsapp", checked: boolean) => {
    setMessageTypes(prev =>
      checked
        ? [...prev, type]
        : prev.filter(t => t !== type)
    );
  };

  const handleSend = async (testMode = false) => {
    if (!selectedEventId) {
      toast.error("Selecione um evento");
      return;
    }

    if (messageTypes.length === 0) {
      toast.error("Selecione pelo menos um tipo de mensagem");
      return;
    }

    if (!selectedTemplate && !customMessage.trim()) {
      toast.error("Selecione um template ou digite uma mensagem");
      return;
    }

    const result = await sendBulkMessages({
      eventIds: [selectedEventId],
      messageTypes,
      templateName: selectedTemplate || undefined,
      customMessage: customMessage.trim() || undefined,
      testMode,
      filters: {
        registrationStatus: ["confirmed"]
      }
    });

    if (result.success && !testMode) {
      // Limpar formulário após envio bem-sucedido
      setSelectedEventId("");
      setSelectedTemplate("");
      setCustomMessage("");
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedTemplateData = templates.find(t => t.name === selectedTemplate);

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (!isAdmin) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Acesso negado: Apenas administradores podem enviar mensagens em massa
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Envio Rápido de Mensagens
        </CardTitle>
        <CardDescription>
          Envie mensagens rapidamente para todos os pacientes de um evento
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Seleção de Evento */}
        <div className="space-y-2">
          <Label htmlFor="event">Evento</Label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um evento" />
            </SelectTrigger>
            <SelectContent>
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{event.title}</span>
                    <Badge variant="outline" className="ml-2">
                      {event.registrations_count} inscritos
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedEvent && (
            <div className="text-sm text-gray-600">
              📍 {selectedEvent.location} - {selectedEvent.city}
            </div>
          )}
        </div>

        {/* Tipos de Mensagem */}
        <div className="space-y-3">
          <Label>Canais de Envio</Label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="email"
                checked={messageTypes.includes("email")}
                onCheckedChange={(checked) => handleMessageTypeToggle("email", checked as boolean)}
              />
              <Mail className="h-4 w-4 text-blue-600" />
              <Label htmlFor="email" className="cursor-pointer">Email</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sms"
                checked={messageTypes.includes("sms")}
                onCheckedChange={(checked) => handleMessageTypeToggle("sms", checked as boolean)}
              />
              <Smartphone className="h-4 w-4 text-green-600" />
              <Label htmlFor="sms" className="cursor-pointer">SMS</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="whatsapp"
                checked={messageTypes.includes("whatsapp")}
                onCheckedChange={(checked) => handleMessageTypeToggle("whatsapp", checked as boolean)}
              />
              <MessageSquare className="h-4 w-4 text-green-500" />
              <Label htmlFor="whatsapp" className="cursor-pointer">WhatsApp</Label>
            </div>
          </div>
        </div>

        {/* Template ou Mensagem Customizada */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">Template (Opcional)</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template ou digite mensagem customizada" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.name}>
                    {template.name} ({template.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplateData && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium mb-1">Preview do Template:</div>
              {selectedTemplateData.subject && (
                <div className="text-xs text-gray-600 mb-1">
                  <strong>Assunto:</strong> {selectedTemplateData.subject}
                </div>
              )}
              <div className="text-xs text-gray-600">
                {selectedTemplateData.content}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="customMessage">
              {selectedTemplate ? "Ou Mensagem Customizada" : "Mensagem Customizada"}
            </Label>
            <Textarea
              id="customMessage"
              placeholder="Digite sua mensagem aqui..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
            />
            <div className="text-xs text-gray-500">
              Variáveis: {"{patient_name}"}, {"{event_title}"}, {"{event_date}"}, {"{event_location}"}
            </div>
          </div>
        </div>

        {/* Preview de Destinatários */}
        {selectedEvent && messageTypes.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Preview do Envio</span>
            </div>
            <div className="text-sm text-blue-800">
              <div>📧 Evento: {selectedEvent.title}</div>
              <div>👥 Destinatários: {selectedEvent.registrations_count} pacientes</div>
              <div>📱 Canais: {messageTypes.join(", ")}</div>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-3">
          <Button
            onClick={() => handleSend(true)}
            variant="outline"
            disabled={sending || !selectedEventId || messageTypes.length === 0}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            Teste (não envia)
          </Button>

          <Button
            onClick={() => handleSend(false)}
            disabled={sending || !selectedEventId || messageTypes.length === 0 || (!selectedTemplate && !customMessage.trim())}
            className="flex-1"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Agora
              </>
            )}
          </Button>
        </div>

        {/* Resultado do Último Envio */}
        {lastResult && (
          <Alert className={lastResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {lastResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              <div className="font-medium mb-2">
                {lastResult.success ? "Envio Concluído!" : "Erro no Envio"}
              </div>

              {lastResult.success && (
                <div className="text-sm space-y-1">
                  <div>📧 Emails: {lastResult.data.emailsSent}</div>
                  <div>📱 SMS: {lastResult.data.smsSent}</div>
                  <div>💬 WhatsApp: {lastResult.data.whatsappSent}</div>
                  <div>👥 Total: {lastResult.data.totalRecipients} destinatários</div>
                </div>
              )}

              {lastResult.data.errors.length > 0 && (
                <div className="text-sm mt-2">
                  <div className="font-medium">Erros:</div>
                  <ul className="list-disc list-inside">
                    {lastResult.data.errors.slice(0, 3).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {lastResult.data.errors.length > 3 && (
                      <li>... e mais {lastResult.data.errors.length - 3} erros</li>
                    )}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickBulkSender;
