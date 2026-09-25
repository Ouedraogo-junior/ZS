// src/lib/api/avis.ts
//
// Avis clients — soumission publique (formulaire du site vitrine, à
// construire) + modération admin.

import { apiFetch } from './client'

export interface Avis {
  id: number
  nom_client: string
  note: number
  commentaire: string | null
  agence: { id: number; nom: string } | null
  created_at: string
}

export interface NewAvisInput {
  nom_client: string
  note: number
  commentaire?: string
  agence_id?: number
}

/** Public — aucune authentification requise. */
export function submitAvis(data: NewAvisInput): Promise<Avis> {
  return apiFetch('/avis', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** Réservé à l'admin. */
export function getAvisList(): Promise<Avis[]> {
  return apiFetch('/admin/avis')
}

/** Public — aucune authentification requise (page vitrine). */
export function getPublicAvis(): Promise<Avis[]> {
  return apiFetch('/avis')
}

/** Réservé à l'admin. */
export function deleteAvis(avisId: number): Promise<{ message: string }> {
  return apiFetch(`/admin/avis/${avisId}`, { method: 'DELETE' })
}