// src/pages/public/HowItWorksSection.tsx
import { useState } from 'react'
import { MapPin, Smartphone, CheckCircle2, MessageCircle, Wallet, Camera } from 'lucide-react'

const AGENCY_STEPS = [
  {
    icon: MapPin,
    title: 'Rendez-vous en agence',
    description: "Trouvez l'agence ZOMA SERVICES la plus proche, ouverte 24h/24 et 7j/7.",
  },
  {
    icon: Smartphone,
    title: 'Donnez vos informations',
    description: "Communiquez le montant, votre numéro de compte de paris et votre numéro mobile money.",
  },
  {
    icon: CheckCircle2,
    title: 'Recevez la confirmation',
    description: "L'agent enregistre votre transaction immédiatement, en toute traçabilité.",
  },
]

// Procédure de dépôt telle que décrite — à confirmer et ajuster, en
// particulier le numéro WhatsApp à afficher et la procédure de retrait
// (pas encore définie).
const WHATSAPP_STEPS = [
  {
    icon: MessageCircle,
    title: 'Écrivez-nous sur WhatsApp',
    description: 'Indiquez votre numéro de compte sur la plateforme de paris (1xBet, Melbet, Betwinner...).',
  },
  {
    icon: Wallet,
    title: 'Effectuez le dépôt',
    description: 'Envoyez le montant souhaité sur notre compte mobile money.',
  },
  {
    icon: Camera,
    title: 'Envoyez la preuve',
    description: 'Une capture d\'écran de la transaction, et votre dépôt est crédité.',
  },
]

export function HowItWorksSection() {
  const [mode, setMode] = useState<'agence' | 'whatsapp'>('agence')
  const steps = mode === 'agence' ? AGENCY_STEPS : WHATSAPP_STEPS

  return (
    <section id="comment-ca-marche" className="px-6 py-16 md:py-20 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-text">Comment ça marche</h2>
        <p className="text-muted mt-2">En agence ou à distance, en quelques minutes</p>

        <div className="inline-flex bg-background rounded-xl p-1 mt-6">
          {(['agence', 'whatsapp'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2.5 rounded-lg text-sm font-display font-semibold transition-all ${
                mode === m ? 'bg-primary text-white shadow' : 'text-muted'
              }`}
            >
              {m === 'agence' ? 'En agence' : 'Par WhatsApp'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={step.title} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="text-primary" size={28} />
              </div>
              <div className="font-display text-secondary font-bold text-sm mb-1">Étape {i + 1}</div>
              <h3 className="font-display font-bold text-text text-lg mb-2">{step.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{step.description}</p>
            </div>
          )
        })}
      </div>

      {mode === 'whatsapp' && (
        <p className="text-muted text-xs text-center mt-8 bg-background rounded-xl py-3 px-4 max-w-md mx-auto">
          Procédure de dépôt à titre indicatif, à confirmer. La procédure de retrait par WhatsApp sera ajoutée une fois définie.
        </p>
      )}
    </section>
  )
}