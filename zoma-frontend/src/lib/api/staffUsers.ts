// src/lib/api/staffUsers.ts
//
// Gestion des gérants/admins — réservé à l'admin (CDC section 9).

import { apiFetch } from './client'

export interface StaffUser {
  id: number
  nom: string
  pseudo: string
  role: 'gerant' | 'admin'
  agence_id: number | null
  agence: { id: number; nom: string } | null
  statut: 'active' | 'inactive'
  last_login_at: string | null
  created_at: string
}

export function getStaffUsers(): Promise<StaffUser[]> {
  return apiFetch('/admin/users')
}

export interface NewStaffUserInput {
  nom: string
  pseudo: string
  pin: string
  role: 'gerant' | 'admin'
  /** Requis si role = 'gerant', absent si role = 'admin'. */
  agence_id?: number
}

export function createStaffUser(data: NewStaffUserInput): Promise<StaffUser> {
  return apiFetch('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateStaffUserStatut(userId: number, statut: 'active' | 'inactive'): Promise<StaffUser> {
  return apiFetch(`/admin/users/${userId}/statut`, {
    method: 'PATCH',
    body: JSON.stringify({ statut }),
  })
}

export function resetStaffUserPin(userId: number, pin: string): Promise<{ message: string }> {
  return apiFetch(`/admin/users/${userId}/reinitialiser-pin`, {
    method: 'POST',
    body: JSON.stringify({ pin }),
  })
}