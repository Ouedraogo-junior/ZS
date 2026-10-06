// src/lib/api/messagesAudio.ts
//
// Notes vocales du fil de messages d'une demande — mêmes routes que les
// messages texte, côté client ("/client") comme côté agent ("/agent"),
// gérant ("/staff") et admin ("/admin") : un seul contrôleur serveur
// pour tous (voir GereMessagesDemande).
import { apiFetch } from './client'
import { getToken } from '../storage'
import { API_BASE_URL } from '../config'
import type { DemandeMessage } from './demandes'

export type MessagesBase = '/client' | '/agent' | '/staff' | '/admin'

/** Envoie un enregistrement local comme note vocale (multipart, comme les images). */
export function envoyerNoteVocale(
  base: MessagesBase,
  demandeId: number,
  uri: string,
  dureeSecondes: number
): Promise<DemandeMessage> {
  const ext = /\.(\w+)$/.exec(uri)?.[1]?.toLowerCase() ?? 'm4a'
  const form = new FormData()
  // Forme { uri, name, type } attendue par React Native pour un fichier
  // dans un FormData — d'où le @ts-expect-error (même raison que pour
  // les images, voir ajouterImage dans demandes.ts).
  // @ts-expect-error forme RN spécifique pour un fichier dans FormData
  form.append('audio', { uri, name: `note.${ext}`, type: ext === 'm4a' ? 'audio/mp4' : `audio/${ext}` })
  form.append('audio_duree', String(dureeSecondes))

  return apiFetch<DemandeMessage>(`${base}/demandes/${demandeId}/messages`, {
    method: 'POST',
    body: form,
  })
}

/**
 * Source de lecture d'une note vocale : URL authentifiée + en-tête avec
 * le jeton. Le lecteur audio d'Expo accepte des en-têtes pour une source
 * distante (contrairement au composant Image, dont c'était peu fiable) —
 * à valider sur le téléphone.
 */
export async function sourceNoteVocale(
  base: MessagesBase,
  demandeId: number,
  messageId: number
): Promise<{ uri: string; headers: Record<string, string> }> {
  const token = await getToken()
  return {
    uri: `${API_BASE_URL}${base}/demandes/${demandeId}/messages/${messageId}/audio`,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }
}