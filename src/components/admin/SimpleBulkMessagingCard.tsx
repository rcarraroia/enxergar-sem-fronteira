/**
 * SimpleBulkMessagingCard - Versão simplificada do card de mensagens em massa
 *
 * Versão mais robusta e simples para evitar crashes no dashboard
 */

import React from "react";
import { useNavigate } from "react-router-dom";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Icons
import { MessageSquare, Send } from "lucide-react";

export const SimpleBulkMessagingCard: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/admin/bulk-messaging");
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Mensagens em Massa</CardTitle>
            <CardDescription>
              Envie mensagens para múltiplos pacientes
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Features */}
        <div className="text-sm space-y-1">
          <div>• Email, SMS e WhatsApp</div>
          <div>• Templates dinâmicos</div>
          <div>• Filtros por eventos</div>
          <div>• Modo de teste</div>
        </div>

        {/* Action Button */}
        <Button onClick={handleClick} className="w-full">
          <Send className="h-4 w-4 mr-2" />
          Acessar Sistema
        </Button>
      </CardContent>
    </Card>
  );
};

export default SimpleBulkMessagingCard;
