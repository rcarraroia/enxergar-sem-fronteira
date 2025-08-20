
import React from 'react'
import Hero from '@/components/Hero'
import AboutSection from '@/components/AboutSection'
import EventsSection from '@/components/EventsSection'
import Header from '@/components/Header'
import { Footer } from '@/components/Footer'

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <AboutSection />
      <EventsSection />
      <Footer />
    </div>
  )
}

export default Index
