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
import * as ImageManipulator from 'expo-image-manipulator'

// 1280 px de large suffisent pour lire un ID, un montant ou une
// référence sur une capture d'écran de téléphone (en général 1080 à 1440).
const LARGEUR_MAX = 1280
const QUALITE = 0.7

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
      format: ImageManipulator.SaveFormat.JPEG,
    })

    return resultat.uri
  } catch {
    return uri
  }
}