
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar, Settings, Activity, TestTube, Bug } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LazyWrapper, LazySystemHealthCard } from '@/components/LazyComponents'
import { PerformanceMonitor } from '@/components/admin/PerformanceMonitor'
import { SystemDebugCard } from '@/components/admin/SystemDebugCard'
import { runAutomatedTests } from '@/utils/testUtils'
import { useOptimizedCache } from '@/hooks/useOptimizedCache'
import { useErrorBoundary } from '@/hooks/useErrorBoundary'
import { toast } from 'sonner'

const Admin = () => {
  const { user } = useAuth()
  const { prefetchCriticalData } = useOptimizedCache()
  const { errors, clearErrors } = useErrorBoundary('AdminPage')

  const handleRunTests = () => {
    toast.info('Executando testes automatizados...')
    const results = runAutomatedTests()
    const passedTests = results.filter(r => r.passed).length
    
    if (passedTests === results.length) {
      toast.success(`✅ Todos os ${results.length} testes passaram!`)
    } else {
      toast.error(`❌ ${results.length - passedTests} testes falharam`)
    }
  }

  const handleOptimizeCache = async () => {
    toast.info('Otimizando cache...')
    try {
      await prefetchCriticalData()
      toast.success('Cache otimizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao otimizar cache')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Painel Administrativo
        </h1>
        <p className="text-gray-600">
          Bem-vindo, {user?.email}
        </p>
        {errors.length > 0 && (
          <div className="mt-2">
            <Badge variant="destructive" className="mr-2">
              {errors.length} erro(s) detectado(s)
            </Badge>
            <Button onClick={clearErrors} variant="outline" size="sm">
              Limpar erros
            </Button>
          </div>
        )}
      </div>

      {/* Ferramentas de Debug e Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SystemDebugCard />
        <PerformanceMonitor />
      </div>

      {/* Ferramentas de Testes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Testes Automatizados
            </CardTitle>
            <CardDescription>
              Execute testes de validação e performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleRunTests} className="w-full">
              Executar Testes
            </Button>
            <Button onClick={handleOptimizeCache} variant="outline" className="w-full">
              Otimizar Cache
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
            <CardDescription>
              Monitoramento em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Aplicação</span>
                <Badge variant="default">Online</Badge>
              </div>
              <div className="flex justify-between">
                <span>Banco de Dados</span>
                <Badge variant="default">Conectado</Badge>
              </div>
              <div className="flex justify-between">
                <span>Cache</span>
                <Badge variant="secondary">Otimizado</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link to="/admin/events">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Eventos
              </CardTitle>
              <CardDescription>
                Gerenciar eventos e datas
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/admin/patients">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pacientes
              </CardTitle>
              <CardDescription>
                Visualizar dados dos pacientes
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/admin/settings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações
              </CardTitle>
              <CardDescription>
                Configurações do sistema
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Monitor de Sistema */}
      <LazyWrapper height="h-64">
        <LazySystemHealthCard />
      </LazyWrapper>
    </div>
  )
}

export default Admin
