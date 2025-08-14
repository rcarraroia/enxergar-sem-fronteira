
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Cookie, Settings, BarChart, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Cookies = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-medical-bg py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Button>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Cookie className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Política de Biscoitos (Cookies)
            </h1>
            <p className="text-muted-foreground">
              Como utilizamos cookies em nosso site
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>O que são Cookies?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Cookies são pequenos arquivos de texto que são armazenados no seu dispositivo quando 
                você visita um site. Eles são amplamente utilizados para fazer os sites funcionarem 
                de forma mais eficiente, bem como fornecer informações aos proprietários do site.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Tipos de Cookies que Utilizamos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    Cookies Essenciais
                  </h4>
                  <p className="text-sm mb-2">
                    Necessários para o funcionamento básico do site. Sem eles, algumas funcionalidades não funcionariam.
                  </p>
                  <ul className="text-sm list-disc pl-4 space-y-1">
                    <li>Autenticação de usuários</li>
                    <li>Segurança da sessão</li>
                    <li>Preferências de acessibilidade</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>Duração:</strong> Até o fechamento do navegador
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-blue-600" />
                    Cookies Funcionais
                  </h4>
                  <p className="text-sm mb-2">
                    Permitem que o site lembre de suas escolhas e preferências para oferecer uma melhor experiência.
                  </p>
                  <ul className="text-sm list-disc pl-4 space-y-1">
                    <li>Idioma preferido</li>
                    <li>Configurações de tema</li>
                    <li>Dados de formulários salvos</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>Duração:</strong> Até 12 meses
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <BarChart className="h-4 w-4 text-orange-600" />
                    Cookies Analíticos
                  </h4>
                  <p className="text-sm mb-2">
                    Coletam informações sobre como você usa o site para nos ajudar a melhorar sua experiência.
                  </p>
                  <ul className="text-sm list-disc pl-4 space-y-1">
                    <li>Páginas mais visitadas</li>
                    <li>Tempo de permanência no site</li>
                    <li>Origem do tráfego</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>Duração:</strong> Até 24 meses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cookies de Terceiros</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Alguns cookies em nosso site são definidos por serviços de terceiros. Utilizamos os seguintes:
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 rounded">
                  <p><strong>Supabase:</strong> Para autenticação e segurança</p>
                </div>
                <div className="p-3 bg-muted/30 rounded">
                  <p><strong>Lovable:</strong> Para hospedagem e funcionamento da plataforma</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Você pode controlar e gerenciar cookies de várias maneiras:</p>
              
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold mb-2">Configurações do Navegador</h4>
                  <p className="text-sm">
                    A maioria dos navegadores permite controlar cookies através das configurações. 
                    Você pode definir seu navegador para recusar cookies ou alertá-lo quando cookies 
                    estão sendo enviados.
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Exclusão de Cookies</h4>
                  <p className="text-sm">
                    Você pode excluir cookies já armazenados em seu dispositivo a qualquer momento 
                    através das configurações do seu navegador.
                  </p>
                </div>

                <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                  <h4 className="font-semibold mb-2">⚠️ Importante</h4>
                  <p className="text-sm">
                    Desabilitar cookies pode afetar a funcionalidade do site. Alguns recursos podem 
                    não funcionar corretamente se os cookies essenciais forem bloqueados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alterações nesta Política</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Podemos atualizar esta Política de Cookies periodicamente para refletir mudanças 
                em nossos serviços ou requisitos legais. Recomendamos que você revise esta página 
                regularmente para se manter informado sobre como utilizamos cookies.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                <strong>Última atualização:</strong> 13 de Janeiro de 2025
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Se você tiver dúvidas sobre nossa Política de Cookies, entre em contato:
              </p>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p><strong>E-mail:</strong> cookies@enxergarsemfronteira.org.br</p>
                <p><strong>Telefone:</strong> (11) 9999-9999</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cookies;
