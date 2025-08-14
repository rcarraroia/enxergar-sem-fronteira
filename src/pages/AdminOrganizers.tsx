import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Users, Plus, MoreHorizontal, Mail, UserCheck, UserX, RefreshCw, Key, Edit, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { useOrganizers } from '@/hooks/useOrganizers'
import { toast } from 'sonner'

const AdminOrganizers = () => {
  const { organizers, loading, createOrganizer, editOrganizer, deleteOrganizer, updateOrganizerStatus, updateOrganizerApiKey, resendInvitation } = useOrganizers()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [editingOrganizer, setEditingOrganizer] = useState<any>(null)
  const [selectedOrganizerApiKey, setSelectedOrganizerApiKey] = useState<{id: string, apiKey: string}>({id: '', apiKey: ''})
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setIsCreating(true)
    try {
      await createOrganizer({
        name: formData.name,
        email: formData.email,
        password: formData.password.trim() || undefined
      })
      setFormData({ name: '', email: '', password: '' })
      setShowCreateDialog(false)
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsCreating(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setIsEditing(true)
    try {
      await editOrganizer(editingOrganizer.id, {
        name: formData.name,
        email: formData.email,
        password: formData.password.trim() || undefined
      })
      setFormData({ name: '', email: '', password: '' })
      setShowEditDialog(false)
      setEditingOrganizer(null)
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsEditing(false)
    }
  }

  const handleEditOrganizer = (organizer: any) => {
    setEditingOrganizer(organizer)
    setFormData({ name: organizer.name, email: organizer.email, password: '' })
    setShowEditDialog(true)
  }

  const handleDeleteOrganizer = async (organizerId: string, organizerName: string, eventsCount?: number) => {
    if (eventsCount && eventsCount > 0) {
      toast.error(`Não é possível excluir "${organizerName}" pois possui ${eventsCount} evento(s) associado(s). Remova ou transfira os eventos primeiro.`)
      return
    }

    try {
      await deleteOrganizer(organizerId)
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Ativo</Badge>
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inativo</Badge>
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">Pendente</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getApiKeyBadge = (apiKey?: string | null) => {
    if (apiKey) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Configurada</Badge>
    }
    return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Não configurada</Badge>
  }

  const canOrganizerLogin = (organizerEmail: string) => {
    // Organizador pode fazer login se estiver na tabela com status ativo
    return true // Todos os organizadores na tabela podem fazer login
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Carregando organizadores...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gestão de Organizadores Locais</h1>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Organizador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Organizador</DialogTitle>
              <DialogDescription>
                Preencha os dados do organizador. Se definir uma senha, uma conta será criada automaticamente.
                O organizador poderá fazer login usando o email cadastrado.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do organizador"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O organizador poderá fazer login usando este email
                </p>
              </div>
              <div>
                <Label htmlFor="password">Senha (Opcional)</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Deixe em branco para enviar convite por email"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Se definir uma senha, uma conta será criada automaticamente. Caso contrário, um convite será enviado por email.
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateDialog(false)
                    setFormData({ name: '', email: '', password: '' })
                    setShowPassword(false)
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating} className="flex-1">
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Organizador
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Organizador</DialogTitle>
            <DialogDescription>
              Atualize os dados do organizador. Se definir uma senha, a conta será atualizada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Nome Completo</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do organizador"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_password">Nova Senha (Opcional)</Label>
              <div className="relative">
                <Input
                  id="edit_password"
                  type={showEditPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Deixe em branco para manter a senha atual"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                >
                  {showEditPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Se definir uma nova senha, a conta do organizador será atualizada.
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowEditDialog(false)
                  setFormData({ name: '', email: '', password: '' })
                  setShowEditPassword(false)
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isEditing} className="flex-1">
                {isEditing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar API Key do Asaas</DialogTitle>
            <DialogDescription>
              Configure a chave API do Asaas para este organizador (25% do split)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="api_key">API Key do Asaas</Label>
              <Input
                id="api_key"
                type="password"
                value={selectedOrganizerApiKey.apiKey}
                onChange={(e) => setSelectedOrganizerApiKey({
                  ...selectedOrganizerApiKey,
                  apiKey: e.target.value
                })}
                placeholder="Chave API do Asaas"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowApiKeyDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button onClick={async () => {
                if (!selectedOrganizerApiKey.apiKey.trim()) {
                  toast.error('Digite uma API Key válida')
                  return
                }

                try {
                  await updateOrganizerApiKey(selectedOrganizerApiKey.id, selectedOrganizerApiKey.apiKey)
                  setShowApiKeyDialog(false)
                  setSelectedOrganizerApiKey({id: '', apiKey: ''})
                } catch (error) {
                  // Erro já tratado no hook
                }
              }} className="flex-1">
                <Key className="h-4 w-4 mr-2" />
                Salvar API Key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Organizadores Cadastrados</CardTitle>
          <CardDescription>
            Gerencie os organizadores que podem criar e gerenciar eventos.
            Os organizadores podem fazer login usando o email cadastrado na página /auth.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {organizers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum organizador cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando o primeiro organizador do sistema
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Organizador
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Como os organizadores acessam o painel:</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. O organizador deve estar cadastrado na tabela com status "Ativo"</li>
                  <li>2. Fazer login na página /auth usando o email cadastrado</li>
                  <li>3. Será redirecionado automaticamente para /organizer</li>
                  <li>4. O sistema identifica automaticamente o papel baseado no cadastro</li>
                </ol>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Eventos</TableHead>
                    <TableHead>Acesso</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="w-[50px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizers.map((organizer) => (
                    <TableRow key={organizer.id}>
                      <TableCell className="font-medium">{organizer.name}</TableCell>
                      <TableCell>{organizer.email}</TableCell>
                      <TableCell>
                        {organizer.status === 'active' ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Ativo</Badge>
                        ) : organizer.status === 'inactive' ? (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inativo</Badge>
                        ) : (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {organizer.asaas_api_key ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Configurada</Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Não configurada</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {organizer.events_count || 0} evento(s)
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {organizer.status === 'active' ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Pode acessar
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                            Acesso bloqueado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(organizer.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingOrganizer(organizer)
                              setFormData({ name: organizer.name, email: organizer.email, password: '' })
                              setShowEditDialog(true)
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const org = organizers.find(o => o.id === organizer.id)
                              setSelectedOrganizerApiKey({
                                id: organizer.id,
                                apiKey: org?.asaas_api_key || ''
                              })
                              setShowApiKeyDialog(true)
                            }}>
                              <Key className="h-4 w-4 mr-2" />
                              Configurar API Key
                            </DropdownMenuItem>
                            {organizer.status === 'active' ? (
                              <DropdownMenuItem 
                                onClick={() => updateOrganizerStatus(organizer.id, 'inactive')}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Desativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => updateOrganizerStatus(organizer.id, 'active')}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Ativar
                              </DropdownMenuItem>
                            )}
                            {organizer.status === 'pending' && (
                              <DropdownMenuItem 
                                onClick={() => resendInvitation(organizer.id)}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Reenviar Convite
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
                                    {organizer.events_count && organizer.events_count > 0 ? (
                                      <>
                                        Não é possível excluir o organizador "{organizer.name}" pois ele possui {organizer.events_count} evento(s) associado(s).
                                        <br /><br />
                                        Para excluir este organizador, primeiro remova ou transfira todos os eventos associados a ele.
                                      </>
                                    ) : (
                                      <>
                                        Tem certeza que deseja excluir o organizador "{organizer.name}"? 
                                        Esta ação não pode ser desfeita.
                                      </>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  {(!organizer.events_count || organizer.events_count === 0) && (
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteOrganizer(organizer.id, organizer.name, organizer.events_count)}
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminOrganizers
