
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, Lock, Scale, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LGPD = () => {
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
              <Scale className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Lei Geral de Proteção de Dados
            </h1>
            <p className="text-muted-foreground">
              Compromisso com a proteção dos seus dados pessoais
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nosso Compromisso com a LGPD</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                O Projeto Enxergar sem Fronteira está totalmente comprometido com o cumprimento da 
                Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), garantindo que o 
                tratamento dos seus dados pessoais seja realizado de forma transparente, segura e 
                em conformidade com a legislação vigente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Seus Direitos como Titular de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>De acordo com a LGPD, você possui os seguintes direitos:</p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Confirmação e Acesso</h4>
                  <p className="text-sm">Confirmar se tratamos seus dados e ter acesso a eles</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Correção</h4>
                  <p className="text-sm">Corrigir dados incompletos, inexatos ou desatualizados</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Eliminação</h4>
                  <p className="text-sm">Solicitar a exclusão de dados desnecessários ou excessivos</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Portabilidade</h4>
                  <p className="text-sm">Solicitar a portabilidade de dados para outro fornecedor</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Anonimização</h4>
                  <p className="text-sm">Solicitar anonimização ou bloqueio de dados</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Revogação</h4>
                  <p className="text-sm">Revogar o consentimento a qualquer momento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Base Legal para Tratamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Tratamos seus dados pessoais com base nas seguintes hipóteses legais:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Consentimento:</strong> Para cadastro e comunicações sobre eventos</li>
                <li><strong>Execução de contrato:</strong> Para prestação dos serviços solicitados</li>
                <li><strong>Interesse legítimo:</strong> Para melhorar nossos serviços</li>
                <li><strong>Proteção da vida:</strong> Para cuidados médicos oftalmológicos</li>
                <li><strong>Cumprimento de obrigação legal:</strong> Quando exigido por lei</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Dados Sensíveis de Saúde
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Coletamos dados sensíveis relacionados à sua saúde oftalmológica exclusivamente 
                para prestação dos serviços médicos. Estes dados recebem proteção especial e são:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Coletados apenas com seu consentimento específico</li>
                <li>Tratados por profissionais de saúde qualificados</li>
                <li>Compartilhados apenas com o Instituto Coração Valente para continuidade do cuidado</li>
                <li>Armazenados com medidas de segurança reforçadas</li>
                <li>Mantidos pelo tempo necessário para o cuidado médico</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retenção de Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades 
                descritas nesta política, respeitando os prazos legais aplicáveis:
              </p>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <ul className="space-y-2">
                  <li><strong>Dados cadastrais:</strong> Até 5 anos após o último contato</li>
                  <li><strong>Dados de saúde:</strong> Conforme regulamentação médica (mínimo 20 anos)</li>
                  <li><strong>Dados de navegação:</strong> Até 6 meses</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Como Exercer seus Direitos</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Para exercer qualquer um dos seus direitos previstos na LGPD, entre em contato conosco:
              </p>
              <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                <p><strong>Encarregado de Dados (DPO):</strong></p>
                <p><strong>E-mail:</strong> lgpd@enxergarsemfronteira.org.br</p>
                <p><strong>Telefone:</strong> (11) 9999-9999</p>
                <p><strong>Prazo de resposta:</strong> Até 15 dias úteis</p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Você também pode registrar uma reclamação junto à Autoridade Nacional de Proteção de Dados (ANPD).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LGPD;
