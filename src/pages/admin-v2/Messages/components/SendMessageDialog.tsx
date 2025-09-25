/**
 * DIALOG PARA ENVIO DE MENSAGENS
 */

import { useState } from "react";
import { Mail, MessageSquare, Send, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMessageTemplates, useSendMessage } from "@/hooks/messages/useMessages";
import type { MessageChannel, RecipientType } from "@/types/messages";

interface SendMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendMessageDialog({ open, onOpenChange }: SendMessageDialogProps) {
  const [channel, setChannel] = useState<MessageChannel>("email");
  const [recipientType, setRecipientType] = useState<RecipientType>("patient");
  const [recipientContact, setRecipientContact] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [templateId, setTemplateId] = useState<string>("none");

  const { mutate: sendMessage, isPending } = useSendMessage();
  const { data: templates = [] } = useMessageTemplates();

  // Filtrar templates por canal
  const channelTemplates = templates.filter(t => t.channel === channel);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientContact || !content) {return;}

    sendMessage({
      channel,
      recipient_type: recipientType,
      recipient_contact: recipientContact,
      subject: channel === "email" ? subject : undefined,
      content,
      template_id: templateId !== "none" ? templateId : undefined
    }, {
      onSuccess: () => {
        onOpenChange(false);
        // Reset form
        setRecipientContact("");
        setSubject("");
        setContent("");
        setTemplateId("none");
      }
    });
  };

  const handleTemplateChange = (value: string) => {
    if (value === "none") {
      setTemplateId("");
      setContent("");
      setSubject("");
    } else {
      setTemplateId(value);
      const template = templates.find(t => t.id === value);
      if (template) {
        setContent(template.content);
        if (template.subject) {
          setSubject(template.subject);
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Enviar Mensagem</DialogTitle>
          <DialogDescription>
            Envie uma mensagem individual para um destinatário
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Canal */}
          <div className="space-y-2">
            <Label>Canal de Envio</Label>
            <RadioGroup
              value={channel}
              onValueChange={(value) => setChannel(value as MessageChannel)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sms" id="sms" />
                <Label htmlFor="sms" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  SMS
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="whatsapp" id="whatsapp" />
                <Label htmlFor="whatsapp" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Tipo de destinatário */}
          <div className="space-y-2">
            <Label htmlFor="recipient-type">Tipo de Destinatário</Label>
            <Select value={recipientType} onValueChange={(value) => setRecipientType(value as RecipientType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">Paciente</SelectItem>
                <SelectItem value="promoter">Promotor</SelectItem>
                <SelectItem value="donor">Doador</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contato do destinatário */}
          <div className="space-y-2">
            <Label htmlFor="recipient-contact">
              {channel === "email" ? "Email" : "Telefone"} do Destinatário
            </Label>
            <Input
              id="recipient-contact"
              type={channel === "email" ? "email" : "tel"}
              placeholder={channel === "email" ? "exemplo@email.com" : "(11) 99999-9999"}
              value={recipientContact}
              onChange={(e) => setRecipientContact(e.target.value)}
              required
            />
          </div>

          {/* Template (opcional) */}
          {channelTemplates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="template">Template (Opcional)</Label>
              <Select value={templateId} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum template</SelectItem>
                  {channelTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assunto (apenas para email) */}
          {channel === "email" && (
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                placeholder="Assunto da mensagem"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo da Mensagem</Label>
            <Textarea
              id="content"
              placeholder="Digite sua mensagem aqui..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
            />
            {channel === "sms" && (
              <p className="text-xs text-muted-foreground">
                {content.length}/160 caracteres
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>Enviando...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}