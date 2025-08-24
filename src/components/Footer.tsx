
import React from "react";
import { useSystemSettings } from "@/hooks/useSystemSettings";

export const Footer = () => {
  const { getSettingJSON } = useSystemSettings();
  
  const socialLinks = getSettingJSON("social_links", {
    facebook: "",
    instagram: "",
    linkedin: ""
  }) as { facebook: string; instagram: string; linkedin: string };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Informações da Organização */}
          <div>
            <h3 className="text-xl font-bold mb-4">Enxergar sem Fronteiras</h3>
            <p className="text-gray-300 mb-4">
              Levando cuidados oftalmológicos gratuitos para comunidades em todo o Brasil.
            </p>
            <div className="flex space-x-4">
              {socialLinks.facebook && socialLinks.facebook.toString().trim() && (
                <a 
                  href={socialLinks.facebook.toString()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Facebook
                </a>
              )}
              {socialLinks.instagram && socialLinks.instagram.toString().trim() && (
                <a 
                  href={socialLinks.instagram.toString()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Instagram
                </a>
              )}
              {socialLinks.linkedin && socialLinks.linkedin.toString().trim() && (
                <a 
                  href={socialLinks.linkedin.toString()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Links Úteis */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Links Úteis</h4>
            <ul className="space-y-2">
              <li>
                <a href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="/terms" className="text-gray-300 hover:text-white transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="/lgpd" className="text-gray-300 hover:text-white transition-colors">
                  LGPD
                </a>
              </li>
              <li>
                <a href="/cookies" className="text-gray-300 hover:text-white transition-colors">
                  Política de Cookies
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contato</h4>
            <div className="space-y-2 text-gray-300">
              <p>📧 coracaovalenteorg@gmail.com</p>
              <p>📍 Brasil</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-4 text-center text-gray-300">
          <p>&copy; {currentYear} Enxergar sem Fronteiras. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
