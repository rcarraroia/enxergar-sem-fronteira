
import React from 'react'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'

const Footer = () => {
  const { getSettingJSON } = useSystemSettings()

  // Get social media links using the helper function
  const socialLinks = getSettingJSON('social_media_links', {}) as { facebook?: string; instagram?: string; linkedin?: string }
  
  const facebookUrl = typeof socialLinks.facebook === 'string' ? socialLinks.facebook.trim() : ''
  const instagramUrl = typeof socialLinks.instagram === 'string' ? socialLinks.instagram.trim() : ''
  const linkedinUrl = typeof socialLinks.linkedin === 'string' ? socialLinks.linkedin.trim() : ''

  return (
    <footer className="bg-gray-900 text-white py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <img 
                src="/public/lovable-uploads/logo512x512.png" 
                alt="Enxergar sem Fronteiras" 
                className="h-12 w-12 mr-3"
              />
              <h3 className="text-xl font-bold">Enxergar sem Fronteiras</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Promovendo a saúde ocular através de eventos oftalmológicos gratuitos, 
              levando esperança e qualidade de vida a comunidades em todo o Brasil.
            </p>
            <div className="flex space-x-4">
              {facebookUrl && (
                <a 
                  href={facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <Facebook className="h-6 w-6" />
                </a>
              )}
              {instagramUrl && (
                <a 
                  href={instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <Instagram className="h-6 w-6" />
                </a>
              )}
              {linkedinUrl && (
                <a 
                  href={linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <Linkedin className="h-6 w-6" />
                </a>
              )}
            </div>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contato</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <span className="text-gray-300">contato@enxergarsemfronteira.com.br</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <span className="text-gray-300">(11) 99999-9999</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="text-gray-300">São Paulo, SP</span>
              </div>
            </div>
          </div>

          {/* Links Úteis */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Links Úteis</h4>
            <ul className="space-y-2">
              <li><a href="/privacy-policy" className="text-gray-300 hover:text-white transition-colors">Política de Privacidade</a></li>
              <li><a href="/terms-of-use" className="text-gray-300 hover:text-white transition-colors">Termos de Uso</a></li>
              <li><a href="/cookies" className="text-gray-300 hover:text-white transition-colors">Política de Cookies</a></li>
              <li><a href="/lgpd" className="text-gray-300 hover:text-white transition-colors">LGPD</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            © 2024 Enxergar sem Fronteiras. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
