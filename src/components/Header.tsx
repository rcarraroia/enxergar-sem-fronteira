
import React from 'react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full"></div>
            <span className="text-xl font-bold text-gray-900">Enxergar sem Fronteiras</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <a href="#home" className="text-gray-600 hover:text-primary transition-colors">
              Início
            </a>
            <a href="#about" className="text-gray-600 hover:text-primary transition-colors">
              Sobre
            </a>
            <a href="#events" className="text-gray-600 hover:text-primary transition-colors">
              Eventos
            </a>
            <a href="/registration" className="text-gray-600 hover:text-primary transition-colors">
              Cadastrar-se
            </a>
          </div>

          <Button asChild>
            <a href="/registration">Participar</a>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
