// src/lib/api/clientAuth.ts
import { apiFetch } from './client'
import { setSession, clearSession } from '../storage'

export interface ClientProfile {
  id: number
  nom: string
  telephone: string
}

interface LoginResponse {
  token: string
  client: ClientProfile
}

/** Un seul appel fait office d'inscription ET de connexion (voir ClientAuthController). */
export async function loginClient(nom: string, telephone: string): Promise<ClientProfile> {
  const data = await apiFetch<LoginResponse>('/client/login', {
    method: 'POST',
    body: JSON.stringify({ nom, telephone }),
  })
  await setSession(data.token, 'client')
  return data.client
}

/** Restaure la session au redémarrage de l'appli, à partir du token stocké. */
export async function getClientMe(): Promise<ClientProfile> {
  const data = await apiFetch<{ client: ClientProfile }>('/client/me')
  return data.client
}

export async function logoutClient(): Promise<void> {
  try {
    await apiFetch('/client/logout', { method: 'POST' })
  } finally {
    await clearSession()
  }
}