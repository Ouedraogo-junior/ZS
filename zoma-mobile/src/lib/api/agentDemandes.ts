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
 * une URL publique). Les en-têtes personnalisés passés directement au
 * composant Image sont peu fiables selon les plateformes (surtout iOS) —
 * on télécharge donc l'image nous-mêmes via une requête authentifiée
 * classique, puis on la convertit en URI de données (base64), que
 * n'importe quel composant Image affiche sans aucune configuration
 * particulière.
 */
export async function fetchPreuveImageDataUri(demandeId: number): Promise<string> {
  const token = await getToken()
  const response = await fetch(`${API_BASE_URL}/agent/demandes/${demandeId}/preuve`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    throw new Error("Impossible de charger la preuve de paiement.")
  }

  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}