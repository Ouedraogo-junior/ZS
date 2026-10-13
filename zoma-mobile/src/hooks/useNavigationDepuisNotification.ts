// src/hooks/useNavigationDepuisNotification.ts
//
// Un appui sur une notification ouvre directement la demande concernée —
// y compris quand l'appli était fermée (démarrage à froid) : dans ce cas
// on attend que la session soit restaurée et que la navigation soit prête.
import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import { useAuth } from './useAuth'
import { ouvrirEcran } from '../navigation/navigationRef'

export function useNavigationDepuisNotification(navigationPrete: boolean) {
  const { state } = useAuth()
  const reponse = Notifications.useLastNotificationResponse()
  // Évite de rouvrir la même demande à chaque rendu.
  const dejaTraitee = useRef<string | null>(null)

  useEffect(() => {
    if (!reponse || !navigationPrete) return
    if (state.status !== 'client' && state.status !== 'staff') return

    const identifiant = reponse.notification.request.identifier
    if (dejaTraitee.current === identifiant) return
    dejaTraitee.current = identifiant

    const donnees = reponse.notification.request.content.data as { demande_id?: unknown; pour?: unknown }
    if (typeof donnees.demande_id !== 'number') return
    const demandeId = donnees.demande_id

    // Notification destinée à l'autre type de compte (le téléphone a changé
    // de propriétaire entre-temps) : on ne l'ouvre pas.
    if (state.status === 'client') {
      if (donnees.pour === 'personnel') return
      ouvrirEcran('MesDemandes', 'DemandeDetail', { demandeId })
    } else if (state.role === 'agent' || state.role === 'gerant') {
      if (donnees.pour === 'client') return
      ouvrirEcran('Demandes', 'AgentDemandeDetail', { demandeId })
    }
  }, [reponse, navigationPrete, state])
}