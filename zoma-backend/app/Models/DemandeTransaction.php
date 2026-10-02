<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DemandeTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'agence_id',
        'type',
        'reseau_mobile_money_id',
        'plateforme_paris_id',
        'montant',
        'id_bookmaker',
        'telephone_mobile_money',
        'preuve_paiement',
        'statut',
        'agent_id',
        'transaction_id',
    ];

    protected $casts = [
        'montant' => 'integer',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function agence(): BelongsTo
    {
        return $this->belongsTo(Agence::class);
    }

    public function reseauMobileMoney(): BelongsTo
    {
        return $this->belongsTo(ReseauMobileMoney::class);
    }

    public function plateformeParis(): BelongsTo
    {
        return $this->belongsTo(PlateformeParis::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(DemandeMessage::class)->orderBy('created_at');
    }

    public function estEnAttente(): bool
    {
        return $this->statut === 'en_attente';
    }

    public function scopeEnAttente(Builder $query): Builder
    {
        return $query->where('statut', 'en_attente');
    }

    /**
     * Valide la demande : crée automatiquement la transaction correspondante
     * (sans ressaisie par l'agent) et lie les deux enregistrements.
     * L'agence de la transaction est celle choisie par le client à la
     * soumission, pas nécessairement celle de l'agent qui valide (un
     * admin, par exemple, pourrait valider pour n'importe quelle agence).
     *
     * Plusieurs agents d'une même agence peuvent voir la même demande en
     * attente simultanément (ex. 6-7 agents notifiés en même temps) —
     * la "réclamation" doit donc être atomique au niveau base de données :
     * UPDATE ... WHERE statut = 'en_attente' en une seule opération.
     * Une seule des requêtes concurrentes peut faire passer le statut de
     * 'en_attente' à 'validee' ; l'autre voit 0 ligne affectée et échoue
     * immédiatement, AVANT de créer quoi que ce soit — jamais deux
     * transactions pour la même demande, jamais de double crédit.
     *
     * L'ensemble est enveloppé dans une transaction DB : si la création
     * de la Transaction échoue après la réclamation, tout est annulé et
     * la demande redevient disponible pour un autre agent plutôt que de
     * rester bloquée "validée" sans transaction liée.
     *
     * @throws RuntimeException si un autre agent a validé entre-temps.
     */
    public function valider(Agent $agent): Transaction
    {
        return DB::transaction(function () use ($agent) {
            $reclamee = static::where('id', $this->id)
                ->where('statut', 'en_attente')
                ->update(['statut' => 'validee', 'agent_id' => $agent->id]);

            if ($reclamee === 0) {
                throw new RuntimeException('Cette demande a déjà été traitée par un autre agent.');
            }

            $transaction = Transaction::create([
                'agence_id' => $this->agence_id,
                'agent_id' => $agent->id,
                'type' => $this->type,
                'reseau_mobile_money_id' => $this->reseau_mobile_money_id,
                'plateforme_paris_id' => $this->plateforme_paris_id,
                'montant' => $this->montant,
                'telephone_client' => $this->telephone_mobile_money ?? $this->client->telephone,
                'reference_paiement' => null,
            ]);

            $this->update(['transaction_id' => $transaction->id]);

            return $transaction;
        });
    }
}