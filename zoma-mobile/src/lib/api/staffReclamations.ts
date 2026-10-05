// src/lib/api/staffReclamations.ts
//
// Pas d'endpoint public pour qu'un client ajoute un message à une
// réclamation existante (seule la soumission initiale lui appartient) —
// ce fil est donc des notes internes côté staff, pas une discussion à
// deux comme pour les demandes.
import { apiFetch } from './client'

export interface ReclamationMessage {
  id: number
  auteur_type: 'client' | 'staff'
  auteur_id: number | null
  auteur?: { id: number; nom: string } | null
  message: string
  created_at: string
}

export type ReclamationStatut = 'nouveau' | 'en_cours' | 'resolu'

export interface Reclamation {
  id: number
  nom_client: string
  contact_client: string
  description: string
  reference_transaction: string | null
  agence_id: number | null
  agence?: { id: number; nom: string } | null
  assigne_a_id: number | null
  assigne_a?: { id: number; nom: string } | null
  statut: ReclamationStatut
  created_at: string
  updated_at: string
  messages?: ReclamationMessage[]
}

export function getReclamations(): Promise<Reclamation[]> {
  return apiFetch('/staff/reclamations')
}

export function getReclamation(id: number): Promise<Reclamation> {
  return apiFetch(`/staff/reclamations/${id}`)
}

export function prendreEnCharge(id: number): Promise<Reclamation> {
  return apiFetch(`/staff/reclamations/${id}/prendre-en-charge`, { method: 'POST' })
}

export function updateReclamationStatut(id: number, statut: ReclamationStatut): Promise<Reclamation> {
  return apiFetch(`/staff/reclamations/${id}/statut`, {
    method: 'PATCH',
    body: JSON.stringify({ statut }),
  })
}

export function sendReclamationMessage(id: number, message: string): Promise<ReclamationMessage> {
  return apiFetch(`/staff/reclamations/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}