// src/pages/public/Footer.tsx
import { ZomaLogo } from '@/components/common/ZomaLogo'

export function Footer() {
  return (
    <footer className="bg-text px-6 py-12">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-start md:justify-between gap-8">
        <div className="max-w-xs">
          <ZomaLogo variant="sidebar" subtitle="Paris sportifs · Transactions mobiles" />
          <p className="text-white/50 text-sm mt-4 leading-relaxed">
            Réseau d'agences pour le dépôt et le retrait sur vos comptes de paris sportifs,
            disponible 24h/24 et 7j/7.
          </p>
        </div>

        <div className="flex gap-12">
          <div>
            <p className="text-white font-display font-bold text-sm mb-3">Navigation</p>
            <ul className="flex flex-col gap-2 text-white/50 text-sm">
              <li><a href="#agences" className="hover:text-white transition-colors">Nos agences</a></li>
              <li><a href="#avis" className="hover:text-white transition-colors">Avis clients</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Nous contacter</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto border-t border-white/10 mt-10 pt-6">
        <p className="text-white/40 text-xs text-center">
          © {new Date().getFullYear()} ZOMA SERVICES. Tous droits réservés.
        </p>
      </div>
    </footer>
  )
}