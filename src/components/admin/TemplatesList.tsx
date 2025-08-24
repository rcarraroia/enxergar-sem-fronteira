
/**
 * Templates List Component
 * Displays templates in a table with actions
 */

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Calendar, 
  Copy, 
  Edit, 
  Eye,
  Loader2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Search,
  Trash2,
  User
} from "lucide-react";
import type { TemplatesListProps } from "@/types/notificationTemplates";
import { formatDate } from "@/utils/dateUtils";
import { cn } from "@/lib/utils";

export const TemplatesList: React.FC<TemplatesListProps> = ({
  type,
  templates,
  onEdit,
  onDuplicate,
  onDelete,
  onToggle,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null);

  // Filter templates by search term
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.subject?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (template: any) => {
    try {
      setDeletingTemplate(template.id);
      await onDelete(template);
    } finally {
      setDeletingTemplate(null);
    }
  };

  const getTypeIcon = () => {
    return type === "email" ? Mail : MessageSquare;
  };

  const TypeIcon = getTypeIcon();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando templates...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TypeIcon className="h-5 w-5" />
          Templates de {type === "email" ? "Email" : "WhatsApp"}
        </CardTitle>
        <CardDescription>
          {filteredTemplates.length} template(s) encontrado(s)
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Templates Table */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8">
            <TypeIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm 
                ? `Nenhum template de ${type} encontrado com "${searchTerm}"` 
                : `Nenhum template de ${type} criado ainda`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  {type === "email" && <TableHead>Assunto</TableHead>}
                  <TableHead>Conteúdo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{template.name}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Criado em {formatDate(template.created_at.split("T")[0])}
                        </div>
                      </div>
                    </TableCell>
                    
                    {type === "email" && (
                      <TableCell>
                        <div className="max-w-[200px]">
                          {template.subject ? (
                            <div className="text-sm truncate" title={template.subject}>
                              {template.subject}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sem assunto</span>
                          )}
                        </div>
                      </TableCell>
                    )}
                    
                    <TableCell>
                      <div className="max-w-[300px]">
                        <div className="text-sm text-muted-foreground truncate" title={template.content}>
                          {template.content.substring(0, 100)}
                          {template.content.length > 100 && "..."}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {template.content.length} caracteres
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={template.is_active}
                          onCheckedChange={() => onToggle(template)}
                        />
                        <Badge 
                          variant={template.is_active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {template.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(template.updated_at.split("T")[0])}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o template "{template.name}"?
                                  <br /><br />
                                  <span className="text-destructive font-medium">
                                    ⚠️ Esta ação não pode ser desfeita.
                                  </span>
                                  {template.is_active && (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                      <span className="text-yellow-800 text-sm">
                                        Este template está ativo e pode estar sendo usado no sistema.
                                      </span>
                                    </div>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(template)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={deletingTemplate === template.id}
                                >
                                  {deletingTemplate === template.id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                  )}
                                  Excluir Template
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
