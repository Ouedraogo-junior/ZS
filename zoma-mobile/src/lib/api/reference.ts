// src/lib/api/reference.ts
//
// Données de référence publiques — mêmes endpoints que le site web
// (/agences, /reseaux-mobile-money, /plateformes-paris), aucune
// authentification requise.
import { apiFetch } from './client'

export interface ReferenceItem {
  id: number
  nom: string
  /**
   * URL publique du logo (réseaux et plateformes uniquement). Absent
   * quand l'élément arrive imbriqué dans une autre réponse (ex. une
   * demande), null quand aucun logo n'a été envoyé.
   */
  logo_url?: string | null
}

export interface Agence {
  id: number
  nom: string
  adresse: string
  ville: string
  telephone: string | null
  /** URL publique de la photo de l'agence, ou null s'il n'y en a pas. */
  photo_url?: string | null
}

export function getAgences(): Promise<Agence[]> {
  return apiFetch('/agences')
}

export function getReseauxMobileMoney(): Promise<ReferenceItem[]> {
  return apiFetch('/reseaux-mobile-money')
}

export function getPlateformesParis(): Promise<ReferenceItem[]> {
  return apiFetch('/plateformes-paris')
}