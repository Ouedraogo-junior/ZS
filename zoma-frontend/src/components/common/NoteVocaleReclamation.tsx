// src/components/common/NoteVocaleReclamation.tsx
//
// Lecteur de la note vocale d'une réclamation. Le fichier est protégé (il
// faut le jeton), donc il n'est téléchargé qu'au clic sur « Écouter » : une
// liste de réclamations ne déclenche aucun téléchargement tant qu'on n'en
// ouvre pas une, et on n'en charge qu'une à la fois.
import { useEffect, useState } from 'react'
import { Mic, Loader2 } from 'lucide-react'
import { getAudioReclamation, getErrorMessage } from '@/lib/api'

interface Props {
  reclamationId: number
  dureeSecondes: number | null
}

function formaterDuree(secondes: number): string {
  const total = Math.max(0, Math.round(secondes))
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`
}

export function NoteVocaleReclamation({ reclamationId, dureeSecondes }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  // Une autre réclamation est ouverte : on repart de zéro, et on libère le
  // fichier en mémoire de la précédente.
  useEffect(() => {
    return () => {
      setUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setErreur(null)
    }
  }, [reclamationId])

  const charger = async () => {
    setChargement(true)
    setErreur(null)
    try {
      const fichier = await getAudioReclamation(reclamationId)
      setUrl(URL.createObjectURL(fichier))
    } catch (err) {
      setErreur(getErrorMessage(err))
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-xl p-3 mb-3">
      <p className="text-muted text-xs font-semibold mb-2 flex items-center gap-1.5">
        <Mic size={13} /> Note vocale du client
        {dureeSecondes ? ` · ${formaterDuree(dureeSecondes)}` : ''}
      </p>

      {url ? (
        <audio controls autoPlay src={url} className="w-full" />
      ) : (
        <button
          onClick={charger}
          disabled={chargement}
          className="text-sm font-semibold text-white bg-secondary rounded-lg px-4 py-2 flex items-center gap-2 disabled:opacity-60"
        >
          {chargement && <Loader2 size={14} className="animate-spin" />}
          Écouter la note vocale
        </button>
      )}

      {erreur && <p className="text-danger text-xs mt-2">{erreur}</p>}
    </div>
  )
}