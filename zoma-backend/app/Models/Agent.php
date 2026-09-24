<?php

namespace App\Models;

use App\Models\Concerns\HasPinAuthentication;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Agent de guichet : connexion par pseudo + PIN (CDC section 3),
 * rattaché à une seule agence, opère les transactions.
 *
 * @property string $pin
 * @property int $failed_pin_attempts
 * @property \Illuminate\Support\Carbon|null $locked_until
 * @property \Illuminate\Support\Carbon|null $last_login_at
 */
class Agent extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use HasPinAuthentication;

    protected $fillable = [
        'agence_id',
        'nom',
        'pseudo',
        'pin',
        'statut',
    ];

    protected $hidden = [
        'pin',
    ];

    protected $casts = [
        'locked_until' => 'datetime',
        'last_login_at' => 'datetime',
    ];

    public function agence(): BelongsTo
    {
        return $this->belongsTo(Agence::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function releves(): HasMany
    {
        return $this->hasMany(Releve::class);
    }

    public function estActif(): bool
    {
        return $this->statut === 'active';
    }
}