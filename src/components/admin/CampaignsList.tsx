
import React from 'react'
import { useCampaigns } from '@/hooks/useCampaigns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { MoreHorizontal, Copy, Edit, Pause, Play, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

export const CampaignsList = () => {
  const { campaigns, isLoading, updateCampaign, deleteCampaign } = useCampaigns()

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/campanha/${slug}`
    navigator.clipboard.writeText(url)
    toast.success('Link da campanha copiado!')
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    await updateCampaign.mutateAsync({ id, status: newStatus })
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta campanha?')) {
      await deleteCampaign.mutateAsync(id)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      paused: 'secondary',
      ended: 'destructive'
    } as const

    const labels = {
      active: 'Ativa',
      paused: 'Pausada',
      ended: 'Encerrada'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const getProgressPercentage = (current: number, goal: number | null) => {
    if (!goal || goal === 0) return 0
    return Math.min((current / goal) * 100, 100)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            Carregando campanhas...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campanhas Criadas</CardTitle>
        <CardDescription>
          Gerencie suas campanhas de arrecadação
        </CardDescription>
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma campanha criada ainda
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="w-[70px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.description?.substring(0, 60)}
                          {campaign.description && campaign.description.length > 60 && '...'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {campaign.events ? (
                        <div className="text-sm">
                          <p className="font-medium">{campaign.events.city}</p>
                          <p className="text-muted-foreground">{campaign.events.location}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Geral</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {campaign.goal_amount ? (
                          <>
                            <div className="flex justify-between text-sm">
                              <span>R$ {campaign.current_amount.toFixed(2)}</span>
                              <span>R$ {campaign.goal_amount.toFixed(2)}</span>
                            </div>
                            <Progress 
                              value={getProgressPercentage(campaign.current_amount, campaign.goal_amount)} 
                              className="h-2"
                            />
                          </>
                        ) : (
                          <span className="text-sm font-medium">
                            R$ {campaign.current_amount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(campaign.status)}
                    </TableCell>
                    <TableCell>
                      {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleCopyLink(campaign.slug)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar Link
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => window.open(`/campanha/${campaign.slug}`, '_blank')}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Ver Página
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                          >
                            {campaign.status === 'active' ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Pausar
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(campaign.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
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
  )
}
