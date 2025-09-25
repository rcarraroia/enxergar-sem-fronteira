import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSystemSettings } from "@/hooks/useSystemSettings";

interface SystemSettingsFormProps {
  section: "general" | "logos" | "social" | "apikeys"
}

export const SystemSettingsForm = ({ section }: SystemSettingsFormProps) => {
  const { getSettingValue, updateSetting, isUpdating } = useSystemSettings();
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    // Carregar configurações baseadas na seção
    const loadSettings = () => {
      switch (section) {
        case "general":
          setFormData({
            project_name: getSettingValue("project_name", "Enxergar sem Fronteiras"),
            project_description: getSettingValue("project_description", "Cuidados oftalmológicos gratuitos para comunidades"),
          });
          break;
        case "logos":
          setFormData({
            logo_header: getSettingValue("logo_header", ""),
            logo_footer: getSettingValue("logo_footer", ""),
          });
          break;
        case "social":
          const socialLinks = getSettingValue("social_links", "{}");
          const parsedLinks = typeof socialLinks === "string" ? JSON.parse(socialLinks) : socialLinks;
          setFormData({
            facebook: parsedLinks.facebook || "",
            instagram: parsedLinks.instagram || "",
            linkedin: parsedLinks.linkedin || "",
          });
          break;
        case "apikeys":
          setFormData({
            asaas_api_key: getSettingValue("asaas_api_key", ""),
            vonage_api_key: getSettingValue("vonage_api_key", ""),
            vonage_api_secret: getSettingValue("vonage_api_secret", ""),
          });
          break;
      }
    };

    loadSettings();
  }, [section, getSettingValue]);

  const handleSave = async () => {
    try {
      switch (section) {
        case "general":
          updateSetting("project_name", formData.project_name || "");
          updateSetting("project_description", formData.project_description || "");
          break;
        case "logos":
          updateSetting("logo_header", formData.logo_header || "");
          updateSetting("logo_footer", formData.logo_footer || "");
          break;
        case "social":
          const socialData = {
            facebook: formData.facebook,
            instagram: formData.instagram,
            linkedin: formData.linkedin,
          };
          updateSetting("social_links", JSON.stringify(socialData));
          break;
        case "apikeys":
          updateSetting("asaas_api_key", formData.asaas_api_key || "");
          updateSetting("vonage_api_key", formData.vonage_api_key || "");
          updateSetting("vonage_api_secret", formData.vonage_api_secret || "");
          break;
      }
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const renderFields = () => {
    switch (section) {
      case "general":
        return (
          <>
            <div>
              <Label htmlFor="project_name">Nome do Projeto</Label>
              <Input
                id="project_name"
                value={formData.project_name || ""}
                onChange={(e) => handleInputChange("project_name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="project_description">Descrição do Projeto</Label>
              <Textarea
                id="project_description"
                value={formData.project_description || ""}
                onChange={(e) => handleInputChange("project_description", e.target.value)}
              />
            </div>
          </>
        );
      case "logos":
        return (
          <>
            <div>
              <Label htmlFor="logo_header">URL do Logo Header</Label>
              <Input
                id="logo_header"
                value={formData.logo_header || ""}
                onChange={(e) => handleInputChange("logo_header", e.target.value)}
                placeholder="https://exemplo.com/logo-header.png"
              />
            </div>
            <div>
              <Label htmlFor="logo_footer">URL do Logo Footer</Label>
              <Input
                id="logo_footer"
                value={formData.logo_footer || ""}
                onChange={(e) => handleInputChange("logo_footer", e.target.value)}
                placeholder="https://exemplo.com/logo-footer.png"
              />
            </div>
          </>
        );
      case "social":
        return (
          <>
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={formData.facebook || ""}
                onChange={(e) => handleInputChange("facebook", e.target.value)}
                placeholder="https://facebook.com/perfil"
              />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram || ""}
                onChange={(e) => handleInputChange("instagram", e.target.value)}
                placeholder="https://instagram.com/perfil"
              />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.linkedin || ""}
                onChange={(e) => handleInputChange("linkedin", e.target.value)}
                placeholder="https://linkedin.com/company/perfil"
              />
            </div>
          </>
        );
      case "apikeys":
        return (
          <>
            <div>
              <Label htmlFor="asaas_api_key">Asaas API Key</Label>
              <Input
                id="asaas_api_key"
                type="password"
                value={formData.asaas_api_key || ""}
                onChange={(e) => handleInputChange("asaas_api_key", e.target.value)}
                placeholder="Chave da API do Asaas"
              />
            </div>
            <div>
              <Label htmlFor="vonage_api_key">Vonage API Key</Label>
              <Input
                id="vonage_api_key"
                value={formData.vonage_api_key || ""}
                onChange={(e) => handleInputChange("vonage_api_key", e.target.value)}
                placeholder="Chave da API do Vonage"
              />
            </div>
            <div>
              <Label htmlFor="vonage_api_secret">Vonage API Secret</Label>
              <Input
                id="vonage_api_secret"
                type="password"
                value={formData.vonage_api_secret || ""}
                onChange={(e) => handleInputChange("vonage_api_secret", e.target.value)}
                placeholder="Secret da API do Vonage"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {section === "general" && "Configurações Gerais"}
          {section === "logos" && "Logos do Sistema"}
          {section === "social" && "Redes Sociais"}
          {section === "apikeys" && "Chaves de API"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderFields()}
        <Button onClick={handleSave} disabled={isUpdating} className="w-full">
          {isUpdating ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardContent>
    </Card>
  );
};
