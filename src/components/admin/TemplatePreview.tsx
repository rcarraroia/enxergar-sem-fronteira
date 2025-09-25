/**
 * Template Preview Component
 * Shows real-time preview of templates with sample data
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  Eye, 
  EyeOff,
  Mail,
  MessageSquare,
  RefreshCw
} from "lucide-react";
import type { TemplatePreviewProps } from "@/types/notificationTemplates";
import { useAutoTemplatePreview } from "@/hooks/useTemplatePreview";
import { DEFAULT_SAMPLE_DATA } from "@/types/notificationTemplates";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  sampleData = DEFAULT_SAMPLE_DATA,
  className
}) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const [highlightVariables, setHighlightVariables] = React.useState(true);
  
  const { preview, loading, error } = useAutoTemplatePreview(
    template, 
    sampleData, 
    300 // 300ms debounce
  );

  const handleCopyContent = async () => {
    if (!preview?.processedContent) {return;}
    
    try {
      await navigator.clipboard.writeText(preview.processedContent);
      toast.success("Conteúdo copiado para a área de transferência");
    } catch (error) {
      toast.error("Erro ao copiar conteúdo");
    }
  };

  const handleCopySubject = async () => {
    if (!preview?.processedSubject) {return;}
    
    try {
      await navigator.clipboard.writeText(preview.processedSubject);
      toast.success("Assunto copiado para a área de transferência");
    } catch (error) {
      toast.error("Erro ao copiar assunto");
    }
  };

  // Highlight variables in content
  const highlightContent = (content: string) => {
    if (!highlightVariables) {return content;}
    
    return content.replace(
      /\{\{([^}]+)\}\}/g, 
      '<span class="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-xs font-mono border">{{$1}}</span>'
    );
  };

  const getPreviewIcon = () => {
    return template.type === "email" ? Mail : MessageSquare;
  };

  const PreviewIcon = getPreviewIcon();

  if (!isVisible) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Button
            variant="ghost"
            onClick={() => setIsVisible(true)}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <Eye className="h-4 w-4" />
            Mostrar Preview
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <PreviewIcon className="h-4 w-4 text-primary" />
            Preview do Template
            {loading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHighlightVariables(!highlightVariables)}
              className="h-7 px-2"
            >
              {highlightVariables ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  <span className="text-xs">Ocultar variáveis</span>
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  <span className="text-xs">Mostrar variáveis</span>
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-7 px-2"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">
          Preview com dados de exemplo. 
          {template.type === "email" ? "Visualização de email" : "Visualização de WhatsApp"}.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Erro no template:</strong> {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Errors */}
        {preview && preview.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium text-sm">Erros encontrados:</div>
                <ul className="text-xs space-y-0.5">
                  {preview.errors.map((error, index) => (
                    <li key={index}>• {error.message}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {preview && preview.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium text-sm">Avisos:</div>
                <ul className="text-xs space-y-0.5">
                  {preview.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Status */}
        {preview && preview.success && preview.errors.length === 0 && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            Template válido e pronto para uso
          </div>
        )}

        {/* Preview Content */}
        {preview && (
          <div className="space-y-4">
            {/* Email Subject (if applicable) */}
            {template.type === "email" && preview.processedSubject && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Assunto:</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopySubject}
                    className="h-6 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-lg border">
                  <div 
                    className="text-sm font-medium"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightContent(preview.processedSubject) 
                    }}
                  />
                </div>
              </div>
            )}

            <Separator />

            {/* Message Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  {template.type === "email" ? "Conteúdo do Email:" : "Mensagem WhatsApp:"}
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyContent}
                  className="h-6 px-2"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <div className={cn(
                "p-4 rounded-lg border min-h-[120px]",
                template.type === "email" 
                  ? "bg-white border-gray-200" 
                  : "bg-green-50 border-green-200"
              )}>
                {template.type === "whatsapp" && (
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-200">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">WhatsApp</span>
                    <Badge variant="secondary" className="text-xs">Preview</Badge>
                  </div>
                )}
                
                <div 
                  className={cn(
                    "text-sm whitespace-pre-wrap leading-relaxed",
                    template.type === "whatsapp" ? "text-gray-800" : "text-gray-900"
                  )}
                  dangerouslySetInnerHTML={{ 
                    __html: highlightContent(preview.processedContent) 
                  }}
                />
              </div>
            </div>

            {/* Sample Data Info */}
            <div className="pt-2 border-t">
              <details className="group">
                <summary className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  <ExternalLink className="h-3 w-3" />
                  Dados de exemplo utilizados
                  <span className="ml-auto group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-2 p-2 bg-muted rounded text-xs font-mono space-y-1">
                  {Object.entries(sampleData).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !preview && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">Gerando preview...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !preview && !error && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <PreviewIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Digite o conteúdo do template para ver o preview</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};