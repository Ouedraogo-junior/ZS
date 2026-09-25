// src/pages/public/AboutSection.tsx
export function AboutSection() {
  return (
    <section id="qui-sommes-nous" className="px-6 py-16 md:py-20 bg-gradient-to-br from-primary to-primary-dark">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white">Qui sommes-nous</h2>
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <p className="text-white text-lg leading-relaxed">
            ZOMA SERVICES est un réseau d'agences spécialisé dans le dépôt et le retrait sur les
            comptes de paris sportifs en ligne (1xBet, Betwinner, Melbet et bien d'autres), via
            Orange Money et Moov Money. Nous simplifions l'accès à vos comptes de paris : rapide,
            sécurisé, disponible 24h/24 et 7j/7, en agence comme par WhatsApp.
          </p>
          <p className="text-white/70 mt-5 leading-relaxed">
            Notre mission : offrir à chaque client un service de confiance, transparent et rapide,
            avec des agents formés et une traçabilité complète de chaque transaction.
          </p>
        </div>
      </div>
    </section>
  )
}