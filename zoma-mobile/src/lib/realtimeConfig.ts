// src/lib/realtimeConfig.ts
//
// Réglages de la connexion temps réel (Reverb), déduits de l'adresse de
// l'API (lib/config.ts) : même serveur, mêmes règles. Quand l'API passera
// en https, le temps réel passera tout seul en wss.
//
// Les connexions WebSocket transitent par Nginx (bloc `location /app/`
// du fichier nginx-zoma.conf), sur le même port que l'API — pas de port
// 8080 à ouvrir sur le serveur.
import { API_BASE_URL } from './config'

/**
 * Clé publique de l'application Reverb — c'est la valeur REVERB_APP_KEY
 * du fichier .env du SERVEUR (jamais REVERB_APP_SECRET, qui, lui, ne
 * doit sortir du serveur sous aucun prétexte).
 * Tant qu'elle n'est pas renseignée, le temps réel reste simplement
 * désactivé : l'appli fonctionne comme avant (rechargement à l'ouverture
 * de chaque écran et par tirage vers le bas).
 */
export const REVERB_APP_KEY = '766f64545b3737b03824f8ad28dc18eb'

// "http://57.131.139.33/api" → schéma "http", hôte "57.131.139.33", port absent.
// Analyse à la main : l'objet URL de React Native est incomplet.
const morceaux = /^(https?):\/\/([^/:]+)(?::(\d+))?/.exec(API_BASE_URL)

export const REVERB_TLS = morceaux?.[1] === 'https'
export const REVERB_HOTE = morceaux?.[2] ?? ''
export const REVERB_PORT = morceaux?.[3] ? parseInt(morceaux[3], 10) : REVERB_TLS ? 443 : 80

/** Racine du serveur (sans "/api") : là où Laravel expose /broadcasting/auth. */
export const ORIGINE_API = API_BASE_URL.replace(/\/api\/?$/, '')

export const REVERB_ACTIF = REVERB_HOTE !== '' && !REVERB_APP_KEY.startsWith('766f64545b3737b03824f8ad28dc18eb')