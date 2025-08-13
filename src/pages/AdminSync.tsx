
import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LogOut, Settings, RefreshCw, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const AdminSync = () => {
  const { user, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

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
              <Button 
                variant="ghost" 
                onClick={() => navigate('/admin')}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Sincronização</h1>
                <p className="text-sm text-muted-foreground">Monitoramento da fila de integração</p>
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
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status da Sincronização</CardTitle>
              <CardDescription>
                Monitoramento em tempo real da fila de integração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800">Sistema Online</p>
                    <p className="text-sm text-green-600">Todas as integrações funcionando</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Ativo</Badge>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Processando</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Concluídos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default AdminSync
