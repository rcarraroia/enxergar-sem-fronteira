
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Users, Plus, MoreHorizontal, Mail, UserCheck, UserX, RefreshCw, Key, ExternalLink } from 'lucide-react'
import { useOrganizers } from '@/hooks/useOrganizers'
import { toast } from 'sonner'

const AdminOrganizers = () => {
  const { organizers, loading, createOrganizer, updateOrganizerStatus, updateOrganizerApiKey, resendInvitation } = useOrganizers()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [selectedOrganizerApiKey, setSelectedOrganizerApiKey] = useState<{id: string, apiKey: string}>({id: '', apiKey: ''})
  const [formData, setFormData] = useState({ name: '', email: '', asaas_api_key: '' })
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setIsCreating(true)
    try {
      await createOrganizer(formData)
      setFormData({ name: '', email: '', asaas_api_key: '' })
      setShowCreateDialog(false)
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateApiKey = async () => {
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
  }

  const openEditApiKeyDialog = (organizerId: string) => {
    const organizer = organizers.find(o => o.id === organizerId)
    setSelectedOrganizerApiKey({
      id: organizerId,
      apiKey: organizer?.asaas_api_key || ''
    })
    setShowApiKeyDialog(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pendente</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getApiKeyBadge = (apiKey?: string | null) => {
    if (apiKey) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Configurada</Badge>
    }
    return <Badge variant="destructive">Não configurada</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                Preencha os dados do organizador. Um convite será enviado por email.
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
              </div>
              <div>
                <Label htmlFor="asaas_api_key">API Key do Asaas (Organizador - 25%)</Label>
                <Input
                  id="asaas_api_key"
                  type="password"
                  value={formData.asaas_api_key}
                  onChange={(e) => setFormData({ ...formData, asaas_api_key: e.target.value })}
                  placeholder="Chave API do Asaas do organizador"
                />
                <div className="flex items-center gap-2 mt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://www.asaas.com/r/51a27e42-08b8-495b-acfd-5f1369c2e104', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Criar conta no Asaas
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Caso o organizador ainda não tenha conta
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
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
                      <Mail className="h-4 w-4 mr-2" />
                      Criar e Enviar Convite
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
                <Button onClick={handleUpdateApiKey} className="flex-1">
                  <Key className="h-4 w-4 mr-2" />
                  Salvar API Key
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organizadores Cadastrados</CardTitle>
          <CardDescription>
            Gerencie os organizadores que podem criar e gerenciar eventos
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>API Key Configurada</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="w-[50px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizers.map((organizer) => (
                  <TableRow key={organizer.id}>
                    <TableCell className="font-medium">{organizer.name}</TableCell>
                    <TableCell>{organizer.email}</TableCell>
                    <TableCell>{getStatusBadge(organizer.status)}</TableCell>
                    <TableCell>{getApiKeyBadge(organizer.asaas_api_key)}</TableCell>
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
                          <DropdownMenuItem onClick={() => openEditApiKeyDialog(organizer.id)}>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminOrganizers
