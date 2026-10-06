// src/lib/api/demandes.ts
//
// Côté client — soumission, suivi, fil de messages. Les clés des
// relations chargées (agence, reseau_mobile_money, plateforme_paris)
// sont en snake_case : Eloquent convertit automatiquement les noms de
// relation camelCase en snake_case au sérialising JSON.
import { apiFetch } from './client'
import type { ReferenceItem } from './reference'

export interface DemandeMessage {
  id: number
  demande_transaction_id: number
  auteur_type: 'client' | 'agent' | 'gerant'
  auteur_id: number
  /** Texte du message — absent pour une note vocale seule. */
  message: string | null
  /** Vrai si le message contient une note vocale (le fichier se récupère via une route authentifiée). */
  has_audio: boolean
  /** Durée de la note vocale en secondes, pour l'affichage. */
  audio_duree: number | null
  created_at: string
}

export interface Demande {
  id: number
  client_id: number
  agence_id: number
  type: 'depot' | 'retrait'
  reseau_mobile_money_id: number
  plateforme_paris_id: number
  montant: number
  /** ID tapé par le client — absent s'il a joint une capture à la place. */
  id_bookmaker: string | null
  /** Présent si le client a joint une capture de son compte au lieu de taper l'ID. */
  id_bookmaker_capture: string | null
  telephone_mobile_money: string | null
  preuve_paiement: string | null
  statut: 'en_attente' | 'validee'
  agent_id: number | null
  transaction_id: number | null
  created_at: string
  updated_at: string
  agence: ReferenceItem
  reseau_mobile_money: ReferenceItem
  plateforme_paris: ReferenceItem
  messages?: DemandeMessage[]
}

export interface NewDemandeInput {
  agence_id: number
  type: 'depot' | 'retrait'
  reseau_mobile_money_id: number
  plateforme_paris_id: number
  montant: number
  /** ID tapé — au moins l'un de id_bookmaker / idCaptureUri est exigé. */
  id_bookmaker?: string
  /** URI locale d'une capture de l'ID bookmaker, pour un client qui ne sait pas écrire. */
  idCaptureUri?: string
  telephone_mobile_money?: string
  /** URI locale de l'image choisie (expo-image-picker) — dépôt uniquement. */
  preuveUri?: string
}

/**
 * Ajoute un fichier image à un FormData. React Native attend la forme
 * { uri, name, type } (différente de l'objet File du web), d'où le
 * @ts-expect-error — nécessaire parce que le type DOM de FormData ne
 * connaît pas cette forme.
 */
function ajouterImage(form: FormData, champ: string, uri: string, nomParDefaut: string) {
  const nom = uri.split('/').pop() ?? nomParDefaut
  const ext = /\.(\w+)$/.exec(nom)?.[1]?.toLowerCase() ?? 'jpg'
  const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`
  // @ts-expect-error forme RN spécifique pour un fichier dans FormData
  form.append(champ, { uri, name: nom, type })
}

export async function submitDemande(input: NewDemandeInput): Promise<Demande> {
  const form = new FormData()
  form.append('agence_id', String(input.agence_id))
  form.append('type', input.type)
  form.append('reseau_mobile_money_id', String(input.reseau_mobile_money_id))
  form.append('plateforme_paris_id', String(input.plateforme_paris_id))
  form.append('montant', String(input.montant))

  if (input.id_bookmaker) {
    form.append('id_bookmaker', input.id_bookmaker)
  }

  if (input.idCaptureUri) {
    ajouterImage(form, 'id_bookmaker_capture', input.idCaptureUri, 'id.jpg')
  }

  if (input.telephone_mobile_money) {
    form.append('telephone_mobile_money', input.telephone_mobile_money)
  }

  if (input.preuveUri) {
    ajouterImage(form, 'preuve', input.preuveUri, 'preuve.jpg')
  }

  return apiFetch<Demande>('/client/demandes', { method: 'POST', body: form })
}

export function getDemandes(): Promise<Demande[]> {
  return apiFetch('/client/demandes')
}

export function getDemande(id: number): Promise<Demande> {
  return apiFetch(`/client/demandes/${id}`)
}

export function sendDemandeMessage(id: number, message: string): Promise<DemandeMessage> {
  return apiFetch(`/client/demandes/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}