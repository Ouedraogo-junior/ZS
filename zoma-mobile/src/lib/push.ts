// src/lib/push.ts
//
// Notifications sur le téléphone, pour prévenir quand l'appli est fermée :
// une nouvelle demande pour l'agent, une validation ou une réponse pour le
// client. Le téléphone s'identifie auprès d'Expo (qui relaie vers Firebase,
// donc Android), puis donne son "jeton" à notre serveur, qui s'en servira
// pour lui écrire (voir App\Support\Push côté Laravel).
//
// Comme le temps réel, c'est un CONFORT : si quelque chose manque
// (autorisation refusée, appli lancée dans Expo Go, pas de réseau), on
// abandonne en silence et l'appli marche comme avant.
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { apiFetch } from './api/client'

// Appli ouverte : on affiche quand même la bannière (un agent qui regarde
// une autre page veut savoir qu'une demande vient d'arriver).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

let jetonEnregistre: string | null = null

/**
 * À appeler après une connexion réussie (et au redémarrage, quand la
 * session est restaurée). Demande l'autorisation d'afficher des
 * notifications la première fois.
 */
export async function enregistrerAppareilPush(): Promise<void> {
  try {
    // Un émulateur n'a pas de vrai service de notifications.
    if (!Device.isDevice) return

    if (Platform.OS === 'android') {
      // Sur Android 8+, tout passe par un "canal" : c'est lui qui règle le
      // son et la vibration. Doit exister avant la première notification.
      await Notifications.setNotificationChannelAsync('default', {
        name: 'ZOMA SERVICES',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0B3D91',
      })
    }

    const { status: statutActuel } = await Notifications.getPermissionsAsync()
    const statut = statutActuel === 'granted' ? statutActuel : (await Notifications.requestPermissionsAsync()).status
    if (statut !== 'granted') return

    // Identifiant du projet chez Expo, écrit dans app.json par `eas init`.
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
    if (!projectId) {
      if (__DEV__) console.warn('[push] projectId introuvable : lancez `eas init` dans le projet.')
      return
    }

    const { data: jeton } = await Notifications.getExpoPushTokenAsync({ projectId })
    jetonEnregistre = jeton

    await apiFetch('/push-token', {
      method: 'POST',
      body: JSON.stringify({ token: jeton, plateforme: Platform.OS }),
    })
    if (__DEV__) console.log('[push] appareil enregistré')
  } catch (erreur) {
    if (__DEV__) console.warn('[push] enregistrement impossible', erreur)
  }
}

/**
 * À appeler AVANT la déconnexion (il faut encore le token de connexion
 * pour que le serveur accepte la demande). Ce téléphone ne reçoit alors
 * plus rien pour ce compte. N'attend jamais plus de 3 secondes : une
 * déconnexion ne doit pas rester bloquée faute de réseau.
 */
export async function desenregistrerAppareilPush(): Promise<void> {
  const jeton = jetonEnregistre
  if (!jeton) return
  jetonEnregistre = null

  try {
    await Promise.race([
      apiFetch('/push-token', { method: 'DELETE', body: JSON.stringify({ token: jeton }) }),
      new Promise<void>(resolve => setTimeout(() => resolve(), 3000)),
    ])
  } catch {
    // Pas de réseau : au pire, le serveur réattribuera ce jeton à la
    // prochaine personne qui se connecte sur ce téléphone.
  }
}