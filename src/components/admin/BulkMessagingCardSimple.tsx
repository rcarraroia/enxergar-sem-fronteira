/**
 * BulkMessagingCardSimple - Versão ultra-simples para teste
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

export const BulkMessagingCardSimple: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    try {
      navigate("/admin/bulk-messaging");
    } catch (error) {
      console.error("Erro na navegação:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Mensagens em Massa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Envie mensagens para múltiplos pacientes
        </p>
        <Button onClick={handleClick} className="w-full">
          Acessar Sistema
        </Button>
      </CardContent>
    </Card>
  );
};

export default BulkMessagingCardSimple;
