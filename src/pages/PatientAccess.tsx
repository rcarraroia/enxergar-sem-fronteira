
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Clock, User, Eye } from 'lucide-react'
import { usePatientTokens } from '@/hooks/usePatientTokens'

const PatientAccess = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { getPatientByToken, loading } = usePatientTokens()
  const [accessData, setAccessData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPatientData = async () => {
      if (!token) {
        setError('Token de acesso não fornecido')
        return
      }

      try {
        const data = await getPatientByToken(token)
        if (!data) {
          setError('Link de acesso inválido ou expirado')
          return
        }
        setAccessData(data)
      } catch (error) {
        setError('Erro ao carregar dados')
      }
    }

    loadPatientData()
  }, [token, getPatientByToken])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!accessData) {
    return null
  }

  const { patient, event } = accessData

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Eye className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-3xl font-bold">Enxergar sem Fronteiras</h1>
          </div>
          <p className="text-muted-foreground">Acompanhe sua inscrição no evento</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Dados do Paciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Seus Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="font-medium">{patient.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="font-medium">{patient.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                <p className="font-medium">{patient.telefone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status da Inscrição</label>
                <div className="mt-1">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Confirmada
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Evento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Título</label>
                <p className="font-medium">{event.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data</label>
                <p className="font-medium">
                  {new Date(event.date).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Horário</label>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <p className="font-medium">{event.start_time} - {event.end_time}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Local</label>
                <div className="flex items-start gap-1">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="font-medium">{event.location}</p>
                    {event.address && (
                      <p className="text-sm text-muted-foreground">{event.address}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instruções */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instruções Importantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• Chegue ao local com 30 minutos de antecedência</p>
              <p>• Traga um documento de identidade com foto</p>
              <p>• Caso tenha óculos ou lentes de contato, traga-os para a consulta</p>
              <p>• Em caso de dúvidas, entre em contato conosco</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PatientAccess
