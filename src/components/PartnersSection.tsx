import { Card } from '@/components/ui/card';

const PartnersSection = () => {
  const partners = [
    {
      name: 'ONG Coração Valente - Ipatinga',
      logo: '/lovable-uploads/coracao-valente.png',
      description: 'Organização principal do projeto'
    },
    {
      name: 'Paroquia Cristo Libertador - Ipatinga',
      logo: '/lovable-uploads/195e33d8-8072-4e60-bc4c-ad46fd5d5f92.png',
      description: 'Parceiro estratégico'
    },
    {
      name: 'Paroquia São Jose - Timoteo',
      logo: '/lovable-uploads/7395f0a2-2919-485c-95e3-5b2a860ccbaf.png',
      description: 'Apoio comunitário'
    },
    {
      name: 'Wladimir Careca - Timoteo',
      logo: '/lovable-uploads/c75287af-b68b-421f-991e-f0793f759207.png',
      description: 'Parceiro local'
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
              <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <img 
                  src={partner.logo} 
                  alt={partner.name}
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    // Fallback caso a imagem não carregue
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center hidden">
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