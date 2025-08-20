/**
 * ADMIN V2 - GESTÃO DE PROMOTORES
 * Sistema completo para gerenciar promotores com cadastro direto
 */

import { useState } from 'react'
import { AdminLayout } from '@/components/admin-v2/shared/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Users,
  Plus,
  Search,
  FileDown,
  Phone,
  Mail,
  MapPin,
  Calendar,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Key,
  RefreshCw,
  MoreHorizontal,
  AlertCircle,
  Filter,
  Eye,
  EyeOff,
  Copy,
  CheckCircle
} from 'lucide-react'
import { 
  usePromotersV2,
  usePromoterStatsV2,
  useCreatePromoterV2,
  useUpdatePromoterV2,
  useUpdatePromoterStatusV2,
  useResetPromoterPasswordV2,
  useUpdateAsaasApiKeyV2,
  useDeletePromoterV2,
  generateSecurePassword,
  type PromoterV2,
  type PromoterCreation,
  type PromoterFilters
} from '@/hooks/admin-v2/usePromotersV2'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const AdminPromotersV2 = () => {
  const [filters, setFilters] = useState<PromoterFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const [isGenerating, setIsGenerating] = useState(false)

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)
  const [showAsaasDialog, setShowAsaasDialog] = useState(false)
  const [editingPromoter, setEditingPromoter] = useState<PromoterV2 | null>(null)
  const [generatedCredentials, setGeneratedCredentials] = useState<{email: string, password: string} | null>(null)
  const [asaasApiKey, setAsaasApiKey] = useState('')
  const [selectedPromoterId, setSelectedPromoterId] = useState('')

  // Form data
  const [formData, setFormData] = useState<PromoterCreation>({
    name: '',
    email: '',
    password: '',
    phone: ''
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    asaas_api_key: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  // Hooks
  const { data: promoters = [], isLoading, error } = usePromotersV2(filters)
  const { data: stats } = usePromoterStatsV2()
  const createPromoterMutation = useCreatePromoterV2()
  const updatePromoterMutation = useUpdatePromoterV2()
  const updateStatusMutation = useUpdatePromoterStatusV2()
  const resetPasswordMutation = useResetPromoterPasswordV2()
  const updateAsaasApiKeyMutation = useUpdateAsaasApiKeyV2()
  const deletePromoterMutation = useDeletePromoterV2()

  const handleSearch = () => {
    setFilters({
      search: searchTerm || undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined
    })
  }

  const handleCreatePromoter = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const result = await createPromoterMutation.mutateAsync(formData)
      setGeneratedCredentials(result.credentials)
      setShowCredentialsDialog(true)
      setShowCreateDialog(false)
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        city: '',
        state: ''
      })
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  const handleEditPromoter = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingPromoter || !editFormData.name.trim() || !editFormData.email.trim()) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      await updatePromoterMutation.mutateAsync({
        id: editingPromoter.id,
        data: {
          name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone,
          asaas_api_key: editFormData.asaas_api_key
        }
      })
      setShowEditDialog(false)
      setEditingPromoter(null)
      setEditFormData({
        name: '',
        email: '',
        phone: '',
        city: '',
        state: '',
        asaas_wallet_id: ''
      })
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  const handleStatusChange = async (id: string, status: 'active' | 'inactive') => {
    try {
      await updateStatusMutation.mutateAsync({ id, status })
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  const handleResetPassword = async (id: string) => {
    const newPassword = generateSecurePassword()
    try {
      await resetPasswordMutation.mutateAsync({ id, newPassword })
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  const handleUpdateAsaasApiKey = async () => {
    if (!asaasApiKey.trim()) {
      toast.error('Digite uma API Key válida')
      return
    }

    try {
      await updateAsaasApiKeyMutation.mutateAsync({
        id: selectedPromoterId,
        apiKey: asaasApiKey
      })
      setShowAsaasDialog(false)
      setAsaasApiKey('')
      setSelectedPromoterId('')
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  const handleDeletePromoter = async (id: string) => {
    try {
      await deletePromoterMutation.mutateAsync(id)
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  const generatePassword = () => {
    const password = generateSecurePassword()
    setFormData({ ...formData, password })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para a área de transferência!')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Ativo</Badge>
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Inativo</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pendente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const generatePDF = () => {
    if (promoters.length === 0) {
      toast.error('Nenhum promoter encontrado para gerar o relatório')
      return
    }

    setIsGenerating(true)
    
    try {
      const doc = new jsPDF()
      
      // Título do relatório
      doc.setFontSize(16)
      doc.text('RELATÓRIO DE PROMOTORES', 14, 20)
      
      // Informações do relatório
      doc.setFontSize(12)
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 30)
      doc.text(`Total de promotores: ${promoters.length}`, 14, 40)

      // Preparar dados para a tabela
      const tableData = promoters.map((promoter, index) => [
        index + 1,
        promoter.name || 'N/A',
        promoter.email || 'N/A',
        promoter.phone || 'N/A',
        promoter.status === 'active' ? 'Ativo' :
        promoter.status === 'inactive' ? 'Inativo' : 'Pendente',
        promoter.events_count || 0,
        format(new Date(promoter.created_at), 'dd/MM/yyyy', { locale: ptBR })
      ])

      // Gerar tabela
      autoTable(doc, {
        head: [['#', 'Nome', 'Email', 'Telefone', 'Cidade', 'Status', 'Eventos', 'Cadastrado em']],
        body: tableData,
        startY: 50,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      })

      // Salvar PDF
      const fileName = `promotores_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`
      doc.save(fileName)
      
      toast.success(`Relatório gerado com sucesso: ${fileName}`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar relatório PDF')
    } finally {
      setIsGenerating(false)
    }
  }



  return (
    <AdminLayout 
      title="Gestão de Promotores" 
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin-v2' },
        { label: 'Promotores', path: '/admin-v2/organizers' }
      ]}
    >
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar promotores. Verifique sua conexão e tente novamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Nome ou email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    // Aplicar filtro automaticamente
                    setFilters({
                      search: e.target.value || undefined,
                      status: selectedStatus !== 'all' ? selectedStatus : undefined
                    })
                  }}
                />
                <Button onClick={handleSearch} variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={(value) => {
                setSelectedStatus(value)
                setFilters({
                  search: searchTerm || undefined,
                  status: value !== 'all' ? value : undefined
                })
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Promoter
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Novo Promoter</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do promoter. O sistema criará automaticamente as credenciais de acesso.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePromoter} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome do promoter"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Senha *</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Senha do promoter"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button type="button" variant="outline" onClick={generatePassword}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>


                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateDialog(false)
                        setFormData({
                          name: '',
                          email: '',
                          password: '',
                          phone: '',
                          city: '',
                          state: ''
                        })
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createPromoterMutation.isPending} 
                      className="flex-1"
                    >
                      {createPromoterMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Promoter
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Button 
              onClick={generatePDF}
              disabled={isGenerating || promoters.length === 0}
              variant="outline"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Gerar PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>     
 {/* Dialog de Credenciais */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Promoter Criado com Sucesso!
            </DialogTitle>
            <DialogDescription>
              As credenciais de acesso foram geradas. Compartilhe essas informações com o promoter.
            </DialogDescription>
          </DialogHeader>
          {generatedCredentials && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3">Credenciais de Acesso:</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-800">Email:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-green-100 px-2 py-1 rounded text-sm">
                        {generatedCredentials.email}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(generatedCredentials.email)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-800">Senha:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-green-100 px-2 py-1 rounded text-sm">
                        {generatedCredentials.password}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(generatedCredentials.password)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Instruções para o Promoter:</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Acesse: <strong>enxergarsemfronteira.com.br/auth</strong></li>
                  <li>2. Use o email cadastrado</li>
                  <li>3. Clique em "Esqueci minha senha"</li>
                  <li>4. Defina uma nova senha pelo email</li>
                  <li>5. Faça login normalmente</li>
                </ol>
              </div>
              <Button 
                onClick={() => {
                  setShowCredentialsDialog(false)
                  setGeneratedCredentials(null)
                }}
                className="w-full"
              >
                Entendi
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Promoter</DialogTitle>
            <DialogDescription>
              Atualize os dados do promoter. Para alterar a senha, use a opção "Resetar Senha".
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditPromoter} className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Nome Completo *</Label>
              <Input
                id="edit_name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Nome do promoter"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_email">Email *</Label>
              <Input
                id="edit_email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_phone">Telefone</Label>
              <Input
                id="edit_phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="edit_asaas_api_key">API Key Asaas</Label>
              <div className="space-y-2">
                <Input
                  id="edit_asaas_api_key"
                  value={editFormData.asaas_api_key}
                  onChange={(e) => setEditFormData({ ...editFormData, asaas_api_key: e.target.value })}
                  placeholder="API Key do Asaas para pagamentos"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Para receber 25% de comissão nos pagamentos via split
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://www.asaas.com/r/51a27e42-08b8-495b-acfd-5f1369c2e104', '_blank')}
                  >
                    Criar Conta Asaas
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowEditDialog(false)
                  setEditingPromoter(null)
                  setEditFormData({
                    name: '',
                    email: '',
                    phone: '',
                    asaas_api_key: ''
                  })
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={updatePromoterMutation.isPending} 
                className="flex-1"
              >
                {updatePromoterMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats?.totalPromoters || 0}</div>
                <div className="text-sm text-muted-foreground">Total de Promotores</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats?.statusCounts?.active || 0}</div>
                <div className="text-sm text-muted-foreground">Ativos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{stats?.statusCounts?.inactive || 0}</div>
                <div className="text-sm text-muted-foreground">Inativos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{stats?.recentPromoters || 0}</div>
                <div className="text-sm text-muted-foreground">Últimos 30 dias</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Promotores */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Promotores ({promoters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : promoters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Nenhum promoter encontrado</h3>
              <p className="mb-4">Comece criando o primeiro promoter do sistema</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Promoter
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Promoter</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contato</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Localização</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Wallet Asaas</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Eventos</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {promoters.map((promoter) => (
                    <tr key={promoter.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{promoter.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Cadastrado em {format(new Date(promoter.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 mb-1">
                          <Mail className="h-3 w-3" />
                          <span className="text-sm">{promoter.email}</span>
                        </div>
                        {promoter.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="text-sm">{promoter.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(promoter.status)}
                      </td>
                      <td className="py-3 px-4">
                        {promoter.asaas_api_key ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            Configurada
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                            Não configurada
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">
                          {promoter.events_count || 0} evento(s)
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingPromoter(promoter)
                              setEditFormData({
                                name: promoter.name,
                                email: promoter.email,
                                phone: promoter.phone || '',
                                asaas_api_key: promoter.asaas_api_key || ''
                              })
                              setShowEditDialog(true)
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleResetPassword(promoter.id)}>
                              <Key className="h-4 w-4 mr-2" />
                              Resetar Senha
                            </DropdownMenuItem>

                            {promoter.status === 'active' ? (
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(promoter.id, 'inactive')}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Desativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(promoter.id, 'active')}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Ativar
                              </DropdownMenuItem>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {promoter.events_count && promoter.events_count > 0 ? (
                                      <>
                                        Não é possível excluir o promoter "{promoter.name}" pois ele possui {promoter.events_count} evento(s) associado(s).
                                        <br /><br />
                                        Para excluir este promoter, primeiro remova ou transfira todos os eventos associados a ele.
                                      </>
                                    ) : (
                                      <>
                                        Tem certeza que deseja excluir o promoter "{promoter.name}"? 
                                        Esta ação não pode ser desfeita e removerá também o acesso ao sistema.
                                      </>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  {(!promoter.events_count || promoter.events_count === 0) && (
                                    <AlertDialogAction 
                                      onClick={() => handleDeletePromoter(promoter.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Excluir Definitivamente
                                    </AlertDialogAction>
                                  )}
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export default AdminPromotersV2