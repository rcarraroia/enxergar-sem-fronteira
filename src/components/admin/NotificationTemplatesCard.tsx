

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  MessageSquare,
  Plus,
  Settings
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const NotificationTemplatesCard = () => {
  const navigate = useNavigate();
  
  const handleManageAll = () => {
    navigate("/admin/settings?tab=templates");
  };

  const handleCreateTemplate = () => {
    navigate("/admin/settings?tab=templates&action=create");
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciar Notificações
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleManageAll}>
              <Eye className="h-4 w-4 mr-2" />
              Gerenciar Todos
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-blue-700 font-medium">Templates Email</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-green-700 font-medium">Templates SMS</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-purple-700 font-medium">Templates WhatsApp</div>
          </div>
        </div>

        {/* Templates recentes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Templates Recentes</h4>
            <Badge variant="outline" className="text-xs">0 total</Badge>
          </div>
          
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Nenhum template encontrado</p>
            <p className="text-xs">Crie seu primeiro template de notificação</p>
          </div>
        </div>

        {/* Ações principais */}
        <div className="flex gap-2 pt-2 border-t">
          <Button className="flex-1" onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>

        {/* Informações do sistema */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span>Sistema de Notificações</span>
            <Badge variant="outline" className="text-xs">Ativo</Badge>
          </div>
          <p>Sistema temporariamente simplificado para evitar erros de renderização.</p>
        </div>
      </CardContent>
    </Card>
  );
};
