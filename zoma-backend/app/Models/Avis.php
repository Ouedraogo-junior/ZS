<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Avis extends Model
{
    use HasFactory;

    protected $table = 'avis';

    protected $fillable = [
        'agence_id',
        'nom_client',
        'note',
        'commentaire',
    ];

    protected $casts = [
        'note' => 'integer',
    ];

    /**
     * Agence concernée par l'avis — optionnelle (CDC section 6).
     */
    public function agence(): BelongsTo
    {
        return $this->belongsTo(Agence::class);
    }
}