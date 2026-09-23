<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReclamationMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'reclamation_id',
        'auteur_type',
        'auteur_id',
        'message',
    ];

    public function reclamation(): BelongsTo
    {
        return $this->belongsTo(Reclamation::class);
    }

    /**
     * Null quand auteur_type = 'client' (le client n'a pas de compte).
     */
    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'auteur_id');
    }

    public function estDuClient(): bool
    {
        return $this->auteur_type === 'client';
    }

    public function estDuStaff(): bool
    {
        return $this->auteur_type === 'staff';
    }
}