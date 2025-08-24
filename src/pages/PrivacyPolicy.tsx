
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, Lock, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-medical-bg py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Button>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Política de Privacidade
            </h1>
            <p className="text-muted-foreground">
              Última atualização: 13 de Janeiro de 2025
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                1. Informações que Coletamos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>O Projeto Enxergar sem Fronteira coleta as seguintes informações:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Dados Pessoais:</strong> Nome completo, CPF, e-mail, telefone e data de nascimento</li>
                <li><strong>Dados de Saúde:</strong> Informações sobre diagnósticos oftalmológicos ou observações relevantes</li>
                <li><strong>Dados de Navegação:</strong> Cookies técnicos necessários para o funcionamento do site</li>
                <li><strong>Dados de Localização:</strong> Endereço para direcionamento aos eventos mais próximos</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                2. Como Utilizamos suas Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Utilizamos suas informações para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Realizar inscrições em eventos oftalmológicos gratuitos</li>
                <li>Enviar notificações sobre novos eventos em sua região</li>
                <li>Comunicar informações importantes sobre seus agendamentos</li>
                <li>Compartilhar dados com o Instituto Coração Valente para follow-up médico</li>
                <li>Melhorar nossos serviços e experiência do usuário</li>
                <li>Cumprir obrigações legais e regulamentares</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                3. Compartilhamento de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Seus dados podem ser compartilhados com:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Instituto Coração Valente:</strong> Para continuidade do cuidado médico</li>
                <li><strong>Parceiros Médicos:</strong> Profissionais responsáveis pelos atendimentos</li>
                <li><strong>Autoridades Competentes:</strong> Quando exigido por lei</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Nunca vendemos, alugamos ou comercializamos seus dados pessoais com terceiros para fins comerciais.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Seus Direitos (LGPD)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Conforme a Lei Geral de Proteção de Dados, você tem o direito de:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Confirmar a existência de tratamento de dados</li>
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li>Solicitar a exclusão de dados desnecessários ou excessivos</li>
                <li>Solicitar a portabilidade de dados</li>
                <li>Revogar seu consentimento a qualquer momento</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Segurança dos Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Implementamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais 
                contra acesso não autorizado, alteração, divulgação ou destruição não autorizada.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Contato</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato conosco:
              </p>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p><strong>E-mail:</strong> privacidade@enxergarsemfronteira.org.br</p>
                <p><strong>Telefone:</strong> (11) 9999-9999</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
