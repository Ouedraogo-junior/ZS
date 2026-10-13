// src/lib/api/config.ts
//
// CRUD admin sur les listes configurables (CDC section 13/14) : agences,
// réseaux mobile money, plateformes de paris.

import { apiFetch } from './client'

export interface AgenceConfig {
  id: number
  nom: string
  adresse: string
  ville: string
  telephone: string | null
  /** URL publique de la photo de l'agence, ou null s'il n'y en a pas. */
  photo_url: string | null
  statut: 'active' | 'inactive'
}

export interface NewAgenceInput {
  nom: string
  adresse: string
  ville: string
  telephone?: string
}

export function getAgencesConfig(): Promise<AgenceConfig[]> {
  return apiFetch('/admin/agences')
}

export function createAgence(data: NewAgenceInput): Promise<AgenceConfig> {
  return apiFetch('/admin/agences', { method: 'POST', body: JSON.stringify(data) })
}

export function updateAgence(id: number, data: NewAgenceInput): Promise<AgenceConfig> {
  return apiFetch(`/admin/agences/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function updateAgenceStatut(id: number, statut: 'active' | 'inactive'): Promise<AgenceConfig> {
  return apiFetch(`/admin/agences/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut }) })
}

export interface ConfigItem {
  id: number
  nom: string
  /** URL publique du logo, ou null s'il n'y en a pas. */
  logo_url: string | null
  statut: 'actif' | 'inactif'
}

export function getReseauxConfig(): Promise<ConfigItem[]> {
  return apiFetch('/admin/reseaux-mobile-money')
}

export function createReseau(nom: string): Promise<ConfigItem> {
  return apiFetch('/admin/reseaux-mobile-money', { method: 'POST', body: JSON.stringify({ nom }) })
}

export function updateReseauStatut(id: number, statut: 'actif' | 'inactif'): Promise<ConfigItem> {
  return apiFetch(`/admin/reseaux-mobile-money/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut }) })
}

export function getPlateformesConfig(): Promise<ConfigItem[]> {
  return apiFetch('/admin/plateformes-paris')
}

export function createPlateforme(nom: string): Promise<ConfigItem> {
  return apiFetch('/admin/plateformes-paris', { method: 'POST', body: JSON.stringify({ nom }) })
}

export function updatePlateformeStatut(id: number, statut: 'actif' | 'inactif'): Promise<ConfigItem> {
  return apiFetch(`/admin/plateformes-paris/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut }) })
}

// ── Images : logos des réseaux/plateformes, photo des agences ────────────
//
// Envoi en multipart (POST) : PATCH ne convient pas, PHP ne lit pas le
// corps multipart d'une requête PATCH.

function envoyerImage<T>(chemin: string, champ: 'logo' | 'photo', fichier: File): Promise<T> {
  const form = new FormData()
  form.append(champ, fichier)
  return apiFetch<T>(chemin, { method: 'POST', body: form })
}

export function uploadReseauLogo(id: number, fichier: File): Promise<ConfigItem> {
  return envoyerImage(`/admin/reseaux-mobile-money/${id}/logo`, 'logo', fichier)
}

export function deleteReseauLogo(id: number): Promise<ConfigItem> {
  return apiFetch(`/admin/reseaux-mobile-money/${id}/logo`, { method: 'DELETE' })
}

export function uploadPlateformeLogo(id: number, fichier: File): Promise<ConfigItem> {
  return envoyerImage(`/admin/plateformes-paris/${id}/logo`, 'logo', fichier)
}

export function deletePlateformeLogo(id: number): Promise<ConfigItem> {
  return apiFetch(`/admin/plateformes-paris/${id}/logo`, { method: 'DELETE' })
}

export function uploadAgencePhoto(id: number, fichier: File): Promise<AgenceConfig> {
  return envoyerImage(`/admin/agences/${id}/photo`, 'photo', fichier)
}

export function deleteAgencePhoto(id: number): Promise<AgenceConfig> {
  return apiFetch(`/admin/agences/${id}/photo`, { method: 'DELETE' })
}