// src/lib/api/transactions.ts
//
// Côté agent — saisie directe (guichet) et historique PERSONNEL
// uniquement (TransactionController::index ne renvoie que les
// transactions de l'agent connecté, jamais celles de toute l'agence).
import { apiFetch } from './client'
import type { ReferenceItem } from './reference'

export interface Transaction {
  id: number
  agence_id: number
  agent_id: number
  type: 'depot' | 'retrait'
  reseau_mobile_money_id: number
  plateforme_paris_id: number
  montant: number
  telephone_client: string
  reference_paiement: string | null
  created_at: string
  reseau_mobile_money: ReferenceItem
  plateforme_paris: ReferenceItem
  /** Présent uniquement si cette transaction vient d'une demande validée (absent pour une saisie directe). */
  demande?: { id: number } | null
}

export interface NewTransactionInput {
  type: 'depot' | 'retrait'
  reseau_mobile_money_id: number
  plateforme_paris_id: number
  montant: number
  telephone_client: string
  reference_paiement?: string
}

/** store() renvoie { transaction: {...} } — encapsulé, pas l'objet direct. */
export async function submitTransaction(input: NewTransactionInput): Promise<Transaction> {
  const data = await apiFetch<{ transaction: Transaction }>('/agent/transactions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return data.transaction
}

export interface TransactionsFilters {
  type?: 'depot' | 'retrait'
  reseau_mobile_money_id?: number
  plateforme_paris_id?: number
  du?: string
  au?: string
  page?: number
}

/** index() renvoie la pagination Laravel standard, sans enveloppe. */
export interface PaginatedTransactions {
  data: Transaction[]
  current_page: number
  last_page: number
  total: number
}

export function getTransactions(filters: TransactionsFilters = {}): Promise<PaginatedTransactions> {
  const query = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value))
  })
  const qs = query.toString()
  return apiFetch(`/agent/transactions${qs ? `?${qs}` : ''}`)
}