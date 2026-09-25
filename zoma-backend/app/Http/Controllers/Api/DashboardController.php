<?php
// app/Http/Controllers/Api/DashboardController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agence;
use App\Models\Agent;
use App\Models\Reclamation;
use App\Models\Transaction;
use Illuminate\Http\Request;

/**
 * Tableaux de bord — vue d'ensemble pour le gérant (son agence) et
 * l'admin (réseau entier). "Volume du jour" utilise le jour calendaire
 * (minuit à minuit), à la différence de la relève d'équipe qui, elle,
 * suit les postes des agents plutôt que le calendrier — deux logiques
 * différentes pour deux besoins différents.
 */
class DashboardController extends Controller
{
    /** Réservé à un gérant (agence_id toujours renseigné pour ce rôle). */
    public function gerant(Request $request)
    {
        $user = $request->user();
        $agenceId = $user->agence_id;
        $debutJour = now()->startOfDay();

        $transactionsJour = Transaction::where('agence_id', $agenceId)
            ->where('created_at', '>=', $debutJour)
            ->get();

        $agents = Agent::where('agence_id', $agenceId)->get();

        $reclamationsEnAttente = Reclamation::where(function ($q) use ($agenceId) {
            $q->where('agence_id', $agenceId)->orWhereNull('agence_id');
        })->whereIn('statut', ['nouveau', 'en_cours'])->count();

        return response()->json([
            'volume_depots_jour' => (int) $transactionsJour->where('type', 'depot')->sum('montant'),
            'volume_retraits_jour' => (int) $transactionsJour->where('type', 'retrait')->sum('montant'),
            'transactions_jour' => $transactionsJour->count(),
            'agents_actifs' => $agents->where('statut', 'active')->count(),
            'agents_total' => $agents->count(),
            'reclamations_en_attente' => $reclamationsEnAttente,
            'tendance_7_jours' => $this->tendanceSeptJours(fn ($q) => $q->where('agence_id', $agenceId)),
        ]);
    }

    /** Réservé à l'admin — vue réseau entier. */
    public function admin(Request $request)
    {
        $debutJour = now()->startOfDay();
        $transactionsJour = Transaction::where('created_at', '>=', $debutJour)->get();

        $agences = Agence::all()->keyBy('id');

        $comparatifAgences = $transactionsJour
            ->groupBy('agence_id')
            ->map(fn ($group, $agenceId) => [
                'agence_id' => $agenceId,
                'agence' => $agences[$agenceId]->nom ?? 'Agence inconnue',
                'volume' => (int) $group->sum('montant'),
                'transactions' => $group->count(),
            ])
            ->sortByDesc('volume')
            ->values();

        return response()->json([
            'volume_jour' => (int) $transactionsJour->sum('montant'),
            'transactions_jour' => $transactionsJour->count(),
            'agences_actives' => $agences->where('statut', 'active')->count(),
            'agents_actifs' => Agent::where('statut', 'active')->count(),
            'reclamations_en_attente' => Reclamation::whereIn('statut', ['nouveau', 'en_cours'])->count(),
            'comparatif_agences' => $comparatifAgences,
            'tendance_7_jours' => $this->tendanceSeptJours(fn ($q) => $q),
        ]);
    }

    /**
     * Volume dépôts/retraits par jour sur les 7 derniers jours (aujourd'hui
     * inclus), avec les jours sans transaction représentés à zéro plutôt
     * que simplement absents.
     */
    private function tendanceSeptJours(\Closure $scope): array
    {
        $debut = now()->subDays(6)->startOfDay();

        $transactions = $scope(Transaction::where('created_at', '>=', $debut))->get();

        $parJour = $transactions->groupBy(fn ($t) => $t->created_at->format('Y-m-d'));

        return collect(range(6, 0))
            ->map(function ($i) use ($parJour) {
                $jour = now()->subDays($i)->format('Y-m-d');
                $groupe = $parJour->get($jour, collect());

                return [
                    'date' => $jour,
                    'depots' => (int) $groupe->where('type', 'depot')->sum('montant'),
                    'retraits' => (int) $groupe->where('type', 'retrait')->sum('montant'),
                ];
            })
            ->values()
            ->all();
    }
}