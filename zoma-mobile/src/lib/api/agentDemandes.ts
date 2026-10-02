// src/lib/api/agentDemandes.ts
//
// Traitement des demandes côté agent — scopées à sa propre agence
// (voir AgentDemandeController). Pas de rejet : en cas de souci, le
// fil de messages sert à échanger plutôt qu'un statut "rejetée".
import { apiFetch } from './client'
import { getToken } from '../storage'
import { API_BASE_URL } from '../config'
import type { Demande, DemandeMessage } from './demandes'

export interface AgentDemande extends Omit<Demande, 'client_id'> {
  client: { id: number; nom: string; telephone: string }
}

export function getAgentDemandes(statut?: 'en_attente' | 'validee'): Promise<AgentDemande[]> {
  const qs = statut ? `?statut=${statut}` : ''
  return apiFetch(`/agent/demandes${qs}`)
}

export function getAgentDemande(id: number): Promise<AgentDemande> {
  return apiFetch(`/agent/demandes/${id}`)
}

export function validerDemande(id: number): Promise<{ demande: AgentDemande; transaction: unknown }> {
  return apiFetch(`/agent/demandes/${id}/valider`, { method: 'POST' })
}

export function sendAgentDemandeMessage(id: number, message: string): Promise<DemandeMessage> {
  return apiFetch(`/agent/demandes/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

/**
 * La preuve de paiement est servie par une route authentifiée (jamais
 * une URL publique) — le composant Image de React Native sait passer
 * des en-têtes personnalisés, donc on lui fournit directement le token.
 */
export async function getPreuveImageSource(demandeId: number): Promise<{ uri: string; headers: Record<string, string> }> {
  const token = await getToken()
  return {
    uri: `${API_BASE_URL}/agent/demandes/${demandeId}/preuve`,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }
}