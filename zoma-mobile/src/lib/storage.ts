// src/lib/storage.ts
//
// Stockage sécurisé du token de connexion (Keychain iOS / Keystore
// Android via expo-secure-store) — équivalent mobile de ce que fait le
// navigateur côté web, mais chiffré. On stocke aussi le "type" de
// session (client ou staff/agent) pour savoir, au redémarrage de
// l'appli, vers quel espace rediriger sans redemander la connexion.
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'zoma_auth_token'
const TYPE_KEY = 'zoma_auth_type'

export type SessionType = 'client' | 'staff'

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function getSessionType(): Promise<SessionType | null> {
  const value = await SecureStore.getItemAsync(TYPE_KEY)
  return value === 'client' || value === 'staff' ? value : null
}

export async function setSession(token: string, type: SessionType): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
  await SecureStore.setItemAsync(TYPE_KEY, type)
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
  await SecureStore.deleteItemAsync(TYPE_KEY)
}

// ── Dernière agence utilisée ──────────────────────────────────────────────
//
// Pas une donnée sensible, juste une pré-sélection : après sa première
// demande, le client n'a plus à choisir son agence. Volontairement NON
// effacée par clearSession() — c'est une préférence de l'appareil, pas
// de la session.
const LAST_AGENCE_KEY = 'zoma_last_agence_id'

export async function getLastAgenceId(): Promise<number | null> {
  const value = await SecureStore.getItemAsync(LAST_AGENCE_KEY)
  const id = value ? parseInt(value, 10) : NaN
  return Number.isNaN(id) ? null : id
}

export async function setLastAgenceId(id: number): Promise<void> {
  await SecureStore.setItemAsync(LAST_AGENCE_KEY, String(id))
}