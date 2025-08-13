import { Heart, Eye, Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
const Footer = () => {
  const quickLinks = [{
    name: 'Sobre o Projeto',
    href: '#about'
  }, {
    name: 'Próximos Eventos',
    href: '#events'
  }, {
    name: 'Como Funciona',
    href: '#how-it-works'
  }, {
    name: 'Parceiros',
    href: '#partners'
  }];
  const legalLinks = [{
    name: 'Política de Privacidade',
    href: '/privacy'
  }, {
    name: 'Termos de Uso',
    href: '/terms'
  }, {
    name: 'LGPD',
    href: '/lgpd'
  }, {
    name: 'Cookies',
    href: '/cookies'
  }];
  const socialLinks = [{
    icon: Facebook,
    href: '#',
    label: 'Facebook'
  }, {
    icon: Instagram,
    href: '#',
    label: 'Instagram'
  }, {
    icon: Linkedin,
    href: '#',
    label: 'LinkedIn'
  }];
  return <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="py-16 grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Heart className="h-8 w-8 text-primary" fill="currentColor" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold">Enxergar sem Fronteira</h3>
                <p className="text-sm text-muted opacity-80">Cuidado que alcança você</p>
              </div>
            </div>
            
            <p className="text-sm text-muted opacity-80 leading-relaxed">
              Democratizando o acesso à saúde oftalmológica através de atendimentos itinerantes 
              em comunidades carentes por todo o Brasil.
            </p>

            <div className="flex space-x-3">
              {socialLinks.map((social, index) => <Button key={index} variant="outline" size="sm" className="w-10 h-10 p-0 border-background/20 hover:bg-primary hover:border-primary" asChild>
                  <a href={social.href} aria-label={social.label}>
                    <social.icon className="h-4 w-4" />
                  </a>
                </Button>)}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Links Rápidos</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => <li key={index}>
                  <a href={link.href} className="text-sm text-muted opacity-80 hover:opacity-100 hover:text-primary transition-colors">
                    {link.name}
                  </a>
                </li>)}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Contato</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted opacity-80">Fale Conosco</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted opacity-80">(11) 9999-9999</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-sm text-muted opacity-80">
                  São Paulo, SP<br />
                  Brasil
                </span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Newsletter</h4>
            <p className="text-sm text-muted opacity-80">
              Receba atualizações sobre novos eventos e campanhas.
            </p>
            <div className="space-y-2">
              <input type="email" placeholder="Seu e-mail" className="w-full px-3 py-2 text-sm bg-background/10 border border-background/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder-muted/60" />
              <Button size="sm" className="w-full btn-hero">
                Inscrever-se
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-background/20 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-sm text-muted opacity-80">
                © 2025 Projeto Visão Itinerante. Todos os direitos reservados.
              </p>
              <p className="text-xs text-muted opacity-60 mt-1">
                Uma iniciativa do Instituto Coração Valente
              </p>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center md:justify-end gap-4">
              {legalLinks.map((link, index) => <a key={index} href={link.href} className="text-xs text-muted opacity-60 hover:opacity-100 hover:text-primary transition-colors">
                  {link.name}
                </a>)}
            </div>
          </div>

          {/* Recognition */}
          <div className="mt-8 pt-6 border-t border-background/10 text-center">
            <div className="flex items-center justify-center space-x-2 text-primary">
              <Eye className="h-5 w-5" />
              <span className="text-sm font-medium">
                Projeto reconhecido pelo Ministério da Saúde
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;