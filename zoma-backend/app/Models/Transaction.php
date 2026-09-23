<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory;
    use SoftDeletes; // annulation = soft delete, jamais de suppression silencieuse (CDC section 4)

    protected $fillable = [
        'agence_id',
        'agent_id',
        'type',
        'reseau_mobile_money_id',
        'plateforme_paris_id',
        'montant',
        'telephone_client',
        'reference_paiement',
    ];

    protected $casts = [
        'montant' => 'integer',
    ];

    public function agence(): BelongsTo
    {
        return $this->belongsTo(Agence::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function reseauMobileMoney(): BelongsTo
    {
        return $this->belongsTo(ReseauMobileMoney::class);
    }

    public function plateformeParis(): BelongsTo
    {
        return $this->belongsTo(PlateformeParis::class);
    }

    public function estDepot(): bool
    {
        return $this->type === 'depot';
    }

    public function estRetrait(): bool
    {
        return $this->type === 'retrait';
    }

    /**
     * Montant signé : positif pour un dépôt, négatif pour un retrait.
     * Utile pour les totaux (historique agent, relève d'équipe, tableaux de bord).
     */
    public function montantSigne(): int
    {
        return $this->estRetrait() ? -$this->montant : $this->montant;
    }

    public function scopeDepots(Builder $query): Builder
    {
        return $query->where('type', 'depot');
    }

    public function scopeRetraits(Builder $query): Builder
    {
        return $query->where('type', 'retrait');
    }

    /**
     * Transactions entre deux horodatages — sert notamment à calculer
     * le solde théorique d'un agent depuis sa dernière relève (CDC section 4/12).
     */
    public function scopeEntre(Builder $query, $debut, $fin): Builder
    {
        return $query->whereBetween('created_at', [$debut, $fin]);
    }
}