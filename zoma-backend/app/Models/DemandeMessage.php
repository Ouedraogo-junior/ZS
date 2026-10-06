<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DemandeMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'demande_transaction_id',
        'auteur_type',
        'auteur_id',
        'message',
        'audio_path',
        'audio_duree',
    ];

    /**
     * Le chemin du fichier audio reste interne au serveur : l'appli ne
     * reçoit qu'un indicateur "has_audio", puis demande le fichier via
     * une route authentifiée dédiée (jamais d'URL directe).
     */
    protected $hidden = ['audio_path'];

    protected $appends = ['has_audio'];

    public function getHasAudioAttribute(): bool
    {
        return $this->audio_path !== null;
    }

    public function demande(): BelongsTo
    {
        return $this->belongsTo(DemandeTransaction::class, 'demande_transaction_id');
    }

    public function estDuClient(): bool
    {
        return $this->auteur_type === 'client';
    }

    public function estDeLAgent(): bool
    {
        return $this->auteur_type === 'agent';
    }
}