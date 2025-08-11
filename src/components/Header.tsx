import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Heart, Calendar, Users, Shield } from 'lucide-react';
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigation = [{
    name: 'Início',
    href: '#home'
  }, {
    name: 'Eventos',
    href: '#events'
  }, {
    name: 'Sobre',
    href: '#about'
  }, {
    name: 'Contato',
    href: '#contact'
  }];
  return <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Heart className="h-8 w-8 text-primary medical-icon" fill="currentColor" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Enxergar Sem Fronteira</h1>
              <p className="text-xs text-muted-foreground -mt-1">Cuidado que alcança você</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map(item => <a key={item.name} href={item.href} className="text-foreground hover:text-primary transition-colors duration-300 font-medium">
                {item.name}
              </a>)}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Entrar
            </Button>
            <Button className="btn-hero" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Agendar Consulta
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && <div className="md:hidden border-t bg-background/95 backdrop-blur-md">
            <div className="px-4 py-6 space-y-4">
              {navigation.map(item => <a key={item.name} href={item.href} className="block text-foreground hover:text-primary transition-colors duration-300 font-medium py-2" onClick={() => setIsMenuOpen(false)}>
                  {item.name}
                </a>)}
              <div className="flex flex-col space-y-3 pt-4 border-t">
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
                <Button className="btn-hero w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Consulta
                </Button>
              </div>
            </div>
          </div>}
      </div>
    </header>;
};
export default Header;