// src/components/public/Navbar.tsx
//
// Fixe et toujours visible. Transparente en haut de page, devient
// blanche avec ombre une fois qu'on a scrollé. En dessous de lg, les
// liens passent dans un menu déroulant (bouton hamburger) plutôt que
// de disparaître purement et simplement.
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { ZomaLogo } from '@/components/common/ZomaLogo'

const LINKS = [
  { href: '#comment-ca-marche', label: 'Comment ça marche' },
  { href: '#qui-sommes-nous', label: 'Qui sommes-nous' },
  { href: '#agences', label: 'Agences' },
  { href: '#avis', label: 'Avis' },
  { href: '#contact', label: 'Contact' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const solid = scrolled || mobileOpen

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${solid ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
      <div className={`max-w-6xl mx-auto px-6 flex items-center justify-between transition-all duration-300 ${solid ? 'py-3' : 'py-5'}`}>
        <ZomaLogo variant="sidebar" light={!solid} />

        <div className="hidden lg:flex items-center gap-6">
          {LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold transition-colors ${
                scrolled ? 'text-muted hover:text-primary' : 'text-white/80 hover:text-white'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <button
          onClick={() => setMobileOpen(o => !o)}
          className={`lg:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
            solid ? 'text-text bg-background' : 'text-white bg-white/10 backdrop-blur'
          }`}
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-border px-6 py-2 flex flex-col">
          {LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-text font-semibold py-3.5 border-b border-background last:border-0"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}