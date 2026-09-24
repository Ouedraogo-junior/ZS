// src/lib/api/client.ts
//
// Le "plumbing" partagé : URL de base, gestion du token, wrapper fetch,
// erreurs. Les fichiers par domaine (auth.ts, transactions.ts, ...)
// s'appuient dessus mais ne le redéfinissent jamais.

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

const TOKEN_KEY = 'zoma_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  fields?: Record<string, string[]>
  /** Présent uniquement sur une réponse 423 (compte verrouillé temporairement). */
  lockedUntil?: string

  constructor(message: string, status: number, fields?: Record<string, string[]>, lockedUntil?: string) {
    super(message)
    this.status = status
    this.fields = fields
    this.lockedUntil = lockedUntil
  }
}

// ── Gestion globale du 401 (token expiré / révoqué) ─────────────────────
//
// N'importe quel écran peut appeler apiFetch sans se soucier du cas
// "session expirée" : si le backend renvoie 401, le token est effacé et
// ce handler est déclenché automatiquement. Chaque "App" racine
// (AgentApp, plus tard ManagerApp/AdminApp) l'enregistre pour revenir
// à son écran de connexion.
type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler
}

function fallbackMessage(status: number): string {
  if (status === 401) return 'Votre session a expiré. Veuillez vous reconnecter.'
  if (status === 403) return "Vous n'avez pas accès à cette action."
  if (status === 423) return 'Compte temporairement verrouillé.'
  if (status >= 500) return 'Le serveur a rencontré un problème. Réessayez dans quelques instants.'
  return 'Une erreur est survenue.'
}

/**
 * Wrapper fetch minimal : ajoute l'URL de base, les en-têtes JSON,
 * le token Bearer s'il existe, et transforme une réponse non-2xx
 * en ApiError exploitable par l'UI (message + erreurs de validation).
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    // Le serveur n'a pas répondu du tout (hors ligne, mauvaise URL, CORS...)
    throw new ApiError('Impossible de contacter le serveur. Vérifiez votre connexion.', 0)
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) {
      setToken(null)
      onUnauthorized?.()
    }

    throw new ApiError(
      // Pour une erreur serveur (5xx), on ignore body.message : en mode
      // debug, Laravel y met le message d'exception brut (ex. "Method
      // ...::load does not exist"), jamais destiné à l'utilisateur. Pour
      // les autres statuts (validation, 401, 403, 423...), ce message
      // est écrit pour être affiché tel quel.
      response.status >= 500 ? fallbackMessage(response.status) : (body?.message ?? fallbackMessage(response.status)),
      response.status,
      body?.errors,
      body?.locked_until
    )
  }

  return body as T
}

/** Message à afficher pour n'importe quelle erreur attrapée d'un appel apiFetch. */
export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return 'Une erreur inattendue est survenue.'
}