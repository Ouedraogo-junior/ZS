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