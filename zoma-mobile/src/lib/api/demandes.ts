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
  message: string
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
  id_bookmaker: string
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
  id_bookmaker: string
  telephone_mobile_money?: string
  /** URI locale de l'image choisie (expo-image-picker) — dépôt uniquement. */
  preuveUri?: string
}

export async function submitDemande(input: NewDemandeInput): Promise<Demande> {
  const form = new FormData()
  form.append('agence_id', String(input.agence_id))
  form.append('type', input.type)
  form.append('reseau_mobile_money_id', String(input.reseau_mobile_money_id))
  form.append('plateforme_paris_id', String(input.plateforme_paris_id))
  form.append('montant', String(input.montant))
  form.append('id_bookmaker', input.id_bookmaker)

  if (input.telephone_mobile_money) {
    form.append('telephone_mobile_money', input.telephone_mobile_money)
  }

  if (input.preuveUri) {
    const filename = input.preuveUri.split('/').pop() ?? 'preuve.jpg'
    const ext = /\.(\w+)$/.exec(filename)?.[1] ?? 'jpg'
    // Forme attendue par FormData en React Native (uri/name/type),
    // différente de l'objet File du web — @ts-expect-error nécessaire.
    // @ts-expect-error forme RN spécifique pour un fichier dans FormData
    form.append('preuve', { uri: input.preuveUri, name: filename, type: `image/${ext}` })
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