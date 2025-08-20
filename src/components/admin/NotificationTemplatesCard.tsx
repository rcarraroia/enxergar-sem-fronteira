
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Plus,
  Settings,
  Eye,
  Send,
  TestTube
} from 'lucide-react'
import { useNotificationTemplates } from '@/hooks/useNotificationTemplates'
import { useAdminMetrics } from '@/hooks/useAdminMetrics'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export const NotificationTemplatesCard = () => {
  const { templates } = useNotificationTemplates()
  const { data: metrics } = useAdminMetrics()
  const navigate = useNavigate()
  
  // Estados para o teste de envio
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [testData, setTestData] = useState({
    type: 'email' as 'email' | 'sms',
    destination: '',
    templateName: 'teste_manual'
  })
  const [isSending, setIsSending] = useState(false)

  const handleManageAll = () => {
    navigate('/admin/settings?tab=templates')
  }

  const handleCreateTemplate = () => {
    navigate('/admin/settings?tab=templates&action=create')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail
      case 'sms': return Phone
      case 'whatsapp': return MessageSquare
      default: return Mail
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'text-blue-600'
      case 'sms': return 'text-green-600'
      case 'whatsapp': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const handleSendTest = async () => {
    if (!testData.destination.trim()) {
      toast.error('Por favor, informe o destino da mensagem')
      return
    }

    setIsSending(true)

    try {
      let functionName = ''
      let payload: any = {}

      if (testData.type === 'email') {
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(testData.destination)) {
          toast.error('Por favor, informe um email válido')
          return
        }

        functionName = 'send-email'
        payload = {
          templateName: testData.templateName,
          templateData: {
            patient_name: 'Teste do Sistema',
            event_title: 'Teste de Envio de Email',
            event_date: new Date().toLocaleDateString('pt-BR'),
            event_time: '14:00',
            event_location: 'Local de Teste',
            event_address: 'Endereço de Teste, 123'
            // Usando o remetente solicitado através das configurações do template
          },
          recipientEmail: testData.destination,
          recipientName: 'Teste do Sistema',
          testMode: false
        }
      } else if (testData.type === 'sms') {
        // Validar telefone
        const phoneClean = testData.destination.replace(/\D/g, '')
        if (phoneClean.length < 10 || phoneClean.length > 13) {
          toast.error('Por favor, informe um telefone válido')
          return
        }

        functionName = 'send-sms'
        payload = {
          templateName: testData.templateName,
          templateData: {
            patient_name: 'Teste do Sistema',
            event_title: 'Teste de Envio de SMS',
            event_date: new Date().toLocaleDateString('pt-BR'),
            event_time: '14:00',
            event_location: 'Local de Teste',
            event_address: 'Endereço de Teste, 123',
            custom_message: `🧪 TESTE DO SISTEMA

Olá! Esta é uma mensagem de teste do sistema Enxergar sem Fronteiras.

📅 Data: ${new Date().toLocaleDateString('pt-BR')}
⏰ Horário: ${new Date().toLocaleTimeString('pt-BR')}

✅ Se você recebeu esta mensagem, o sistema está funcionando corretamente!

_Equipe Enxergar sem Fronteiras_ 👁️`
          },
          recipientPhone: testData.destination,
          recipientName: 'Teste do Sistema',
          testMode: false
        }
      }

      console.log(`🧪 Enviando ${testData.type} de teste para:`, testData.destination)

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      })

      if (error) {
        console.error(`❌ Erro ao enviar ${testData.type}:`, error)
        throw error
      }

      console.log(`✅ ${testData.type} de teste enviado com sucesso:`, data)
      toast.success(`${testData.type === 'email' ? 'Email' : 'SMS'} de teste enviado com sucesso!`)
      
      // Fechar dialog e limpar dados
      setIsTestDialogOpen(false)
      setTestData({
        type: 'email',
        destination: '',
        templateName: 'teste_manual'
      })

    } catch (error: any) {
      console.error(`❌ Erro ao enviar ${testData.type} de teste:`, error)
      toast.error(`Erro ao enviar ${testData.type}: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciar Notificações
          </div>
          <div className="flex gap-2">
            <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <TestTube className="h-4 w-4 mr-2" />
                  Enviar Teste
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Enviar Mensagem de Teste</DialogTitle>
                  <DialogDescription>
                    Envie uma mensagem de teste para verificar se o sistema de notificações está funcionando corretamente.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="test-type">Tipo de Mensagem</Label>
                    <Select 
                      value={testData.type} 
                      onValueChange={(value: 'email' | 'sms') => setTestData({ ...testData, type: value, destination: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="sms">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            SMS
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="test-destination">
                      {testData.type === 'email' ? 'Email de Destino' : 'Telefone de Destino'}
                    </Label>
                    <Input
                      id="test-destination"
                      value={testData.destination}
                      onChange={(e) => setTestData({ ...testData, destination: e.target.value })}
                      placeholder={
                        testData.type === 'email' 
                          ? 'exemplo@email.com' 
                          : '(11) 99999-9999'
                      }
                      type={testData.type === 'email' ? 'email' : 'tel'}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsTestDialogOpen(false)}
                    disabled={isSending}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSendTest}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Teste
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={handleManageAll}>
              <Eye className="h-4 w-4 mr-2" />
              Gerenciar Todos
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {templates?.filter(t => t.type === 'email').length || 0}
            </div>
            <div className="text-sm text-blue-700 font-medium">Templates Email</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {templates?.filter(t => t.type === 'sms').length || 0}
            </div>
            <div className="text-sm text-green-700 font-medium">Templates SMS</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {templates?.filter(t => t.type === 'whatsapp').length || 0}
            </div>
            <div className="text-sm text-purple-700 font-medium">Templates WhatsApp</div>
          </div>
        </div>

        {/* Templates recentes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Templates Recentes</h4>
            <Badge variant="outline" className="text-xs">
              {templates?.length || 0} total
            </Badge>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {templates?.slice(0, 5).map(template => {
              const Icon = getTypeIcon(template.type)
              const colorClass = getTypeColor(template.type)
              
              return (
                <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{template.name}</span>
                      <div className="text-xs text-gray-500 capitalize">{template.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={template.is_active ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {template.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              )
            })}
            
            {(!templates || templates.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Nenhum template encontrado</p>
                <p className="text-xs">Crie seu primeiro template de notificação</p>
              </div>
            )}
          </div>
        </div>

        {/* Ações principais */}
        <div className="flex gap-2 pt-2 border-t">
          <Button className="flex-1" onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>

        {/* Informações do sistema */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span>Sistema de Notificações</span>
            <Badge variant="outline" className="text-xs">Ativo</Badge>
          </div>
          <p>Utilize o botão "Enviar Teste" para verificar o funcionamento do sistema de emails e SMS.</p>
        </div>
      </CardContent>
    </Card>
  )
}
