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
    </div>
  );
};

export default Index;
