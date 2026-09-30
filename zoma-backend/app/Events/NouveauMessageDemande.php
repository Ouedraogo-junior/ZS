<?php
// app/Events/NouveauMessageDemande.php

namespace App\Events;

use App\Models\DemandeMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Diffusé à chaque message ajouté (client ou agent) sur le fil de
 * secours d'une demande — les deux côtés le voient apparaître en direct.
 */
class NouveauMessageDemande implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public DemandeMessage $message)
    {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel("demande.{$this->message->demande_transaction_id}")];
    }

    public function broadcastAs(): string
    {
        return 'nouveau.message';
    }

    public function broadcastWith(): array
    {
        return ['message' => $this->message];
    }
}