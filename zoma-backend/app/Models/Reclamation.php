<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reclamation extends Model
{
    use HasFactory;

    protected $fillable = [
        'agence_id',
        'client_id',
        'demande_transaction_id',
        'nom_client',
        'contact_client',
        'description',
        'audio_path',
        'audio_duree',
        'reference_transaction',
        'piece_jointe',
        'statut',
        'assigne_a_id',
    ];

    /**
     * Le chemin du fichier audio reste interne au serveur : l'appli ne
     * reçoit qu'un indicateur "has_audio", puis demande le fichier via une
     * route authentifiée dédiée (jamais d'URL directe).
     */
    protected $hidden = ['audio_path'];

    protected $appends = ['has_audio'];

    public function getHasAudioAttribute(): bool
    {
        return $this->audio_path !== null;
    }

    public function agence(): BelongsTo
    {
        return $this->belongsTo(Agence::class);
    }

    /** Le client qui a fait la réclamation depuis l'appli (null si elle vient du site). */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /** La demande concernée, quand la réclamation en vise une précise. */
    public function demande(): BelongsTo
    {
        return $this->belongsTo(DemandeTransaction::class, 'demande_transaction_id');
    }

    /**
     * Gérant ou admin en charge de la réclamation (CDC section 7 : attribution
     * au gérant de l'agence, avec escalade possible vers l'administrateur).
     */
    public function assigneA(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigne_a_id');
    }

    /**
     * Fil d'échanges, dans l'ordre chronologique.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(ReclamationMessage::class)->orderBy('created_at');
    }

    public function estNouveau(): bool
    {
        return $this->statut === 'nouveau';
    }

    public function estEnCours(): bool
    {
        return $this->statut === 'en_cours';
    }

    public function estResolu(): bool
    {
        return $this->statut === 'resolu';
    }

    public function scopeStatut(Builder $query, string $statut): Builder
    {
        return $query->where('statut', $statut);
    }

    /**
     * Change le statut de la réclamation.
     * La notification WhatsApp au client à chaque changement de statut
     * (CDC section 7) sera déclenchée par un Observer sur ce modèle,
     * à écrire dans une étape ultérieure — pas encore branchée ici.
     */
    public function changerStatut(string $statut): void
    {
        $this->update(['statut' => $statut]);
    }
}