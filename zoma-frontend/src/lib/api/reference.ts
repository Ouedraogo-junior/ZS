// src/lib/api/reference.ts
//
// Listes configurables (CDC section 13/14) : réseaux mobile money,
// plateformes de paris. Accessibles à tout principal authentifié.

import { apiFetch } from './client'

export interface ReferenceItem {
  id: number
  nom: string
}

export function getReseauxMobileMoney(): Promise<ReferenceItem[]> {
  return apiFetch('/reference/reseaux-mobile-money')
}

/** Public — aucune authentification requise (page vitrine). */
export function getPublicReseauxMobileMoney(): Promise<ReferenceItem[]> {
  return apiFetch('/reseaux-mobile-money')
}

export function getPlateformesParis(): Promise<ReferenceItem[]> {
  return apiFetch('/reference/plateformes-paris')
}

/** Public — aucune authentification requise (page vitrine). */
export function getPublicPlateformesParis(): Promise<ReferenceItem[]> {
  return apiFetch('/plateformes-paris')
}

export interface Agence {
  id: number
  nom: string
  ville: string
  adresse?: string
  telephone?: string | null
}

/** Utile pour les formulaires admin (rattacher un gérant/agent à une agence). */
export function getAgences(): Promise<Agence[]> {
  return apiFetch('/reference/agences')
}

/** Public — aucune authentification requise (page vitrine). */
export function getPublicAgences(): Promise<Agence[]> {
  return apiFetch('/agences')
}