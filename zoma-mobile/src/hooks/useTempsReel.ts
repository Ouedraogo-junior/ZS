// src/hooks/useTempsReel.ts
//
// Branche un écran sur un canal temps réel pendant qu'il est affiché.
//
//   useTempsReel(`agence.${agenceId}.demandes`, {
//     'nouvelle.demande': () => load(),
//     'demande.validee': () => load(),
//   }, load)
//
// - canal : null = pas d'écoute (ex. identifiant pas encore connu).
// - evenements : nom d'événement → fonction appelée à sa réception. Les
//   fonctions peuvent changer à chaque rendu sans relancer l'abonnement.
// - surResynchronisation : appelée au retour au premier plan et après une
//   reconnexion, quand des événements ont pu être manqués.
import { useEffect, useRef } from 'react'
import { ecouter, surResync, type Evenements } from '../lib/realtime'

export function useTempsReel(
  canal: string | null,
  evenements: Evenements,
  surResynchronisation?: () => void
) {
  // Toujours la dernière version des fonctions, sans les mettre en
  // dépendance des effets (ce qui réabonnerait à chaque rendu).
  const dernier = useRef({ evenements, surResynchronisation })
  useEffect(() => {
    dernier.current = { evenements, surResynchronisation }
  })

  const noms = Object.keys(evenements).join('|')

  useEffect(() => {
    if (!canal || !noms) return
    const relais: Evenements = {}
    noms.split('|').forEach(nom => {
      relais[nom] = donnees => dernier.current.evenements[nom]?.(donnees)
    })
    return ecouter(canal, relais)
  }, [canal, noms])

  const veutResync = surResynchronisation !== undefined
  useEffect(() => {
    if (!veutResync) return
    return surResync(() => dernier.current.surResynchronisation?.())
  }, [veutResync])
}