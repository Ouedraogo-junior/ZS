<?php
// app/Support/Diffusion.php

namespace App\Support;

use Throwable;

/**
 * Émet un événement de diffusion temps réel SANS jamais faire échouer la
 * requête en cours.
 *
 * Pourquoi : la demande est déjà enregistrée (ou validée) en base quand on
 * arrive ici. Si le serveur Reverb est arrêté ou injoignable, le client
 * recevrait une erreur 500 alors que son action a bel et bien réussi —
 * il la renverrait, et ce serait un doublon. Le temps réel n'est qu'un
 * confort d'affichage : en cas de panne, l'erreur est journalisée
 * (storage/logs) et les écrans se mettent à jour au prochain
 * rechargement, comme avant.
 */
class Diffusion
{
    public static function emettre(object $evenement): void
    {
        try {
            event($evenement);
        } catch (Throwable $e) {
            report($e);
        }
    }
}