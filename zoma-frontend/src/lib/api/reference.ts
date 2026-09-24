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

export function getPlateformesParis(): Promise<ReferenceItem[]> {
  return apiFetch('/reference/plateformes-paris')
}

export interface Agence {
  id: number
  nom: string
  ville: string
}

/** Utile pour les formulaires admin (rattacher un gérant/agent à une agence). */
export function getAgences(): Promise<Agence[]> {
  return apiFetch('/reference/agences')
}