
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Settings, User } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { getRedirectPath } from '@/utils/roleRedirect';

const Header = () => {
  const {
    user,
    signOut,
    userRole,
    isAdmin,
    isOrganizer
  } = useAuth();
  const {
    settings,
    loading
  } = useSystemSettings();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getDashboardLink = () => {
    return getRedirectPath(userRole);
  };

  const getDashboardLabel = () => {
    switch (userRole) {
      case 'admin':
        return 'Admin'
      case 'organizer':
        return 'Painel'
      default:
        return 'Dashboard'
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!loading && settings.logo_header ? (
              <img 
                src={settings.logo_header} 
                alt={settings.project_name} 
                className="h-12 object-contain" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }} 
              />
            ) : (
              <div className="w-8 h-8 bg-primary rounded-full"></div>
            )}
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => scrollToSection('home')} 
              className="text-gray-600 hover:text-primary transition-colors cursor-pointer"
            >
              Início
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className="text-gray-600 hover:text-primary transition-colors cursor-pointer"
            >
              Sobre
            </button>
            <button 
              onClick={() => scrollToSection('events')} 
              className="text-gray-600 hover:text-primary transition-colors cursor-pointer"
            >
              Eventos
            </button>
            <a 
              href="/registration" 
              className="text-gray-600 hover:text-primary transition-colors"
            >
              Cadastrar-se
            </a>
          </div>

          <div className="flex items-center space-x-2">
            {user ? (
              <>
                {(isAdmin || isOrganizer) && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={getDashboardLink()}>
                      {isAdmin ? <Settings className="h-4 w-4 mr-2" /> : <User className="h-4 w-4 mr-2" />}
                      {getDashboardLabel()}
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
                  <a href="/auth">Conecte-se</a>
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
