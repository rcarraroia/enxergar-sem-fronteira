/**
 * GERENCIADOR DE AUTOMAÇÃO
 */

import { useState } from "react";
import { Clock, Pause, Play, Plus, Settings, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAutomationRules, useCreateAutomationRule, useMessageTemplates } from "@/hooks/messages/useMessages";
import { TRIGGER_EVENTS } from "@/types/messages";
import type { CreateAutomationRuleData } from "@/types/messages";

export function AutomationManager() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const { data: rules = [], isLoading } = useAutomationRules();
  const { data: templates = [] } = useMessageTemplates();
  const { mutate: createRule, isPending: isCreating } = useCreateAutomationRule();

  const getTriggerEventLabel = (event: string) => {
    const labels: Record<string, string> = {
      "on_registration_success": "Cadastro realizado",
      "on_appointment_created": "Consulta agendada",
      "on_appointment_24h_before": "24h antes da consulta",
      "on_appointment_cancelled": "Consulta cancelada",
      "on_donation_received": "Doação recebida",
      "on_donation_failed": "Doação falhou",
      "on_campaign_completion": "Campanha finalizada",
      "on_campaign_milestone": "Meta da campanha atingida",
      "on_promoter_registered": "Promotor cadastrado",
      "on_event_completed": "Evento finalizado"
    };
    return labels[event] || event;
  };

  const getDelayLabel = (minutes: number) => {
    if (minutes === 0) {return "Imediato";}
    if (minutes < 60) {return `${minutes} minutos`;}
    if (minutes < 1440) {return `${Math.floor(minutes / 60)} horas`;}
    return `${Math.floor(minutes / 1440)} dias`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automação</h2>
          <p className="text-muted-foreground">
            Configure regras para envio automático de mensagens
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      {/* Lista de regras */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : rules.length > 0 ? (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Zap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      {rule.description && (
                        <CardDescription>{rule.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                    <Switch checked={rule.is_active} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">EVENTO</p>
                    <p className="text-sm">{getTriggerEventLabel(rule.trigger_event)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">TEMPLATE</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{rule.template?.name || "Template não encontrado"}</p>
                      {rule.template && (
                        <Badge variant="outline" className="text-xs">
                          {rule.template.channel.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">DELAY</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{getDelayLabel(rule.delay_minutes)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Nenhuma regra de automação</h3>
            <p className="text-muted-foreground mb-4">
              Configure regras para enviar mensagens automaticamente baseadas em eventos
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Regra
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de criação */}
      <CreateRuleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={createRule}
        isLoading={isCreating}
        templates={templates}
      />
    </div>
  );
}

function CreateRuleDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading,
  templates
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateAutomationRuleData) => void
  isLoading: boolean
  templates: any[]
}) {
  const [formData, setFormData] = useState<CreateAutomationRuleData>({
    name: "",
    description: "",
    trigger_event: "",
    template_id: "",
    delay_minutes: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    
    // Reset form
    setFormData({
      name: "",
      description: "",
      trigger_event: "",
      template_id: "",
      delay_minutes: 0
    });
  };

  const triggerEvents = Object.entries(TRIGGER_EVENTS).map(([key, value]) => ({
    value,
    label: {
      "on_registration_success": "Cadastro realizado",
      "on_appointment_created": "Consulta agendada",
      "on_appointment_24h_before": "24h antes da consulta",
      "on_appointment_cancelled": "Consulta cancelada",
      "on_donation_received": "Doação recebida",
      "on_donation_failed": "Doação falhou",
      "on_campaign_completion": "Campanha finalizada",
      "on_campaign_milestone": "Meta da campanha atingida",
      "on_promoter_registered": "Promotor cadastrado",
      "on_event_completed": "Evento finalizado"
    }[key] || key
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Regra de Automação</DialogTitle>
          <DialogDescription>
            Configure uma regra para envio automático de mensagens
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Regra</Label>
            <Input
              id="name"
              placeholder="Ex: Boas-vindas após cadastro"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva quando esta regra será executada"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger_event">Evento Disparador</Label>
            <Select 
              value={formData.trigger_event} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, trigger_event: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o evento" />
              </SelectTrigger>
              <SelectContent>
                {triggerEvents.map((event) => (
                  <SelectItem key={event.value} value={event.value}>
                    {event.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template_id">Template</Label>
            <Select 
              value={formData.template_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, template_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.channel.toUpperCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delay_minutes">Delay (em minutos)</Label>
            <Select 
              value={formData.delay_minutes.toString()} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, delay_minutes: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Imediato</SelectItem>
                <SelectItem value="5">5 minutos</SelectItem>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="360">6 horas</SelectItem>
                <SelectItem value="720">12 horas</SelectItem>
                <SelectItem value="1440">1 dia</SelectItem>
                <SelectItem value="2880">2 dias</SelectItem>
                <SelectItem value="10080">1 semana</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Regra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}