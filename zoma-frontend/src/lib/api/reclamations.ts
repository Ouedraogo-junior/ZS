// src/lib/api/reclamations.ts

import { apiFetch } from './client'

export type ReclamationStatut = 'nouveau' | 'en_cours' | 'resolu'

export interface Reclamation {
  id: number
  nom_client: string
  contact_client: string
  description: string
  reference_transaction: string | null
  statut: ReclamationStatut
  agence: { id: number; nom: string } | null
  assigne_a: { id: number; nom: string } | null
  created_at: string
}

export interface ReclamationMessage {
  id: number
  auteur_type: 'client' | 'staff'
  auteur: { id: number; nom: string } | null
  message: string
  created_at: string
}

export interface ReclamationDetail extends Reclamation {
  messages: ReclamationMessage[]
}

export function getReclamations(): Promise<Reclamation[]> {
  return apiFetch('/staff/reclamations')
}

export interface NewReclamationInput {
  nom_client: string
  contact_client: string
  description: string
  reference_transaction?: string
  agence_id?: number
}

/** Public — aucune authentification requise. */
export function submitReclamation(data: NewReclamationInput): Promise<Reclamation> {
  return apiFetch('/reclamations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getReclamation(id: number): Promise<ReclamationDetail> {
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