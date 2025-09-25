/**
 * Template Form Component
 * Form for creating and editing notification templates
 * VERSÃO SIMPLIFICADA para evitar React Error #310
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TemplateFormProps } from "@/types/notificationTemplates";

export const TemplateForm: React.FC<TemplateFormProps> = ({
  onCancel,
}) => {
  // CORREÇÃO TEMPORÁRIA: Componente simplificado para evitar React Error #310
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle>Template Form Temporariamente Desabilitado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                O formulário de templates está temporariamente simplificado para evitar erros de renderização.
                A versão completa será implementada no Admin V2.
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Voltar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};