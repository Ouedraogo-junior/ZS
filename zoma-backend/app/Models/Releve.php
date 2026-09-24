<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Releve extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id',
        'agence_id',
        'reseau_mobile_money_id',
        'periode_debut',
        'periode_fin',
        'solde_theorique',
        'solde_reel',
        'ecart',
    ];

    protected $casts = [
        'periode_debut' => 'datetime',
        'periode_fin' => 'datetime',
        'solde_theorique' => 'integer',
        'solde_reel' => 'integer',
        'ecart' => 'integer',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function agence(): BelongsTo
    {
        return $this->belongsTo(Agence::class);
    }

    public function reseauMobileMoney(): BelongsTo
    {
        return $this->belongsTo(ReseauMobileMoney::class);
    }

    public function estEquilibre(): bool
    {
        return $this->ecart === 0;
    }
}