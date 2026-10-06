// src/lib/phone.ts
import { DEFAULT_COUNTRY_CODE } from './config'

/**
 * Convertit un numéro tel que saisi (local ou international, avec ou
 * sans espaces/+/00) en numéro valide pour un lien wa.me, qui exige le
 * format international complet sans "+" ni zéros de tête.
 *
 * - "70 12 34 56"      → "22670123456"  (local : ajoute l'indicatif)
 * - "+226 70 12 34 56" → "22670123456"
 * - "00226 70123456"   → "22670123456"
 * - "22670123456"      → "22670123456"  (déjà complet)
 * - numéro étranger plus long (ex. "33612345678") → inchangé, supposé
 *   déjà complet.
 */
export function versNumeroWhatsApp(contact: string): string {
  let chiffres = contact.replace(/\D/g, '')

  // Préfixe d'appel international "00" → à retirer.
  if (chiffres.startsWith('00')) chiffres = chiffres.slice(2)

  // Numéro local à 8 chiffres : ajoute l'indicatif par défaut.
  if (chiffres.length === 8) return `${DEFAULT_COUNTRY_CODE}${chiffres}`

  // Déjà complet (avec indicatif) ou numéro étranger : tel quel.
  return chiffres
}