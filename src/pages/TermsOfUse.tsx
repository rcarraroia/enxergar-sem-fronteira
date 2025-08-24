
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, FileText, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfUse = () => {
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
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Termos de Uso
            </h1>
            <p className="text-muted-foreground">
              Última atualização: 13 de Janeiro de 2025
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Aceitação dos Termos</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Ao acessar e utilizar a plataforma do Projeto Enxergar sem Fronteira, você concorda 
                integralmente com estes Termos de Uso. Se não concordar com qualquer parte destes termos, 
                não utilize nossos serviços.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                2. Descrição dos Serviços
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>O Projeto Enxergar sem Fronteira oferece:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cadastro gratuito para eventos oftalmológicos</li>
                <li>Agendamento de consultas oftalmológicas gratuitas</li>
                <li>Informações sobre eventos itinerantes de saúde visual</li>
                <li>Notificações sobre novos eventos em sua região</li>
                <li>Integração com parceiros médicos para continuidade do cuidado</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Elegibilidade e Cadastro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Para utilizar nossos serviços, você deve:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ser maior de 18 anos ou ter autorização dos responsáveis</li>
                <li>Fornecer informações verdadeiras e precisas</li>
                <li>Manter seus dados atualizados</li>
                <li>Possuir documento de identificação válido (CPF)</li>
                <li>Concordar com o tratamento de dados conforme nossa Política de Privacidade</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                4. Responsabilidades do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Ao utilizar nossos serviços, você se compromete a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Comparecer aos eventos para os quais se inscreveu</li>
                <li>Informar com antecedência caso não possa comparecer</li>
                <li>Respeitar os profissionais de saúde e demais usuários</li>
                <li>Não fornecer informações falsas ou enganosas</li>
                <li>Não utilizar o serviço para fins comerciais</li>
                <li>Seguir as orientações médicas recebidas durante os atendimentos</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Limitações e Responsabilidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>O Projeto Enxergar sem Fronteira:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Não garante disponibilidade de vagas em todos os eventos</li>
                <li>Pode cancelar ou reprogramar eventos por motivos de força maior</li>
                <li>Não se responsabiliza por diagnósticos ou tratamentos médicos</li>
                <li>Atua apenas como facilitador do acesso aos serviços de saúde</li>
                <li>Pode suspender o acesso de usuários que violem estes termos</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                6. Proteção de Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                O tratamento de seus dados pessoais é regido por nossa Política de Privacidade, 
                em conformidade com a Lei Geral de Proteção de Dados (LGPD). Seus dados serão 
                compartilhados com o Instituto Coração Valente apenas para fins de follow-up médico.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Modificações dos Termos</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. 
                As alterações entrarão em vigor imediatamente após sua publicação no site. 
                É sua responsabilidade revisar periodicamente estes termos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Contato</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Para dúvidas sobre estes Termos de Uso, entre em contato:
              </p>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p><strong>E-mail:</strong> contato@enxergarsemfronteira.org.br</p>
                <p><strong>Telefone:</strong> (11) 9999-9999</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
