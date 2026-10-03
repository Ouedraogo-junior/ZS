<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory;
    use SoftDeletes; // annulation = soft delete, jamais de suppression silencieuse (CDC section 4)

    protected $fillable = [
        'agence_id',
        'agent_id',
        'user_id',
        'type',
        'reseau_mobile_money_id',
        'plateforme_paris_id',
        'montant',
        'telephone_client',
        'reference_paiement',
    ];

    protected $casts = [
        'montant' => 'integer',
    ];

    public function agence(): BelongsTo
    {
        return $this->belongsTo(Agence::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    /** Rempli uniquement si c'est un gérant OU un admin (pas un agent) qui a traité cette transaction. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reseauMobileMoney(): BelongsTo
    {
        return $this->belongsTo(ReseauMobileMoney::class);
    }

    public function plateformeParis(): BelongsTo
    {
        return $this->belongsTo(PlateformeParis::class);
    }

    /**
     * La demande (s'il y en a une) qui a créé cette transaction via
     * validation — absente pour une saisie directe au guichet.
     */
    public function demande(): HasOne
    {
        return $this->hasOne(DemandeTransaction::class, 'transaction_id');
    }

    public function estDepot(): bool
    {
        return $this->type === 'depot';
    }

    public function estRetrait(): bool
    {
        return $this->type === 'retrait';
    }

    /**
     * Annule la transaction (soft delete) en gardant la trace de qui l'a
     * annulée et pourquoi (CDC section 4). $principal est l'Agent ou le
     * User (gérant/admin) authentifié qui déclenche l'annulation.
     */
    public function annuler(Agent|User $principal, string $motif): void
    {
        $this->annule_par_type = $principal instanceof Agent ? 'agent' : 'staff';
        $this->annule_par_id = $principal->id;
        $this->motif_annulation = $motif;
        $this->save();

        $this->delete();
    }

    /** Minutes après la création pendant lesquelles un agent peut encore annuler sa propre transaction. */
    private const MAX_MINUTES_ANNULATION_AGENT = 10;

    /**
     * Un agent ne peut annuler que sa propre transaction, et seulement
     * dans les MAX_MINUTES_ANNULATION_AGENT minutes suivant la saisie —
     * corriger une erreur immédiate, pas revenir dessus des heures après.
     */
    public function annulableParAgent(Agent $agent): bool
    {
        return $this->agent_id === $agent->id
            && $this->created_at->gt(now()->subMinutes(self::MAX_MINUTES_ANNULATION_AGENT));
    }

    /**
     * Montant signé : positif pour un dépôt, négatif pour un retrait.
     * Utile pour les totaux (historique agent, relève d'équipe, tableaux de bord).
     */
    public function montantSigne(): int
    {
        return $this->estRetrait() ? -$this->montant : $this->montant;
    }

    public function scopeDepots(Builder $query): Builder
    {
        return $query->where('type', 'depot');
    }

    public function scopeRetraits(Builder $query): Builder
    {
        return $query->where('type', 'retrait');
    }

    /**
     * Transactions entre deux horodatages — sert notamment à calculer
     * le solde théorique d'un agent depuis sa dernière relève (CDC section 4/12).
     */
    public function scopeEntre(Builder $query, $debut, $fin): Builder
    {
        return $query->whereBetween('created_at', [$debut, $fin]);
    }
}