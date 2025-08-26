
import AboutSection from "@/components/AboutSection";
import EventsSection from "@/components/EventsSection";
import { Footer } from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PartnersSection from "@/components/PartnersSection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <AboutSection />
      <PartnersSection />
      <EventsSection />
      <Footer />

      {/* Widget de Chat Público */}
      <PublicChatWidget
        position="bottom-right"
        theme="light"
        enableVoice={false}
        welcomeMessage="Olá! Precisa de ajuda com nossos eventos de oftalmologia?"
        placeholder="Como posso ajudar você?"
        showNewBadge={true}
      />
    </div>
  );
};

export default Index;
