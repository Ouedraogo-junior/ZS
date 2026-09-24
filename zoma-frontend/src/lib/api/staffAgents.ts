// src/lib/api/staffAgents.ts
//
// Gestion des agents par un gérant (son agence) ou un admin (n'importe
// laquelle). CDC section 9.

import { apiFetch } from './client'

export interface StaffAgent {
  id: number
  agence_id: number
  agence: { id: number; nom: string } | null
  nom: string
  pseudo: string
  statut: 'active' | 'inactive'
  last_login_at: string | null
  created_at: string
}

export function getStaffAgents(): Promise<StaffAgent[]> {
  return apiFetch('/staff/agents')
}

export interface NewAgentInput {
  nom: string
  pseudo: string
  pin: string
  /** Requis si créé par un admin (le gérant, lui, crée toujours pour sa propre agence). */
  agence_id?: number
}

export function createStaffAgent(data: NewAgentInput): Promise<StaffAgent> {
  return apiFetch('/staff/agents', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateAgentStatut(agentId: number, statut: 'active' | 'inactive'): Promise<StaffAgent> {
  return apiFetch(`/staff/agents/${agentId}/statut`, {
    method: 'PATCH',
    body: JSON.stringify({ statut }),
  })
}

export function resetAgentPin(agentId: number, pin: string): Promise<{ message: string }> {
  return apiFetch(`/staff/agents/${agentId}/reinitialiser-pin`, {
    method: 'POST',
    body: JSON.stringify({ pin }),
  })
}