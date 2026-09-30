<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Client de l'appli mobile (canal distant, remplace WhatsApp).
 * Connexion par numéro de téléphone seul, sans PIN (décision assumée,
 * voir le commentaire de la migration).
 *
 * Étend Authenticatable (comme Agent/User) même sans mot de passe/PIN :
 * c'est ce dont a besoin le guard Sanctum pour résoudre correctement
 * $request->user() en Client sur les requêtes authentifiées — on n'a
 * simplement jamais besoin d'appeler getAuthPassword() puisqu'il n'y a
 * aucune vérification de PIN dans le flux de connexion.
 */
class Client extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;

    protected $fillable = [
        'nom',
        'telephone',
        'statut',
    ];

    protected $casts = [
        'last_login_at' => 'datetime',
    ];

    public function demandes(): HasMany
    {
        return $this->hasMany(DemandeTransaction::class);
    }

    public function estActif(): bool
    {
        return $this->statut === 'active';
    }
}