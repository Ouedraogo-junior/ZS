// src/lib/api/transactions.ts

import { apiFetch } from './client'
import type { ReferenceItem } from './reference'

export interface Transaction {
  id: number
  type: 'depot' | 'retrait'
  montant: number
  telephone_client: string
  reference_paiement: string | null
  reseau_mobile_money: ReferenceItem
  plateforme_paris: ReferenceItem
  created_at: string
}

export interface NewTransactionInput {
  type: 'depot' | 'retrait'
  reseau_mobile_money_id: number
  plateforme_paris_id: number
  montant: number
  telephone_client: string
  reference_paiement?: string
}

export function createTransaction(data: NewTransactionInput): Promise<{ transaction: Transaction }> {
  return apiFetch('/agent/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export interface PaginatedTransactions {
  data: Transaction[]
  current_page: number
  last_page: number
  total: number
}

/** Historique de l'agent connecté uniquement (CDC section 9). */
export function getTransactions(params?: { type?: 'depot' | 'retrait' }): Promise<PaginatedTransactions> {
  const query = new URLSearchParams({ per_page: '100' })
  if (params?.type) query.set('type', params.type)
  return apiFetch(`/agent/transactions?${query.toString()}`)
}