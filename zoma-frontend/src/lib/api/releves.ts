// src/lib/api/releves.ts

import { apiFetch } from './client'

export interface ReleveNetworkPreparation {
  reseau_mobile_money_id: number
  reseau: string
  periode_debut: string
  periode_fin: string
  depots: number
  retraits: number
  solde_theorique: number
}

export function prepareReleve(): Promise<{ reseaux: ReleveNetworkPreparation[] }> {
  return apiFetch('/agent/releves/preparation')
}

export interface Releve {
  id: number
  reseau_mobile_money: { id: number; nom: string }
  solde_theorique: number
  solde_reel: number
  ecart: number
}

export interface NewReleveInput {
  soldes: { reseau_mobile_money_id: number; solde_reel: number }[]
}

export function submitReleve(data: NewReleveInput): Promise<{ releves: Releve[] }> {
  return apiFetch('/agent/releves', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}