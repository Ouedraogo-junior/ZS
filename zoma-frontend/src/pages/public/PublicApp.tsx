// src/pages/public/PublicApp.tsx
//
// Site public — vitrine de l'agence, accessible sans connexion.
import { HeroCarousel } from '@/components/public/HeroCarousel'
import { Navbar } from '@/components/public/Navbar'
import { HowItWorksSection } from './HowItWorksSection'
import { AboutSection } from './AboutSection'
import { TeamSection } from './TeamSection'
import { AgenciesSection } from './AgenciesSection'
import { AvisSection } from './AvisSection'
import { ContactSection } from './ContactSection'
import { Footer } from './Footer'

export default function PublicApp() {
  return (
    <div className="min-h-screen min-h-dvh bg-white">
      <Navbar />

      <header className="relative h-[85vh] min-h-[560px] flex flex-col overflow-hidden">
        <HeroCarousel />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
          <h1 className="font-display text-white text-4xl md:text-6xl font-bold max-w-3xl leading-tight animate-fade-in-up">
            Dépôt et retrait rapides pour vos comptes de paris sportifs
          </h1>
          <p
            className="text-white/80 text-lg mt-5 max-w-xl animate-fade-in-up"
            style={{ animationDelay: '150ms' }}
          >
            Orange Money, Moov Money — un réseau d'agences disponible 24h/24, 7j/7.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <a
              href="#agences"
              className="bg-white text-primary font-display font-bold px-6 py-3 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              Trouver une agence
            </a>
            <a
              href="#avis"
              className="bg-white/10 backdrop-blur text-white font-display font-bold px-6 py-3 rounded-xl border border-white/30 transition-all hover:bg-white/20 active:scale-95"
            >
              Voir les avis
            </a>
          </div>
        </div>
      </header>

      <HowItWorksSection />
      <AboutSection />
      <TeamSection />
      <AgenciesSection />
      <AvisSection />
      <ContactSection />
      <Footer />
    </div>
  )
}