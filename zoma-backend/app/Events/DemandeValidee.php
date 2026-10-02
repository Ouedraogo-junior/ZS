<?php
// app/Events/DemandeValidee.php

namespace App\Events;

use App\Models\DemandeTransaction;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Diffusé quand un agent valide une demande — le client, s'il regarde
 * l'écran de suivi, voit le statut passer à "validée" sans recharger.
 *
 * Diffusé AUSSI sur le canal de l'agence : plusieurs agents (6-7 dans
 * une même agence) peuvent voir la même demande en attente simultanément
 * (CDC/fil "concurrence sur les demandes") — ce second canal permet à
 * leurs listes de se mettre à jour en direct, pour qu'ils voient la
 * demande disparaître plutôt que de la découvrir déjà prise en tapant
 * dessus (la vraie protection contre un double traitement reste côté
 * base de données, dans DemandeTransaction::valider() — ceci n'est que
 * du confort d'affichage, pas une garantie de sécurité).
 */
class DemandeValidee implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public DemandeTransaction $demande)
    {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("client.{$this->demande->client_id}.demandes"),
            new PrivateChannel("agence.{$this->demande->agence_id}.demandes"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'demande.validee';
    }

    public function broadcastWith(): array
    {
        return [
            'demande_id' => $this->demande->id,
            'statut' => 'validee',
        ];
    }
}