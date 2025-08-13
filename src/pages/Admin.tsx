
import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LogOut, Settings, Users, Calendar, BarChart3 } from 'lucide-react'

const Admin = () => {
  const { user, signOut, isAdmin } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Painel Administrativo</h1>
                <p className="text-sm text-muted-foreground">Enxergar sem Fronteiras</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium">{user?.email}</p>
                {isAdmin && <Badge variant="secondary" className="text-xs">Admin</Badge>}
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dashboard Cards */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Gerenciar Eventos
              </CardTitle>
              <CardDescription>
                Criar, editar e monitorar eventos oftalmológicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Acessar Eventos
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Pacientes
              </CardTitle>
              <CardDescription>
                Visualizar cadastros e sincronização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Ver Pacientes
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Relatórios
              </CardTitle>
              <CardDescription>
                Estatísticas e monitoramento da sincronização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Ver Relatórios
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status da Sincronização */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Status da Sincronização - Instituto Coração Valente</CardTitle>
              <CardDescription>
                Monitoramento da fila de integração em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Em desenvolvimento...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Funcionalidade será implementada na próxima fase
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default Admin
