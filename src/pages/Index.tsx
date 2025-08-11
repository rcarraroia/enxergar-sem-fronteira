
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import EventsSection from '@/components/EventsSection';
import AboutSection from '@/components/AboutSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <EventsSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
