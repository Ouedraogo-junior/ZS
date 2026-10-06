// src/lib/noteVocale.ts
import { AudioQuality, IOSOutputFormat, type RecordingOptions } from 'expo-audio'

/** Durée maximale d'une note vocale, en secondes (alignée sur le serveur : GereMessagesDemande). */
export const DUREE_MAX_NOTE_VOCALE = 120

/** Un enregistrement plus court que ça est considéré comme un appui accidentel et jeté. */
export const DUREE_MIN_NOTE_VOCALE_MS = 1000

/**
 * Réglages d'enregistrement pensés pour la voix : mono, 22 kHz, 32 kbps
 * en AAC (.m4a), soit environ 240 Ko par minute — contre environ 1 Mo
 * par minute avec le préréglage standard d'Expo (stéréo 44,1 kHz,
 * 128 kbps). Le débit donne l'ordre de grandeur ; la taille réelle se
 * mesure sur de vrais enregistrements.
 *
 * On n'utilise PAS le préréglage "basse qualité" d'Expo : sous Android il
 * produit du 3gp/AMR (qualité téléphone très étroite), format que les
 * iPhone ne savent pas lire nativement.
 *
 * Le bloc "web" est exigé par le type RecordingOptions même s'il n'est
 * jamais utilisé ici (l'appli ne tourne pas sur le web).
 */
export const OPTIONS_NOTE_VOCALE: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 22050,
  numberOfChannels: 1,
  bitRate: 32000,
  android: {
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MEDIUM,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {},
}

/** 75 → "1:15" */
export function formaterDuree(secondes: number): string {
  const total = Math.max(0, Math.round(secondes))
  const minutes = Math.floor(total / 60)
  const reste = total % 60
  return `${minutes}:${reste.toString().padStart(2, '0')}`
}