import { Card } from '@/components/ui/card';

const PartnersSection = () => {
  const partners = [
    {
      name: 'Instituto Coração Valente',
      logo: '/placeholder-logo-1.png',
      description: 'Organização principal do projeto'
    },
    {
      name: 'Projeto Visão Itinerante',
      logo: '/placeholder-logo-2.png', 
      description: 'Parceiro estratégico'
    },
    {
      name: 'Fundação Saúde Visual',
      logo: '/placeholder-logo-3.png',
      description: 'Apoio técnico e científico'
    },
    {
      name: 'Rede de Hospitais',
      logo: '/placeholder-logo-4.png',
      description: 'Suporte médico especializado'
    }
  ];

  return (
    <section className="py-20 bg-medical-bg">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">Nossos Parceiros</h2>
          <p className="text-subtitle text-muted-foreground max-w-2xl mx-auto">
            Trabalhamos em conjunto com organizações comprometidas com a saúde visual
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {partners.map((partner, index) => (
            <Card key={index} className="p-6 text-center medical-card hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">
                    {partner.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                  </span>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm">{partner.name}</h3>
              <p className="text-xs text-muted-foreground">{partner.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;