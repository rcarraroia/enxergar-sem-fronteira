/**
 * COMPONENTE DE LISTAGEM DE MENSAGENS
 */

import { useState } from 'react'
import { Search, Filter, Mail, Smartphone, MessageSquare, Eye, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useMessages } from '@/hooks/messages/useMessages'
import type { MessageFilters, MessageChannel, MessageStatus } from '@/types/messages'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function MessagesList() {
  const [filters, setFilters] = useState<MessageFilters>({})
  const [search, setSearch] = useState('')

  const { data: messages = [], isLoading } = useMessages(filters)

  // Filtrar mensagens por busca
  const filteredMessages = messages.filter(message => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      message.recipient_contact.toLowerCase().includes(searchLower) ||
      message.content.toLowerCase().includes(searchLower) ||
      (message.subject && message.subject.toLowerCase().includes(searchLower))
    )
  })

  const getChannelIcon = (channel: MessageChannel) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-500" />
      case 'sms':
        return <Smartphone className="h-4 w-4 text-green-500" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-green-600" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: MessageStatus) => {
    const variants = {
      pending: 'outline',
      sent: 'secondary',
      delivered: 'default',
      failed: 'destructive',
      read: 'default'
    } as const

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ptBR
    })
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por destinatário, assunto ou conteúdo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select
              value={filters.channel || 'all'}
              onValueChange={(value) => 
                setFilters(prev => ({ 
                  ...prev, 
                  channel: value === 'all' ? undefined : value as MessageChannel 
                }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => 
                setFilters(prev => ({ 
                  ...prev, 
                  status: value === 'all' ? undefined : value as MessageStatus 
                }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de mensagens */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Mensagens ({filteredMessages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredMessages.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Assunto/Conteúdo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enviado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getChannelIcon(message.channel)}
                          <span className="text-sm capitalize">
                            {message.channel}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {message.recipient_contact}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {message.recipient_type}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="max-w-[300px]">
                          {message.subject && (
                            <p className="font-medium text-sm truncate">
                              {message.subject}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground truncate">
                            {message.content}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(message.status)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {message.sent_at ? (
                            <span>{formatDate(message.sent_at)}</span>
                          ) : message.scheduled_for ? (
                            <span className="text-orange-600">
                              Agendado para {formatDate(message.scheduled_for)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {formatDate(message.created_at)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma mensagem encontrada</p>
              <p className="text-sm">
                {search || filters.channel || filters.status 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece enviando sua primeira mensagem'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}