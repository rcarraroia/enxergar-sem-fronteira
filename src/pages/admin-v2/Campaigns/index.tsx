/**
 * ADMIN V2 - GESTÃO DE CAMPANHAS DE DOAÇÕES
 * Módulo central para captação de recursos com regras de split
 */

import { useState } from 'react'
import { AdminLayout } from '@/components/admin-v2/shared/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Heart,
  Plus,
  Search,
  FileDown,
  Target,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Mail,
  MessageSquare,
  Edit,
  Trash2,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Clock,
  PieChart
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  useCampaignsV2,
  useCampaignStatsV2,
  useCreateCampaignV2,
  useUpdateCampaignV2,
  useDeleteCampaignV2,
  type CampaignV2 as Campaign
} from '@/hooks/admin-v2/useCampaignsV2'

// Interfaces importadas do hook

interface CampaignFilters {
  search?: string
  status?: string
  donation_type?: string
}

const AdminCampaignsV2 = () => {
  // Estados para filtros e busca
  const [filters, setFilters] = useState<CampaignFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  // Estados para modais e formulários
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)

  // Estados para formulário de criação
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_amount: '',
    start_date: '',
    end_date: '',
    donation_type: 'both',
    suggested_amounts: '25,50,100,250,500',
    allow_custom_amount: true
  })

  // Estados para formulário de edição
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    goal_amount: '',
    start_date: '',
    end_date: '',
    donation_type: 'both',
    suggested_amounts: '',
    allow_custom_amount: true
  })

  // Hooks para campanhas
  const { data: campaigns = [], isLoading, error } = useCampaignsV2(filters)
  const { data: stats } = useCampaignStatsV2()
  const createCampaignMutation = useCreateCampaignV2()
  const updateCampaignMutation = useUpdateCampaignV2()
  const deleteCampaignMutation = useDeleteCampaignV2()

  // Funções para manipular dados
  const handleSearch = () => {
    setFilters({
      search: searchTerm || undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      donation_type: selectedType !== 'all' ? selectedType : undefined
    })
  }

  const handleCreateCampaign = async () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.goal_amount) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      await createCampaignMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        goal_amount: parseFloat(formData.goal_amount),
        start_date: formData.start_date,
        end_date: formData.end_date,
        donation_type: formData.donation_type as any,
        suggested_amounts: formData.suggested_amounts.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v)),
        allow_custom_amount: formData.allow_custom_amount
      })

      setShowCreateDialog(false)
      setFormData({
        title: '',
        description: '',
        goal_amount: '',
        start_date: '',
        end_date: '',
        donation_type: 'both',
        suggested_amounts: '25,50,100,250,500',
        allow_custom_amount: true
      })
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  // Funções auxiliares
  const getStatusBadge = (status: Campaign['status']) => {
    const statusConfig = {
      active: { label: 'Ativa', className: 'bg-green-100 text-green-800 hover:bg-green-200' },
      inactive: { label: 'Inativa', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
      completed: { label: 'Concluída', className: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
      draft: { label: 'Rascunho', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' }
    }

    const config = statusConfig[status]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  return (
    <AdminLayout 
      title="Gestão de Campanhas" 
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin-v2' },
        { label: 'Campanhas', path: '/admin-v2/campaigns' }
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Campanhas</h1>
            <p className="text-muted-foreground">
              Gerencie campanhas de doação com regras de split automático
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Campanhas</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_campaigns || 0}</div>
              <p className="text-xs text-muted-foreground">
                Campanhas criadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_campaigns || 0}</div>
              <p className="text-xs text-muted-foreground">
                Arrecadando recursos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Arrecadado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.total_raised || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Valor total arrecadado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doadores Únicos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_donors || 0}</div>
              <p className="text-xs text-muted-foreground">
                Pessoas que doaram
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros de Busca */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Nome da campanha..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    // Aplicar filtro automaticamente
                    setFilters({
                      search: e.target.value || undefined,
                      status: selectedStatus !== 'all' ? selectedStatus : undefined,
                      donation_type: selectedType !== 'all' ? selectedType : undefined
                    })
                  }}
                />
              </div>

              <div className="w-full md:w-48">
                <Label htmlFor="status">Status</Label>
                <Select value={selectedStatus} onValueChange={(value) => {
                  setSelectedStatus(value)
                  setFilters({
                    search: searchTerm || undefined,
                    status: value !== 'all' ? value : undefined,
                    donation_type: selectedType !== 'all' ? selectedType : undefined
                  })
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="inactive">Inativas</SelectItem>
                    <SelectItem value="completed">Concluídas</SelectItem>
                    <SelectItem value="draft">Rascunhos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-48">
                <Label htmlFor="type">Tipo de Doação</Label>
                <Select value={selectedType} onValueChange={(value) => {
                  setSelectedType(value)
                  setFilters({
                    search: searchTerm || undefined,
                    status: selectedStatus !== 'all' ? selectedStatus : undefined,
                    donation_type: value !== 'all' ? value : undefined
                  })
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="one_time">Pontual</SelectItem>
                    <SelectItem value="recurring">Recorrente</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline">
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Campanhas */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Campanhas ({campaigns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Erro ao carregar campanhas. Tente recarregar a página.
                </AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Nenhuma campanha encontrada</h3>
                <p className="mb-4">Comece criando a primeira campanha de doação</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Campanha
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{campaign.title}</h3>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <p className="text-muted-foreground mb-3">{campaign.description}</p>

                        {/* Barra de Progresso */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progresso da Meta</span>
                            <span>{getProgressPercentage(campaign.raised_amount, campaign.goal_amount).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${getProgressPercentage(campaign.raised_amount, campaign.goal_amount)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm mt-1 text-muted-foreground">
                            <span>Arrecadado: {formatCurrency(campaign.raised_amount)}</span>
                            <span>Meta: {formatCurrency(campaign.goal_amount)}</span>
                          </div>
                        </div>

                        {/* Informações Adicionais */}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(campaign.start_date), 'dd/MM/yyyy', { locale: ptBR })} - {' '}
                              {format(new Date(campaign.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            <span>
                              {campaign.donation_type === 'one_time' ? 'Pontual' :
                                campaign.donation_type === 'recurring' ? 'Recorrente' : 'Ambos'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu de Ações */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingCampaign(campaign)
                            setEditFormData({
                              title: campaign.title,
                              description: campaign.description,
                              goal_amount: campaign.goal_amount.toString(),
                              start_date: campaign.start_date,
                              end_date: campaign.end_date,
                              donation_type: campaign.donation_type,
                              suggested_amounts: campaign.suggested_amounts.join(','),
                              allow_custom_amount: campaign.allow_custom_amount
                            })
                            setShowEditDialog(true)
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>

                          <DropdownMenuItem>
                            <PieChart className="h-4 w-4 mr-2" />
                            Relatório de Split
                          </DropdownMenuItem>

                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Comunicação
                          </DropdownMenuItem>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a campanha "{campaign.title}"?
                                  <br /><br />
                                  <strong>Atenção:</strong> Esta ação não pode ser desfeita e removerá
                                  todos os dados relacionados à campanha.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => {
                                    // TODO: Implementar exclusão
                                    console.log('Excluir campanha:', campaign.id)
                                  }}
                                >
                                  Excluir Campanha
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Criação de Campanha */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Campanha de Doação</DialogTitle>
              <DialogDescription>
                Crie uma nova campanha com regras de split automático
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título da Campanha *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Campanha de Natal 2024"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o objetivo da campanha..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goal_amount">Meta de Arrecadação (R$) *</Label>
                  <Input
                    id="goal_amount"
                    type="number"
                    value={formData.goal_amount}
                    onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                    placeholder="50000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="donation_type">Tipo de Doação *</Label>
                  <Select
                    value={formData.donation_type}
                    onValueChange={(value) => setFormData({ ...formData, donation_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">Apenas Pontual</SelectItem>
                      <SelectItem value="recurring">Apenas Recorrente</SelectItem>
                      <SelectItem value="both">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Data de Início *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">Data de Fim *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="suggested_amounts">Valores Sugeridos (separados por vírgula)</Label>
                <Input
                  id="suggested_amounts"
                  value={formData.suggested_amounts}
                  onChange={(e) => setFormData({ ...formData, suggested_amounts: e.target.value })}
                  placeholder="25,50,100,250,500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Valores em reais que aparecerão como opções rápidas
                </p>
              </div>

              {/* Informações sobre Split */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Regras de Split Automático:</strong>
                  <br />• Doações pontuais e 1ª recorrente: 25% para cada entidade (ONG, Projeto, Renum, Promotor)
                  <br />• Doações recorrentes subsequentes: 75% Renum + 25% Projeto Visão Itinerante
                  <br />• Promotor sem API Key: 25% redirecionado para ONG Coração Valente
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setFormData({
                    title: '',
                    description: '',
                    goal_amount: '',
                    start_date: '',
                    end_date: '',
                    donation_type: 'both',
                    suggested_amounts: '25,50,100,250,500',
                    allow_custom_amount: true
                  })
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCampaign}
                disabled={createCampaignMutation.isPending}
              >
                {createCampaignMutation.isPending ? 'Criando...' : 'Criar Campanha'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}

export default AdminCampaignsV2