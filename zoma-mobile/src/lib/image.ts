// src/lib/image.ts
//
// Réduit une image avant envoi : moins de données mobiles consommées
// pour le client, envoi plus rapide sur réseau faible, moins d'espace
// occupé sur le serveur — et surtout, une photo d'appareil photo
// (souvent > 2 Mo) dépasserait la limite d'envoi du serveur PHP.
//
// API actuelle d'expo-image-manipulator : ImageManipulator.manipulate(...)
// puis renderAsync() puis saveAsync() — l'ancienne manipulateAsync est
// dépréciée.
// Import NOMMÉ : `manipulate` est une méthode de l'objet ImageManipulator
// exporté par le paquet, pas une fonction exportée directement par le
// module (vérifié dans les définitions de types d'expo-image-manipulator).
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'

// 1280 px de large suffisent pour lire un ID, un montant ou une
// référence sur une capture d'écran de téléphone (en général 1080 à 1440).
const LARGEUR_MAX = 1280
const QUALITE = 0.7

/** Taille d'un fichier local en octets, ou null si elle n'a pas pu être lue. */
async function tailleOctets(uri: string): Promise<number | null> {
  try {
    const reponse = await fetch(uri)
    const blob = await reponse.blob()
    return blob.size
  } catch {
    return null
  }
}

const enKo = (octets: number | null) => (octets === null ? '?' : `${(octets / 1000).toFixed(1)} Ko`)

/**
 * @param largeurOrigine largeur de l'image d'origine (fournie par le
 *   sélecteur d'images) — sert à ne redimensionner que si elle dépasse
 *   LARGEUR_MAX, jamais à agrandir une petite image (ce qui alourdirait
 *   le fichier pour rien).
 * En cas d'échec de la compression, renvoie l'image d'origine plutôt que
 * de bloquer l'envoi.
 */
export async function compresserImage(uri: string, largeurOrigine?: number): Promise<string> {
  try {
    const contexte = ImageManipulator.manipulate(uri)

    if (largeurOrigine && largeurOrigine > LARGEUR_MAX) {
      contexte.resize({ width: LARGEUR_MAX })
    }

    const image = await contexte.renderAsync()
    const resultat = await image.saveAsync({
      compress: QUALITE,
      format: SaveFormat.JPEG,
    })

    // Contrôle visible uniquement en développement (disparaît d'un build
    // release) : permet de vérifier que la compression agit vraiment,
    // plutôt que de le déduire de la taille d'un fichier envoyé.
    if (__DEV__) {
      const [avant, apres] = await Promise.all([tailleOctets(uri), tailleOctets(resultat.uri)])
      console.log(
        `[compresserImage] ${enKo(avant)} → ${enKo(apres)} ` +
          `(largeur d'origine : ${largeurOrigine ?? 'inconnue'}, après : ${resultat.width})`
      )
    }

    return resultat.uri
  } catch (erreur) {
    // Pas de blocage de l'envoi — mais on le signale dans les journaux
    // plutôt que d'échouer en silence (ex. module natif pas encore
    // recompilé après l'installation : l'envoi marcherait, sans compression).
    console.warn("Compression de l'image impossible, image d'origine conservée :", erreur)
    return uri
  }
}