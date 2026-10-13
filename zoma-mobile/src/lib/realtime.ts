// src/lib/realtime.ts
//
// Connexion temps réel (Reverb, protocole Pusher) : le serveur "pousse"
// un événement dès qu'une demande arrive, est validée, ou qu'un message
// est posté — les écrans se mettent à jour sans que l'utilisateur ait à
// tirer vers le bas.
//
// Le temps réel est un CONFORT, jamais une dépendance : si la connexion
// échoue (pas de réseau, serveur arrêté, clé non renseignée), rien ne
// plante et les écrans continuent de se recharger à l'ouverture et par
// tirage vers le bas, comme avant. Les événements ne servent donc qu'à
// dire « quelque chose a changé » : les écrans rechargent alors leurs
// données depuis l'API plutôt que de se fier au contenu de l'événement.
import { AppState } from 'react-native'
import Pusher, { type Channel } from 'pusher-js'
import { getToken } from './storage'
import { ORIGINE_API, REVERB_ACTIF, REVERB_APP_KEY, REVERB_HOTE, REVERB_PORT, REVERB_TLS } from './realtimeConfig'

export type Gestionnaire = (donnees: unknown) => void
export type Evenements = Record<string, Gestionnaire>

interface Abonnement {
  canal: Channel
  nombre: number
}

let client: Pusher | null = null
let dejaConnecte = false
let ecouteAppState: { remove: () => void } | null = null
const abonnements = new Map<string, Abonnement>()
const ecouteursResync = new Set<() => void>()

/** Dit à tous les écrans abonnés de se recharger (retour au premier plan, reconnexion). */
function notifierResync() {
  ecouteursResync.forEach(rappel => {
    try {
      rappel()
    } catch {
      // Un écran défaillant ne doit pas empêcher les autres de se recharger.
    }
  })
}

function obtenirClient(): Pusher | null {
  if (!REVERB_ACTIF) return null
  if (client) return client

  const pusher = new Pusher(REVERB_APP_KEY, {
    cluster: 'mt1', // exigé par les types, sans effet : on fournit wsHost
    wsHost: REVERB_HOTE,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: REVERB_TLS,
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    channelAuthorization: {
      endpoint: `${ORIGINE_API}/broadcasting/auth`,
      transport: 'ajax',
      // Le token Sanctum vit dans SecureStore (asynchrone) : on fait nous-mêmes
      // la requête d'autorisation, avec le token du moment.
      customHandler: ({ socketId, channelName }, rappel) => {
        ;(async () => {
          const token = await getToken()
          const reponse = await fetch(`${ORIGINE_API}/broadcasting/auth`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ socket_id: socketId, channel_name: channelName }),
          })
          if (!reponse.ok) throw new Error(`Autorisation du canal refusée (HTTP ${reponse.status})`)
          rappel(null, (await reponse.json()) as { auth: string })
        })().catch(erreur => rappel(erreur instanceof Error ? erreur : new Error(String(erreur)), null))
      },
    },
  })

  pusher.connection.bind('state_change', (etats: { previous: string; current: string }) => {
    if (__DEV__) console.log(`[temps réel] ${etats.previous} → ${etats.current}`)
    if (etats.current === 'connected') {
      // Après une coupure, des événements ont pu être manqués : on recharge.
      // La toute première connexion n'a rien manqué.
      if (dejaConnecte) notifierResync()
      dejaConnecte = true
    }
  })
  pusher.connection.bind('error', (erreur: unknown) => {
    if (__DEV__) console.warn('[temps réel] erreur de connexion', erreur)
  })

  // Une appli en arrière-plan voit sa connexion coupée par le système :
  // au retour au premier plan, on recharge sans attendre la reconnexion.
  ecouteAppState = AppState.addEventListener('change', etat => {
    if (etat === 'active') notifierResync()
  })

  client = pusher
  return pusher
}

/**
 * Écoute des événements sur un canal privé (ex. "agence.3.demandes").
 * Renvoie la fonction qui arrête l'écoute. Plusieurs écrans peuvent
 * écouter le même canal : il n'est quitté que quand le dernier s'en va.
 */
export function ecouter(nomCanal: string, evenements: Evenements): () => void {
  const pusher = obtenirClient()
  if (!pusher) return () => {}

  const nomComplet = `private-${nomCanal}`
  let abonnement = abonnements.get(nomComplet)

  if (!abonnement) {
    const canal = pusher.subscribe(nomComplet)
    canal.bind('pusher:subscription_error', (erreur: unknown) => {
      if (__DEV__) console.warn(`[temps réel] accès refusé à ${nomComplet}`, erreur)
    })
    abonnement = { canal, nombre: 0 }
    abonnements.set(nomComplet, abonnement)
  }

  abonnement.nombre += 1
  const { canal } = abonnement
  Object.entries(evenements).forEach(([nom, gestionnaire]) => canal.bind(nom, gestionnaire))

  return () => {
    Object.entries(evenements).forEach(([nom, gestionnaire]) => canal.unbind(nom, gestionnaire))

    const courant = abonnements.get(nomComplet)
    // Absent ou différent : la session a été fermée (fermerTempsReel) entre-temps.
    if (!courant || courant.canal !== canal) return

    courant.nombre -= 1
    if (courant.nombre <= 0) {
      abonnements.delete(nomComplet)
      client?.unsubscribe(nomComplet)
    }
  }
}

/** Demande à être prévenu quand il faut tout recharger (reconnexion, retour au premier plan). */
export function surResync(rappel: () => void): () => void {
  ecouteursResync.add(rappel)
  return () => {
    ecouteursResync.delete(rappel)
  }
}

/** À appeler à la déconnexion : coupe tout, pour que le compte suivant reparte de zéro. */
export function fermerTempsReel() {
  ecouteAppState?.remove()
  ecouteAppState = null
  abonnements.clear()
  client?.disconnect()
  client = null
  dejaConnecte = false
}

/** Un événement "demande.validee" concerne-t-il cette demande ? */
export function concerneDemande(donnees: unknown, demandeId: number): boolean {
  return (
    typeof donnees === 'object' &&
    donnees !== null &&
    'demande_id' in donnees &&
    (donnees as { demande_id: unknown }).demande_id === demandeId
  )
}