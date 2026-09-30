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
 */
class DemandeValidee implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public DemandeTransaction $demande)
    {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel("client.{$this->demande->client_id}.demandes")];
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