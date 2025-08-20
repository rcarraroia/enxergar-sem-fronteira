
import React from 'react'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin, ExternalLink } from 'lucide-react'

export const Footer = () => {
  const { getSettingValue, getSettingJSON, isLoading } = useSystemSettings()

  if (isLoading) {
    return (
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <LoadingSkeleton variant="text" lines={3} />
        </div>
      </footer>
    )
  }

  const organizationName = getSettingValue('organization_name', 'Enxergar sem Fronteiras')
  const organizationDescription = getSettingValue('organization_description', 'Promovendo saúde ocular e transformando vidas através de atendimento oftalmológico gratuito e de qualidade.')
  const organizationPhone = getSettingValue('organization_phone', '')
  const organizationEmail = getSettingValue('organization_email', 'contato@enxergarsemfronteira.com.br')
  const organizationAddress = getSettingValue('organization_address', '')
  
  // Safely parse social media links with proper typing
  const socialLinksRaw = getSettingJSON('social_media_links', {})
  const socialLinks = {
    facebook: typeof socialLinksRaw.facebook === 'string' ? socialLinksRaw.facebook : '',
    instagram: typeof socialLinksRaw.instagram === 'string' ? socialLinksRaw.instagram : '',
    linkedin: typeof socialLinksRaw.linkedin === 'string' ? socialLinksRaw.linkedin : ''
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Organização */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">{organizationName}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {organizationDescription}
            </p>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contato</h4>
            <div className="space-y-3">
              {organizationPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-400" />
                  <a 
                    href={`tel:${organizationPhone.replace(/\D/g, '')}`}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {organizationPhone}
                  </a>
                </div>
              )}
              
              {organizationEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <a 
                    href={`mailto:${organizationEmail}`}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {organizationEmail}
                  </a>
                </div>
              )}

              {organizationAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-400 mt-0.5" />
                  <span className="text-gray-300 text-sm leading-relaxed">
                    {organizationAddress}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Links Úteis */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Links Úteis</h4>
            <div className="space-y-2">
              <a href="/privacy-policy" className="block text-gray-300 hover:text-white transition-colors text-sm">
                Política de Privacidade
              </a>
              <a href="/terms-of-use" className="block text-gray-300 hover:text-white transition-colors text-sm">
                Termos de Uso
              </a>
              <a href="/lgpd" className="block text-gray-300 hover:text-white transition-colors text-sm">
                LGPD
              </a>
              <a href="/cookies" className="block text-gray-300 hover:text-white transition-colors text-sm">
                Política de Cookies
              </a>
            </div>
          </div>

          {/* Redes Sociais */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Siga-nos</h4>
            <div className="flex gap-4">
              {socialLinks.facebook && (
                <a 
                  href={socialLinks.facebook}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-6 w-6" />
                </a>
              )}
              
              {socialLinks.instagram && (
                <a 
                  href={socialLinks.instagram}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-pink-400 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-6 w-6" />
                </a>
              )}
              
              {socialLinks.linkedin && (
                <a 
                  href={socialLinks.linkedin}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-blue-500 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-6 w-6" />
                </a>
              )}
            </div>
            
            <div className="mt-4">
              <a 
                href="https://enxergarsemfronteira.com.br"
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm"
              >
                Site Oficial
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="text-center text-gray-400 text-sm">
            <p>&copy; {currentYear} {organizationName}. Todos os direitos reservados.</p>
            <p className="mt-2">
              Desenvolvido com ❤️ para transformar vidas através da visão
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
