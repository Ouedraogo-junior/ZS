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
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

/**
 * Qui a le droit de suivre une agence : ses agents ET son gérant (qui
 * peut traiter les demandes, comme un agent), ainsi que l'admin, dont la
 * portée est le réseau entier. Un gérant est un `User` (role = 'gerant'),
 * pas un `Agent` — il faut donc tester les deux modèles.
 */
$accesAgence = function ($utilisateur, int $agenceId): bool {
    if ($utilisateur instanceof Agent) {
        return (int) $utilisateur->agence_id === $agenceId;
    }

    if ($utilisateur instanceof User) {
        return $utilisateur->role === 'admin'
            || ($utilisateur->role === 'gerant' && (int) $utilisateur->agence_id === $agenceId);
    }

    return false;
};

/**
 * Nouvelles demandes pour une agence — agents et gérant écoutent le canal
 * de leur agence pour voir apparaître (et disparaître, une fois validées)
 * les demandes en temps réel.
 */
Broadcast::channel('agence.{agenceId}.demandes', function ($utilisateur, $agenceId) use ($accesAgence) {
    return $accesAgence($utilisateur, (int) $agenceId);
});

/**
 * Suivi des demandes d'un client — il écoute son propre canal pour être
 * notifié dès qu'une de ses demandes est validée.
 */
Broadcast::channel('client.{clientId}.demandes', function ($utilisateur, $clientId) {
    return $utilisateur instanceof Client && (int) $utilisateur->id === (int) $clientId;
});

/**
 * Fil de messages d'une demande précise — le client concerné et le
 * personnel de l'agence (agents, gérant, admin) peuvent tous écouter les
 * nouveaux messages en direct.
 */
Broadcast::channel('demande.{demandeId}', function ($utilisateur, $demandeId) use ($accesAgence) {
    $demande = DemandeTransaction::find($demandeId);

    if (! $demande) {
        return false;
    }

    if ($utilisateur instanceof Client) {
        return (int) $utilisateur->id === (int) $demande->client_id;
    }

    return $accesAgence($utilisateur, (int) $demande->agence_id);
});