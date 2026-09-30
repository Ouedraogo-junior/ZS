<?php
// routes/channels.php
//
// IMPORTANT : si `php artisan install:reverb` a déjà ajouté un appel à
// Broadcast::routes() quelque part (souvent dans ce fichier, parfois
// dans bootstrap/app.php), supprimez-le et ne gardez QUE celui-ci —
// il doit y en avoir un seul, avec le middleware Sanctum. Par défaut,
// Laravel authentifie l'accès aux canaux via la session web ; notre
// appli mobile n'a pas de session, seulement un token Sanctum (comme
// pour tout le reste de l'API) — sans ce réglage, aucune authentification
// aux canaux ne fonctionnerait depuis l'appli.

use App\Models\Agent;
use App\Models\Client;
use App\Models\DemandeTransaction;
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

/**
 * Nouvelles demandes pour une agence — un agent écoute le canal de sa
 * propre agence pour voir apparaître les demandes en temps réel.
 */
Broadcast::channel('agence.{agenceId}.demandes', function ($user, $agenceId) {
    return $user instanceof Agent && (int) $user->agence_id === (int) $agenceId;
});

/**
 * Suivi des demandes d'un client — il écoute son propre canal pour être
 * notifié dès qu'une de ses demandes est validée.
 */
Broadcast::channel('client.{clientId}.demandes', function ($user, $clientId) {
    return $user instanceof Client && (int) $user->id === (int) $clientId;
});

/**
 * Fil de messages d'une demande précise — client et agent concernés
 * peuvent tous les deux écouter les nouveaux messages en direct.
 */
Broadcast::channel('demande.{demandeId}', function ($user, $demandeId) {
    $demande = DemandeTransaction::find($demandeId);

    if (! $demande) {
        return false;
    }

    if ($user instanceof Client) {
        return $user->id === $demande->client_id;
    }

    if ($user instanceof Agent) {
        return $user->agence_id === $demande->agence_id;
    }

    return false;
});