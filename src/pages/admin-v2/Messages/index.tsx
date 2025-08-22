/**
 * ADMIN V2 - MÓDULO DE MENSAGENS
 * Dashboard principal do módulo de mensagens
 */

import { useState } from 'react'
import { AdminLayout } from '@/components/admin-v2/shared/Layout'
import { Send, MessageSquare, Mail, Smartphone, BarChart3, Settings, Clock, Zap, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useMessages, useMessageStats, useMessageTemplates, useAutomationRules } from '@/hooks/messages/useMessages'
import { MessagesList } from './components/MessagesList'
import { SendMessageDialog } from './components/SendMessageDialog'
// BulkMessageDialog temporariamente removido devido a erro de dados
import { QuickTestDialog } from './components/QuickTestDialog'
import { TemplatesManager } from './components/TemplatesManager'
import { AutomationManager } from './components/AutomationManager'
import { MessageStats } from './components/MessageStats'

export default function MessagesPage() {
    const [activeTab, setActiveTab] = useState('overview')
    const [sendDialogOpen, setSendDialogOpen] = useState(false)
    // const [bulkDialogOpen, setBulkDialogOpen] = useState(false) // Removido temporariamente
    const [quickTestOpen, setQuickTestOpen] = useState(false)

    // Hooks para dados
    const { data: messages = [], isLoading: messagesLoading } = useMessages()
    const { data: stats } = useMessageStats()
    const { data: templates = [] } = useMessageTemplates()
    const { data: automationRules = [] } = useAutomationRules()

    // Estatísticas rápidas
    const recentMessages = messages.slice(0, 5)
    const pendingMessages = messages.filter(m => m.status === 'pending').length
    const activeTemplates = templates.filter(t => t.is_active).length
    const activeRules = automationRules.filter(r => r.is_active).length

    return (
        <AdminLayout 
            title="Mensagens" 
            breadcrumbs={[
                { label: 'Dashboard', path: '/admin' },
                { label: 'Mensagens', path: '/admin/messages' }
            ]}
            actions={
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickTestOpen(true)}
                        className="w-full sm:w-auto"
                    >
                        <Zap className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Teste Rápido</span>
                        <span className="sm:hidden">Teste</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('templates')}
                        className="w-full sm:w-auto"
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Configurar</span>
                        <span className="sm:hidden">Config</span>
                    </Button>
                    {/* Botão temporariamente removido
                    <Button
                        variant="outline"
                        onClick={() => setBulkDialogOpen(true)}
                        size="sm"
                        className="w-full sm:w-auto"
                    >
                        <Users className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Envio em Massa</span>
                        <span className="sm:hidden">Massa</span>
                    </Button>
                    */}
                    <Button
                        onClick={() => setSendDialogOpen(true)}
                        size="sm"
                        className="w-full sm:w-auto"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Enviar Individual</span>
                        <span className="sm:hidden">Individual</span>
                    </Button>
                </div>
            }
        >
        <div className="space-y-6">


            {/* Cards de estatísticas rápidas */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mensagens Hoje</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_sent || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {pendingMessages > 0 && `${pendingMessages} pendentes`}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.delivery_rate ? `${stats.delivery_rate.toFixed(1)}%` : '0%'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.total_delivered || 0} entregues
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Templates Ativos</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeTemplates}</div>
                        <p className="text-xs text-muted-foreground">
                            {templates.length} total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Automações</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeRules}</div>
                        <p className="text-xs text-muted-foreground">
                            regras ativas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs principais */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="messages">Mensagens</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="automation">Automação</TabsTrigger>
                    <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                        {/* Mensagens recentes */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Mensagens Recentes</CardTitle>
                                <CardDescription>
                                    Últimas 5 mensagens enviadas
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {messagesLoading ? (
                                    <div className="space-y-2">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                                        ))}
                                    </div>
                                ) : recentMessages.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentMessages.map((message) => (
                                            <div key={message.id} className="flex items-center justify-between p-2 border rounded">
                                                <div className="flex items-center gap-3">
                                                    {message.channel === 'email' ? (
                                                        <Mail className="h-4 w-4 text-blue-500" />
                                                    ) : (
                                                        <Smartphone className="h-4 w-4 text-green-500" />
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium">{message.recipient_contact}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                            {message.subject || message.content}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant={
                                                    message.status === 'delivered' ? 'default' :
                                                        message.status === 'sent' ? 'secondary' :
                                                            message.status === 'failed' ? 'destructive' : 'outline'
                                                }>
                                                    {message.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-muted-foreground">
                                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>Nenhuma mensagem enviada ainda</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Templates populares */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Templates Populares</CardTitle>
                                <CardDescription>
                                    Templates mais utilizados
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {templates.length > 0 ? (
                                    <div className="space-y-3">
                                        {templates.slice(0, 5).map((template) => (
                                            <div key={template.id} className="flex items-center justify-between p-2 border rounded">
                                                <div className="flex items-center gap-3">
                                                    {template.channel === 'email' ? (
                                                        <Mail className="h-4 w-4 text-blue-500" />
                                                    ) : (
                                                        <Smartphone className="h-4 w-4 text-green-500" />
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium">{template.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {template.channel.toUpperCase()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline">
                                                    {template.variables.length} vars
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-muted-foreground">
                                        <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>Nenhum template criado ainda</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2"
                                            onClick={() => setActiveTab('templates')}
                                        >
                                            Criar Template
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="messages">
                    <MessagesList />
                </TabsContent>

                <TabsContent value="templates">
                    <TemplatesManager />
                </TabsContent>

                <TabsContent value="automation">
                    <AutomationManager />
                </TabsContent>

                <TabsContent value="stats">
                    <MessageStats />
                </TabsContent>
            </Tabs>

            {/* Dialog para enviar mensagem individual */}
            <SendMessageDialog
                open={sendDialogOpen}
                onOpenChange={setSendDialogOpen}
            />

            {/* Dialog para envio em massa - Temporariamente removido
            <BulkMessageDialog
                open={bulkDialogOpen}
                onOpenChange={setBulkDialogOpen}
            />
            */}

            {/* Dialog para teste rápido */}
            <QuickTestDialog
                open={quickTestOpen}
                onOpenChange={setQuickTestOpen}
            />
        </div>
        </AdminLayout>
    )
}