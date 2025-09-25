
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  label: string
  value: string
  onChange: (url: string) => void
  placeholder?: string
  description?: string
  previewBg?: string
}

export const ImageUpload = ({ 
  label, 
  value, 
  onChange, 
  placeholder,
  description,
  previewBg = "bg-white"
}: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {return;}

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione apenas arquivos de imagem");
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Converter para base64 para preview temporário
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        onChange(base64String);
        toast.success("Imagem carregada com sucesso!");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao carregar a imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
  };

  const clearImage = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, "_")}>{label}</Label>
      
      {/* Upload de arquivo */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id={`file_${label.toLowerCase().replace(/\s+/g, "_")}`}
        />
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Carregando..." : "Selecionar Arquivo"}
          </Button>
          
          {value && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={clearImage}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Ou inserir URL */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Ou inserir URL da imagem:</Label>
        <Input
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {/* Preview da imagem */}
      {value && (
        <div className={`mt-4 p-4 border rounded ${previewBg}`}>
          <p className="text-sm font-medium mb-2">Preview:</p>
          <img 
            src={value} 
            alt={`${label} Preview`} 
            className="h-16 object-contain"
            onError={(e) => {
              e.currentTarget.src = "";
              e.currentTarget.alt = "Erro ao carregar imagem";
            }}
          />
        </div>
      )}
    </div>
  );
};
