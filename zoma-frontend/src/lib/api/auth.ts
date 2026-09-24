// src/lib/api/auth.ts
//
// Connexion unique pour tout le monde (agents, gérants, administrateurs) —
// un seul formulaire pseudo+PIN, le backend (AuthController) détermine le
// rôle et le frontend aiguille vers le bon espace en conséquence.

import { apiFetch } from './client'

export interface Session {
  token: string
  role: 'agent' | 'gerant' | 'admin'
  profile: {
    id: number
    nom: string
    pseudo: string
    agence_id: number | null
    agence: string | null
  }
}

export function login(pseudo: string, pin: string): Promise<Session> {
  return apiFetch<Session>('/login', {
    method: 'POST',
    body: JSON.stringify({ pseudo, pin }),
  })
}

export function logout(): Promise<{ message: string }> {
  return apiFetch('/logout', { method: 'POST' })
}

/** Restaure la session à partir du token stocké (après rechargement de page). */
export function me(): Promise<Omit<Session, 'token'>> {
  return apiFetch('/me')
}

export interface UpdateProfileInput {
  nom: string
  pseudo: string
  /** Omis si l'utilisateur ne change pas son PIN. */
  pin?: string
  /** Requis si "pin" est fourni — vérifie l'identité avant de changer le PIN. */
  pin_actuel?: string
}

/** Modification de son propre profil (nom, pseudo, PIN) — tous rôles confondus. */
export function updateProfile(data: UpdateProfileInput): Promise<Omit<Session, 'token'>> {
  return apiFetch('/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}