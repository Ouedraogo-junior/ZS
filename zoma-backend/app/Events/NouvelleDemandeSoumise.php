<?php
// app/Events/NouvelleDemandeSoumise.php

namespace App\Events;

use App\Models\DemandeTransaction;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Diffusé quand un client soumet une nouvelle demande — l'agent qui a
 * l'écran "Demandes" ouvert la voit apparaître sans avoir à recharger.
 */
class NouvelleDemandeSoumise implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public DemandeTransaction $demande)
    {
        $this->demande->loadMissing(['client:id,nom,telephone', 'reseauMobileMoney:id,nom', 'plateformeParis:id,nom']);
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel("agence.{$this->demande->agence_id}.demandes")];
    }

    public function broadcastAs(): string
    {
        return 'nouvelle.demande';
    }

    public function broadcastWith(): array
    {
        return ['demande' => $this->demande];
    }
}