<?php
// app/Models/PushToken.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PushToken extends Model
{
    protected $fillable = [
        'tokenable_type',
        'tokenable_id',
        'token',
        'plateforme',
    ];

    /** Le compte (Client, Agent ou User/gérant) à qui appartient ce téléphone. */
    public function tokenable(): MorphTo
    {
        return $this->morphTo();
    }
}