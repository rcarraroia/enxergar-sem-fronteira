/**
 * BulkMessageSender - Componente para envio de mensagens em massa
 *
 * Permite que administradores enviem mensagens em massa (email, SMS, WhatsApp)
 * para pacientes baseado em eventos e filtros específicos.
 */

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// UI Components
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Icons
import { AlertTriangle, CheckCircle, Eye, Mail, MessageSquare, Send, Smartphone, Users, XCircle } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface Event {
  id: string
  title: string
  location: string
  city: string
  status: string
  registrations_count?: number
}

interface Template {
  id: string
  name: string
  type: "email" | "sms" | "whatsapp"
  subject?: string
  content: string
  is_active: boolean
}

interface BulkMessageFilters {
  eventIds: string[]
  messageTypes: ("email" | "sms" | "whatsapp")[]
  templateName?: string
  customMessage?: string
  patientStatus?: string[]
  registrationStatus?: string[]
  city?: string[]
  dateRange?: {
    start: string
    end: string
  }
}

interface SendResult {
  success: boolean
  message: string
  data: {
    totalRecipients: number
    emailsSent: number
    smsSent: number
    whatsappSent: number
    errors: string[]
    recipients: Array<{
      patientId: string
      patientName: string
      email?: string
      phone?: string
      emailSent: boolean
      smsSent: boolean
      whatsappSent: boolean
      errors: string[]
    }>
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export const BulkMessageSender: React.FC = () => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [events, setEvents] = useState<Event[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<SendResult | null>(null);

  const [filters, setFilters] = useState<BulkMessageFilters>({
    eventIds: [],
    messageTypes: ["email"],
    templateName: "",
    customMessage: "",
    patientStatus: ["active"],
    registrationStatus: ["confirmed"],
    city: [],
    dateRange: undefined
  });

  // ============================================================================
  // HOOKS
  // ============================================================================

  const { isAdmin } = useAuth();

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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load events with registration counts
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select(`
          id,
          title,
          location,
          city,
          status,
          registrations:registrations(count)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (eventsError) {throw eventsError;}

      const processedEvents = ((eventsData as any[]) || []).map((event: any) => ({
        ...event,
        registrations_count: event.registrations?.[0]?.count || 0
      }));
      setEvents(processedEvents);

      // Load templates
      const { data: templatesData, error: templatesError } = await supabase
        .from("notification_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (templatesError) {throw templatesError;}

      setTemplates(((templatesData as any[]) || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        type: (t.type as "email" | "sms" | "whatsapp") || "email",
        subject: t.subject ?? undefined,
        content: t.content,
        is_active: !!t.is_active,
      })));

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleEventToggle = (eventId: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      eventIds: checked
        ? [...prev.eventIds, eventId]
        : prev.eventIds.filter(id => id !== eventId)
    }));
  };

  const handleMessageTypeToggle = (type: "email" | "sms" | "whatsapp", checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      messageTypes: checked
        ? [...prev.messageTypes, type]
        : prev.messageTypes.filter(t => t !== type)
    }));
  };


  const handleSend = async (testMode = false) => {
    if (filters.messageTypes.length === 0) {
      toast.error("Selecione pelo menos um tipo de mensagem");
      return;
    }

    if (filters.eventIds.length === 0) {
      toast.error("Selecione pelo menos um evento");
      return;
    }

    if (!filters.templateName && !filters.customMessage) {
      toast.error("Selecione um template ou digite uma mensagem customizada");
      return;
    }

    try {
      setSending(true);
      setLastResult(null);

      const { data, error } = await supabase.functions.invoke("send-bulk-messages", {
        body: {
          eventIds: filters.eventIds,
          messageTypes: filters.messageTypes,
          templateName: filters.templateName || undefined,
          customMessage: filters.customMessage || undefined,
          testMode,
          filters: {
            patientStatus: filters.patientStatus,
            registrationStatus: filters.registrationStatus,
            city: filters.city?.length ? filters.city : undefined,
            dateRange: filters.dateRange
          }
        }
      });

      if (error) {throw error;}

      setLastResult(data);

      if (data.success) {
        toast.success(testMode ? "Teste realizado com sucesso!" : "Mensagens enviadas com sucesso!");
      } else {
        toast.error(`Erro no envio: ${  data.message}`);
      }

    } catch (error) {
      console.error("Erro no envio:", error);
      toast.error("Erro ao enviar mensagens");
    } finally {
      setSending(false);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderEventSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Selecionar Eventos
        </CardTitle>
        <CardDescription>
          Escolha os eventos cujos pacientes receberão as mensagens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={`event-${event.id}`}
                checked={filters.eventIds.includes(event.id)}
                onCheckedChange={(checked) => handleEventToggle(event.id, checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor={`event-${event.id}`} className="font-medium cursor-pointer">
                  {event.title}
                </Label>
                <div className="text-sm text-gray-600">
                  {event.location} - {event.city}
                </div>
              </div>
              <Badge variant="outline">
                {event.registrations_count || 0} inscritos
              </Badge>
            </div>
          ))}
        </div>

        {filters.eventIds.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-900">
              {filters.eventIds.length} evento(s) selecionado(s)
            </div>
            <div className="text-xs text-blue-700">
              Estimativa: ~{events.filter(e => filters.eventIds.includes(e.id))
                .reduce((sum, e) => sum + (e.registrations_count || 0), 0)} destinatários
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderMessageTypes = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Tipos de Mensagem
        </CardTitle>
        <CardDescription>
          Selecione os canais de comunicação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="email"
              checked={filters.messageTypes.includes("email")}
              onCheckedChange={(checked) => handleMessageTypeToggle("email", checked as boolean)}
            />
            <Mail className="h-4 w-4 text-blue-600" />
            <Label htmlFor="email" className="cursor-pointer">Email</Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="sms"
              checked={filters.messageTypes.includes("sms")}
              onCheckedChange={(checked) => handleMessageTypeToggle("sms", checked as boolean)}
            />
            <Smartphone className="h-4 w-4 text-green-600" />
            <Label htmlFor="sms" className="cursor-pointer">SMS</Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="whatsapp"
              checked={filters.messageTypes.includes("whatsapp")}
              onCheckedChange={(checked) => handleMessageTypeToggle("whatsapp", checked as boolean)}
            />
            <MessageSquare className="h-4 w-4 text-green-500" />
            <Label htmlFor="whatsapp" className="cursor-pointer">WhatsApp</Label>
          </div>
        </div>

        {filters.messageTypes.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-900">
              {filters.messageTypes.length} canal(is) selecionado(s)
            </div>
            <div className="text-xs text-green-700">
              {filters.messageTypes.join(", ")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderMessageContent = () => (
    <Card>
      <CardHeader>
        <CardTitle>Conteúdo da Mensagem</CardTitle>
        <CardDescription>
          Escolha um template ou digite uma mensagem customizada
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="template" className="space-y-4">
          <TabsList>
            <TabsTrigger value="template">Usar Template</TabsTrigger>
            <TabsTrigger value="custom">Mensagem Customizada</TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-4">
            <div>
              <Label htmlFor="template">Template</Label>
              <Select
                value={filters.templateName}
                onValueChange={(value) => setFilters(prev => ({ ...prev, templateName: value, customMessage: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
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

            {filters.templateName && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Preview do Template:</div>
                <div className="text-xs text-gray-600">
                  {templates.find(t => t.name === filters.templateName)?.content}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div>
              <Label htmlFor="customMessage">Mensagem Customizada</Label>
              <Textarea
                id="customMessage"
                placeholder="Digite sua mensagem aqui..."
                value={filters.customMessage}
                onChange={(e) => setFilters(prev => ({ ...prev, customMessage: e.target.value, templateName: "" }))}
                rows={6}
              />
            </div>

            <div className="text-xs text-gray-500">
              Variáveis disponíveis: {"{patient_name}"}, {"{event_title}"}, {"{event_date}"}, {"{event_location}"}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  const renderResults = () => {
    if (!lastResult) {return null;}

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {lastResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            Resultado do Envio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {lastResult.data.totalRecipients}
                </div>
                <div className="text-sm text-blue-700">Total</div>
              </div>

              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {lastResult.data.emailsSent}
                </div>
                <div className="text-sm text-green-700">Emails</div>
              </div>

              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {lastResult.data.smsSent}
                </div>
                <div className="text-sm text-purple-700">SMS</div>
              </div>

              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {lastResult.data.whatsappSent}
                </div>
                <div className="text-sm text-yellow-700">WhatsApp</div>
              </div>
            </div>

            {lastResult.data.errors.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Erros encontrados:</div>
                  <ul className="text-sm space-y-1">
                    {lastResult.data.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {lastResult.data.errors.length > 5 && (
                      <li>• ... e mais {lastResult.data.errors.length - 5} erros</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Acesso negado: Apenas administradores podem enviar mensagens em massa</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Carregando dados...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Envio de Mensagens em Massa</h1>
        <p className="text-gray-600">
          Envie mensagens por email, SMS e WhatsApp para pacientes de eventos selecionados.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {renderEventSelection()}
        {renderMessageTypes()}
      </div>

      {renderMessageContent()}

      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={() => {/* TODO: Implement preview */}}
              variant="outline"
              disabled={sending || filters.eventIds.length === 0}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>

            <Button
              onClick={() => handleSend(true)}
              variant="outline"
              disabled={sending || filters.eventIds.length === 0 || filters.messageTypes.length === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Teste (não envia)
            </Button>

            <Button
              onClick={() => handleSend(false)}
              disabled={sending || filters.eventIds.length === 0 || filters.messageTypes.length === 0}
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Mensagens
                </>
              )}
            </Button>
          </div>

          {sending && (
            <div className="mt-4">
              <Progress value={33} className="w-full" />
              <div className="text-sm text-gray-600 mt-2">
                Enviando mensagens... Isso pode levar alguns minutos.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {renderResults()}
    </div>
  );
};

export default BulkMessageSender;
