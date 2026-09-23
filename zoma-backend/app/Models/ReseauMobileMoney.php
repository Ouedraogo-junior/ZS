<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReseauMobileMoney extends Model
{
    use HasFactory;

    protected $table = 'reseaux_mobile_money';

    protected $fillable = [
        'nom',
        'statut',
    ];

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function estActif(): bool
    {
        return $this->statut === 'actif';
    }

    /**
     * Réseaux à proposer dans les formulaires (écran de saisie agent,
     * configuration admin) : Model::actifs()->get()
     */
    public function scopeActifs(Builder $query): Builder
    {
        return $query->where('statut', 'actif');
    }
}