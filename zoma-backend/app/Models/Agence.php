<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Agence extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'adresse',
        'ville',
        'telephone',
        'statut',
    ];

    /**
     * Les agents (guichet) rattachés à cette agence.
     */
    public function agents(): HasMany
    {
        return $this->hasMany(Agent::class);
    }

    /**
     * Les transactions enregistrées dans cette agence.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Les gérants rattachés à cette agence (users.role = 'gerant').
     * Les administrateurs réseau n'ont pas d'agence_id (portée globale).
     */
    public function gerants(): HasMany
    {
        return $this->hasMany(User::class)->where('role', 'gerant');
    }

    /**
     * Les avis clients liés à cette agence (agence_id est optionnel côté avis).
     */
    public function avis(): HasMany
    {
        return $this->hasMany(Avis::class);
    }

    /**
     * Les réclamations liées à cette agence (agence_id est optionnel côté réclamation).
     */
    public function reclamations(): HasMany
    {
        return $this->hasMany(Reclamation::class);
    }

    public function estActive(): bool
    {
        return $this->statut === 'active';
    }
}