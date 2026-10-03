// src/navigation/AgentDemandesTypes.ts
export type AgentDemandesStackParamList = {
  AgentDemandesListe: undefined
  // retourVersHistorique : quand cet écran est atteint depuis l'onglet
  // Historique (navigation croisée), le bouton retour par défaut
  // ramènerait vers la liste des demandes, pas l'historique d'où
  // l'agent vient réellement — ce drapeau permet de corriger ça.
  AgentDemandeDetail: { demandeId: number; retourVersHistorique?: boolean }
}