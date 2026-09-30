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
    ];

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