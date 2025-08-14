
import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LogOut, ArrowLeft, Heart, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { DonationForm } from '@/components/admin/DonationForm'

const AdminDonations = () => {
  const { user, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['asaas-donations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asaas_transactions')
        .select(`
          *,
          events:event_id (
            title
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    }
  })

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const stats = {
    total: donations.length,
    pending: donations.filter(t => t.payment_status === 'pending').length,
    received: donations.filter(t => t.payment_status === 'paid').length,
    failed: donations.filter(t => t.payment_status === 'failed').length,
    totalValue: donations
      .filter(t => t.payment_status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      paid: 'default',
      failed: 'destructive'
    } as const

    const labels = {
      pending: 'Pendente',
      paid: 'Recebida',
      failed: 'Falhou'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
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
                size="sm"
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-bold">Campanhas de Arrecadação</h1>
                <p className="text-sm text-muted-foreground">Gestão de campanhas de doação com split automático</p>
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
        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recebidas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.received}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falharam</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Arrecadado</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(stats.totalValue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Donation Form */}
          <DonationForm />

          {/* Donations List */}
          <Card>
            <CardHeader>
              <CardTitle>Doações Recentes</CardTitle>
              <CardDescription>
                Histórico de doações recebidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Carregando...</div>
              ) : donations.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhuma doação encontrada
                </div>
              ) : (
                <div className="space-y-4">
                  {donations.slice(0, 10).map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">
                          {(donation.events as any)?.title || 'Evento não identificado'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ID: {donation.transaction_id}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(donation.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          R$ {(Number(donation.amount) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        {getStatusBadge(donation.payment_status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default AdminDonations
