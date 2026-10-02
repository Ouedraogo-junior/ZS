// src/lib/api/client.ts
//
// Équivalent mobile du client API web : mêmes principes (ApiError,
// gestion centralisée des erreurs, handler 401), adapté pour React
// Native — le token vient de SecureStore (async) au lieu du
// stockage web, et apiFetch sait gérer un FormData (upload de la
// preuve de paiement) sans forcer un Content-Type JSON dessus.
import { getToken, clearSession } from '../storage'
import { API_BASE_URL } from '../config'

export class ApiError extends Error {
  status: number
  data: unknown
  lockedUntil?: string

  constructor(status: number, message: string, data?: unknown) {
    super(message)
    this.status = status
    this.data = data
    if (data && typeof data === 'object' && 'locked_until' in data) {
      this.lockedUntil = (data as { locked_until?: string }).locked_until
    }
  }
}

type UnauthorizedHandler = () => void
let unauthorizedHandler: UnauthorizedHandler | null = null

/** Appelé une fois au démarrage de l'appli (voir App.tsx) pour rediriger vers la connexion sur un 401. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const isFormData = options.body instanceof FormData

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  let data: unknown = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      await clearSession()
      unauthorizedHandler?.()
    }

    // Erreurs serveur (5xx) : message générique, jamais le détail brut.
    const message =
      response.status >= 500
        ? 'Une erreur est survenue. Réessayez dans un instant.'
        : extractErrorMessage(data) ?? 'Une erreur est survenue.'

    throw new ApiError(response.status, message, data)
  }

  return data as T
}

function extractErrorMessage(data: unknown): string | null {
  if (data && typeof data === 'object') {
    if ('message' in data && typeof (data as { message?: unknown }).message === 'string') {
      return (data as { message: string }).message
    }
    if ('errors' in data) {
      const errors = (data as { errors: Record<string, string[]> }).errors
      const first = Object.values(errors)[0]?.[0]
      if (first) return first
    }
  }
  return null
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Une erreur est survenue.'
}