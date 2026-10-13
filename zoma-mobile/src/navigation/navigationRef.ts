// src/navigation/navigationRef.ts
//
// Permet de naviguer depuis du code qui n'est pas un écran — ici, l'appui
// sur une notification, qui doit ouvrir la bonne demande.
import { createNavigationContainerRef, type ParamListBase } from '@react-navigation/native'

export const navigationRef = createNavigationContainerRef<ParamListBase>()

/**
 * Ouvre un écran imbriqué dans un onglet (ex. onglet "Demandes", écran
 * "AgentDemandeDetail"). Les types de chaque navigateur sont précis ;
 * ici la cible est dynamique, d'où un appel non typé de l'extérieur.
 */
export function ouvrirEcran(onglet: string, ecran: string, params: object) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(onglet, { screen: ecran, params })
  }
}