// src/lib/api/reference.ts
//
// Données de référence publiques — mêmes endpoints que le site web
// (/agences, /reseaux-mobile-money, /plateformes-paris), aucune
// authentification requise.
import { apiFetch } from './client'

export interface ReferenceItem {
  id: number
  nom: string
}

export interface Agence {
  id: number
  nom: string
  adresse: string
  ville: string
  telephone: string | null
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