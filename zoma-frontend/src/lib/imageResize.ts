// src/lib/imageResize.ts
//
// Réduit une image dans le navigateur AVANT son envoi au serveur.
//
// Pourquoi : l'admin choisit souvent un logo téléchargé sur internet, de
// plusieurs milliers de pixels et parfois plusieurs Mo, alors qu'il
// s'affiche en 50 à 100 pixels sur le téléphone du client. Une image
// légère s'affiche plus vite et consomme moins de données mobiles. Passer
// par un canvas convertit aussi un logo SVG en PNG (le serveur refuse le
// SVG, qui peut contenir du script).

export interface OptionsRedimension {
  /** Plus grand côté, en pixels. Une image plus petite n'est jamais agrandie. */
  maxSide: number
  /** PNG pour un logo (garde la transparence), JPEG pour une photo. */
  type: 'image/png' | 'image/jpeg'
  /** Qualité de 0 à 1 — ignorée pour le PNG. */
  quality?: number
}

const EXTENSIONS = { 'image/png': 'png', 'image/jpeg': 'jpg' } as const

export async function redimensionnerImage(
  fichier: File,
  { maxSide, type, quality = 0.85 }: OptionsRedimension
): Promise<File> {
  const url = URL.createObjectURL(fichier)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error("Image illisible. Choisissez un fichier PNG ou JPG."))
      el.src = url
    })

    // Un SVG sans dimensions propres donne 0 : impossible à dessiner.
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error("Image illisible. Choisissez un fichier PNG ou JPG.")
    }

    const echelle = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
    const largeur = Math.max(1, Math.round(image.naturalWidth * echelle))
    const hauteur = Math.max(1, Math.round(image.naturalHeight * echelle))

    const canvas = document.createElement('canvas')
    canvas.width = largeur
    canvas.height = hauteur

    const contexte = canvas.getContext('2d')
    if (!contexte) throw new Error("Impossible de préparer l'image.")

    // Le JPEG n'a pas de transparence : sans fond blanc, les zones
    // transparentes deviendraient noires.
    if (type === 'image/jpeg') {
      contexte.fillStyle = '#FFFFFF'
      contexte.fillRect(0, 0, largeur, hauteur)
    }
    contexte.drawImage(image, 0, 0, largeur, hauteur)

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality))
    if (!blob) throw new Error("Impossible de préparer l'image.")

    return new File([blob], `image.${EXTENSIONS[type]}`, { type })
  } finally {
    URL.revokeObjectURL(url)
  }
}