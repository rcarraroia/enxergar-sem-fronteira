/**
 * DIALOG PARA TESTES RÁPIDOS DE MENSAGENS
 * Interface simples para testar envios sem configurações complexas
 */

import { useState } from 'react'
import { Send, Mail, Smartphone, MessageSquare, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSendMessage } from '@/hooks/messages/useMessages'
import type { MessageChannel } from '@/types/messages'

interface QuickTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickTestDialog({ open, onOpenChange }: QuickTestDialogProps) {
  const [channel, setChannel] = useState<MessageChannel>('email')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')

  const { mutate: sendMessage, isPending } = useSendMessage()

  // Templates de teste rápido
  const quickTemplates = {
    email: {
      subject: 'Teste do Sistema de Mensagens',
      content: 'Esta é uma mensagem de teste do sistema Enxergar Sem Fronteiras.\n\nSe você recebeu esta mensagem, significa que o sistema de email está funcionando corretamente!\n\nData/Hora: ' + new Date().toLocaleString('pt-BR')
    },
    sms: {
      content: 'Teste SMS - Enxergar Sem Fronteiras. Sistema funcionando! ' + new Date().toLocaleTimeString('pt-BR')
    },
    whatsapp: {
      content: 'Teste WhatsApp - Enxergar Sem Fronteiras. Sistema funcionando! ' + new Date().toLocaleTimeString('pt-BR')
    }
  }

  const handleQuickTest = () => {
    if (!contact) return

    const template = quickTemplates[channel]
    
    sendMessage({
      channel,
      recipient_type: 'admin',
      recipient_contact: contact,
      subject: channel === 'email' ? template.subject : undefined,
      content: template.content,
      context: { test: true, timestamp: new Date().toISOString() }
    }, {
      onSuccess: () => {
        onOpenChange(false)
        setContact('')
        setMessage('')
      }
    })
  }

  const handleCustomTest = () => {
    if (!contact || !message) return

    sendMessage({
      channel,
      recipient_type: 'admin',
      recipient_contact: contact,
      subject: channel === 'email' ? 'Teste Personalizado' : undefined,
      content: message,
      context: { test: true, custom: true, timestamp: new Date().toISOString() }
    }, {
      onSuccess: () => {
        onOpenChange(false)
        setContact('')
        setMessage('')
      }
    })
  }

  const getPlaceholder = () => {
    switch (channel) {
      case 'email':
        return 'exemplo@email.com'
      case 'sms':
        return '(11) 99999-9999'
      case 'whatsapp':
        return '(11) 99999-9999'
      default:
        return ''
    }
  }

  const getContactLabel = () => {
    switch (channel) {
      case 'email':
        return 'Email de Destino'
      case 'sms':
      case 'whatsapp':
        return 'Telefone de Destino'
      default:
        return 'Contato'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Teste Rápido de Mensagens
          </DialogTitle>
          <DialogDescription>
            Envie mensagens de teste de forma rápida e simples
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção de Canal */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Canal de Teste</Label>
            <RadioGroup
              value={channel}
              onValueChange={(value) => setChannel(value as MessageChannel)}
              className="grid grid-cols-3 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="test-email" />
                <Label htmlFor="test-email" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4 text-blue-500" />
                  Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sms" id="test-sms" />
                <Label htmlFor="test-sms" className="flex items-center gap-2 cursor-pointer">
                  <Smartphone className="h-4 w-4 text-green-500" />
                  SMS
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="whatsapp" id="test-whatsapp" />
                <Label htmlFor="test-whatsapp" className="flex items-center gap-2 cursor-pointer">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  WhatsApp
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Campo de Contato */}
          <div className="space-y-2">
            <Label htmlFor="test-contact">{getContactLabel()}</Label>
            <Input
              id="test-contact"
              type={channel === 'email' ? 'email' : 'tel'}
              placeholder={getPlaceholder()}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </div>

          {/* Opções de Teste */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Teste Rápido */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Teste Rápido
                </CardTitle>
                <CardDescription>
                  Envia uma mensagem padrão de teste
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">
                    Mensagem Automática
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {channel === 'email' && 'Assunto: "Teste do Sistema de Mensagens"'}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {quickTemplates[channel].content.substring(0, 80)}...
                  </p>
                  <Button
                    onClick={handleQuickTest}
                    disabled={!contact || isPending}
                    className="w-full mt-3"
                    size="sm"
                  >
                    {isPending ? 'Enviando...' : 'Enviar Teste Rápido'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Teste Personalizado */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-4 w-4 text-blue-500" />
                  Teste Personalizado
                </CardTitle>
                <CardDescription>
                  Escreva sua própria mensagem de teste
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Digite sua mensagem de teste aqui..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                  <Button
                    onClick={handleCustomTest}
                    disabled={!contact || !message || isPending}
                    className="w-full"
                    size="sm"
                    variant="outline"
                  >
                    {isPending ? 'Enviando...' : 'Enviar Personalizado'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações de Configuração */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="text-sm space-y-2">
                <p className="font-medium">Status da Configuração:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span>Email:</span>
                    <Badge variant={import.meta.env.VITE_RESEND_API_KEY ? 'default' : 'secondary'}>
                      {import.meta.env.VITE_RESEND_API_KEY ? 'Configurado' : 'Simulação'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-green-500" />
                    <span>SMS:</span>
                    <Badge variant={import.meta.env.VITE_VONAGE_API_KEY ? 'default' : 'secondary'}>
                      {import.meta.env.VITE_VONAGE_API_KEY ? 'Configurado' : 'Simulação'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span>WhatsApp:</span>
                    <Badge variant="secondary">
                      Em Desenvolvimento
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}