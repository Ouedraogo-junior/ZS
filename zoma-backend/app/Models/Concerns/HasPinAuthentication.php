<?php

namespace App\Models\Concerns;

use Illuminate\Support\Facades\Hash;

/**
 * Logique d'authentification par pseudo + PIN, partagée par Agent et User
 * (gérants/admins). Suppose que le modèle utilisateur a les colonnes :
 * pseudo, pin, failed_pin_attempts, locked_until, last_login_at.
 */
trait HasPinAuthentication
{
    /** Nombre d'échecs de PIN avant verrouillage temporaire (CDC section 3). */
    private const MAX_TENTATIVES_PIN = 5;

    /** Durée du verrouillage temporaire, en minutes. */
    private const DUREE_VERROUILLAGE_MINUTES = 15;

    /**
     * Hache automatiquement le PIN à chaque affectation.
     */
    public function setPinAttribute(string $value): void
    {
        $this->attributes['pin'] = Hash::make($value);
    }

    public function getAuthPassword(): string
    {
        return $this->pin;
    }

    public function estVerrouille(): bool
    {
        return $this->locked_until !== null && $this->locked_until->isFuture();
    }

    /**
     * À appeler après une tentative de PIN échouée.
     */
    public function enregistrerEchecPin(): void
    {
        $this->increment('failed_pin_attempts');

        if ($this->failed_pin_attempts >= self::MAX_TENTATIVES_PIN) {
            $this->forceFill([
                'locked_until' => now()->addMinutes(self::DUREE_VERROUILLAGE_MINUTES),
            ])->save();
        }
    }

    /**
     * À appeler après une connexion réussie.
     */
    public function enregistrerConnexionReussie(): void
    {
        $this->forceFill([
            'failed_pin_attempts' => 0,
            'locked_until' => null,
            'last_login_at' => now(),
        ])->save();
    }
}