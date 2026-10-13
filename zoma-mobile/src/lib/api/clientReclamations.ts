// src/lib/api/clientReclamations.ts
//
// Réclamations du client connecté. Le nom et le numéro ne sont pas envoyés :
// le serveur les prend sur le compte. Le traitement (prise en charge,
// résolution) est fait par le gérant — voir staffReclamations.
import { apiFetch } from './client'
import type { ReclamationStatut } from './staffReclamations'

export interface MaReclamation {
  id: number
  agence_id: number | null
  agence?: { id: number; nom: string } | null
  /** Absente quand le client a fait sa réclamation uniquement à la voix. */
  description: string | null
  /** Vrai si le client a enregistré une note vocale (fichier servi par /client/reclamations/{id}/audio). */
  has_audio: boolean
  audio_duree: number | null
  /** Renseignée par le serveur quand la réclamation vise une demande (ex. « Demande n°12 »). */
  reference_transaction: string | null
  statut: ReclamationStatut
  created_at: string
  updated_at: string
}

export interface NouvelleReclamationInput {
  /** Texte et/ou note vocale : au moins l'un des deux. */
  description?: string
  audio?: { uri: string; dureeSecondes: number }
  /** Réclamation sur une demande précise : l'agence en découle. */
  demande_id?: number
  /** Sinon, l'agence concernée est obligatoire. */
  agence_id?: number
}

export function getMesReclamations(): Promise<MaReclamation[]> {
  return apiFetch('/client/reclamations')
}

/** Envoi en multipart (comme les images), car il peut contenir un fichier audio. */
export function envoyerReclamation(input: NouvelleReclamationInput): Promise<MaReclamation> {
  const form = new FormData()
  if (input.description) form.append('description', input.description)
  if (input.demande_id !== undefined) form.append('demande_id', String(input.demande_id))
  if (input.agence_id !== undefined) form.append('agence_id', String(input.agence_id))

  if (input.audio) {
    const ext = /\.(\w+)$/.exec(input.audio.uri)?.[1]?.toLowerCase() ?? 'm4a'
    // Forme { uri, name, type } attendue par React Native pour un fichier
    // dans un FormData — d'où le @ts-expect-error (même raison que pour
    // les notes vocales des demandes, voir messagesAudio.ts).
    // @ts-expect-error forme RN spécifique pour un fichier dans FormData
    form.append('audio', { uri: input.audio.uri, name: `note.${ext}`, type: ext === 'm4a' ? 'audio/mp4' : `audio/${ext}` })
    form.append('audio_duree', String(input.audio.dureeSecondes))
  }

  return apiFetch('/client/reclamations', { method: 'POST', body: form })
}