<?php

namespace App\Models;

use App\Models\Concerns\HasPinAuthentication;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Gérants d'agence et administrateurs réseau (CDC section 9).
 * Connexion par pseudo + PIN, comme les agents (même mécanisme,
 * table séparée pour garder des clés étrangères propres :
 * transactions.agent_id -> agents, reclamations.assigne_a_id -> users).
 *
 * @property string $pin
 * @property int $failed_pin_attempts
 * @property \Illuminate\Support\Carbon|null $locked_until
 * @property \Illuminate\Support\Carbon|null $last_login_at
 */
class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use HasPinAuthentication;

    protected $fillable = [
        'nom',
        'pseudo',
        'pin',
        'role',
        'agence_id',
        'statut',
    ];

    protected $hidden = [
        'pin',
    ];

    protected $casts = [
        'locked_until' => 'datetime',
        'last_login_at' => 'datetime',
    ];

    /**
     * Agence rattachée — obligatoire pour role = 'gerant', null pour role = 'admin'.
     */
    public function agence(): BelongsTo
    {
        return $this->belongsTo(Agence::class);
    }

    public function reclamationsAssignees(): HasMany
    {
        return $this->hasMany(Reclamation::class, 'assigne_a_id');
    }

    public function messagesEnvoyes(): HasMany
    {
        return $this->hasMany(ReclamationMessage::class, 'auteur_id');
    }

    public function estGerant(): bool
    {
        return $this->role === 'gerant';
    }

    public function estAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function estActif(): bool
    {
        return $this->statut === 'active';
    }
}