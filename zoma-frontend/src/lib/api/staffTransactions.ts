// src/lib/api/staffTransactions.ts

import { apiFetch } from './client'
import type { ReferenceItem } from './reference'

export interface StaffTransaction {
  id: number
  type: 'depot' | 'retrait'
  montant: number
  telephone_client: string
  reference_paiement: string | null
  agent: { id: number; nom: string }
  agence: { id: number; nom: string }
  reseau_mobile_money: ReferenceItem
  plateforme_paris: ReferenceItem
  created_at: string
}

export interface StaffTransactionsFilters {
  agence_id?: number
  agent_id?: number
  type?: 'depot' | 'retrait'
  reseau_mobile_money_id?: number
  plateforme_paris_id?: number
  du?: string
  au?: string
  page?: number
}

export interface StaffTransactionsResult {
  data: StaffTransaction[]
  current_page: number
  last_page: number
  total: number
  totaux: { depots: number; retraits: number }
}

export function getStaffTransactions(filters: StaffTransactionsFilters = {}): Promise<StaffTransactionsResult> {
  const query = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value))
  })
  const qs = query.toString()
  return apiFetch(`/staff/transactions${qs ? `?${qs}` : ''}`)
}