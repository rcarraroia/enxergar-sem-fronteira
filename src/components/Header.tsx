
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Settings } from 'lucide-react';

const Header = () => {
  const { user, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

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
            {user && (
              <a href="/admin" className="text-gray-600 hover:text-primary transition-colors">
                Painel Admin
              </a>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {user ? (
              <>
                {isAdmin && (
                  <Button variant="outline" size="sm" asChild>
                    <a href="/admin">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <a href="/auth">Login</a>
                </Button>
                <Button asChild>
                  <a href="/registration">Participar</a>
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
