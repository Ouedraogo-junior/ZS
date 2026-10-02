// src/lib/api/staffAuth.ts
//
// Réutilise /login, /me, /logout tels quels — mêmes endpoints que le
// web pour agent/gérant/admin (pseudo + PIN). Côté appli mobile, seuls
// agent et gérant ont un vrai espace construit ; admin reste sur le
// backoffice web (décision du fil "application native").
import { apiFetch } from './client'
import { setSession, clearSession } from '../storage'

export type StaffRole = 'agent' | 'gerant' | 'admin'

export interface StaffProfile {
  id: number
  nom: string
  pseudo: string
  agence_id: number | null
  agence?: string | null
}

interface LoginResponse {
  token: string
  role: StaffRole
  profile: StaffProfile
}

export async function loginStaff(pseudo: string, pin: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ pseudo, pin }),
  })
  await setSession(data.token, 'staff')
  return data
}

/** Restaure la session au redémarrage de l'appli, à partir du token stocké. */
export async function getStaffMe(): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/me')
}

export async function logoutStaff(): Promise<void> {
  try {
    await apiFetch('/logout', { method: 'POST' })
  } finally {
    await clearSession()
  }
}