<?php
// app/Http/Controllers/Api/StaffTransactionController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

/**
 * Historique des transactions pour gérant (son agence) et admin (toutes,
 * avec filtre agence optionnel) — sans limite de période : contrairement
 * à l'historique agent (limité à ses propres transactions) ou au tableau
 * de bord (limité à aujourd'hui), cet écran permet de remonter aussi
 * loin que nécessaire, filtré par agent, réseau, plateforme, type et
 * plage de dates.
 */
class StaffTransactionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Transaction::query()
            ->with(['agent:id,nom', 'agence:id,nom', 'reseauMobileMoney:id,nom', 'plateformeParis:id,nom'])
            ->when($user->role === 'gerant', fn ($q) => $q->where('agence_id', $user->agence_id));

        if ($user->role === 'admin' && $request->filled('agence_id')) {
            $query->where('agence_id', $request->integer('agence_id'));
        }
        if ($request->filled('agent_id')) {
            $query->where('agent_id', $request->integer('agent_id'));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }
        if ($request->filled('reseau_mobile_money_id')) {
            $query->where('reseau_mobile_money_id', $request->integer('reseau_mobile_money_id'));
        }
        if ($request->filled('plateforme_paris_id')) {
            $query->where('plateforme_paris_id', $request->integer('plateforme_paris_id'));
        }
        if ($request->filled('du')) {
            $query->where('created_at', '>=', $request->string('du'));
        }
        if ($request->filled('au')) {
            $query->where('created_at', '<=', $request->string('au'));
        }

        $transactions = (clone $query)->latest()->paginate($request->integer('per_page', 50));

        // Totaux calculés sur l'ENSEMBLE filtré (pas seulement la page
        // affichée), via des agrégats SQL plutôt que de charger toutes
        // les lignes en mémoire — reste correct même sur plusieurs mois.
        $totalDepots = (clone $query)->where('type', 'depot')->sum('montant');
        $totalRetraits = (clone $query)->where('type', 'retrait')->sum('montant');

        return response()->json([
            'data' => $transactions->items(),
            'current_page' => $transactions->currentPage(),
            'last_page' => $transactions->lastPage(),
            'total' => $transactions->total(),
            'totaux' => [
                'depots' => (int) $totalDepots,
                'retraits' => (int) $totalRetraits,
            ],
        ]);
    }
}