<?php
// app/Http/Controllers/Api/ReleveController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\Releve;
use App\Models\ReseauMobileMoney;
use App\Models\Transaction;
use Illuminate\Http\Request;

/**
 * Relève d'équipe / contrôle de caisse (CDC sections 4 et 12) : par
 * réseau mobile money, pas par journée calendaire — les agences
 * fonctionnent 24h/24, 7j/7 (CDC section 13).
 */
class ReleveController extends Controller
{
    /**
     * Prépare la relève : pour chaque réseau actif, calcule le solde
     * théorique depuis la dernière relève validée par l'agent sur ce
     * réseau (ou depuis la création de son compte, à défaut).
     */
    public function prepare(Request $request)
    {
        $agent = $request->user();

        $preparation = ReseauMobileMoney::actifs()->get()->map(function (ReseauMobileMoney $reseau) use ($agent) {
            [$debut, $fin] = $this->periode($agent, $reseau);
            $totaux = $this->totaux($agent, $reseau, $debut, $fin);

            return [
                'reseau_mobile_money_id' => $reseau->id,
                'reseau' => $reseau->nom,
                'periode_debut' => $debut->toIso8601String(),
                'periode_fin' => $fin->toIso8601String(),
                'depots' => $totaux['depots'],
                'retraits' => $totaux['retraits'],
                'solde_theorique' => $totaux['depots'] - $totaux['retraits'],
            ];
        });

        return response()->json(['reseaux' => $preparation->values()]);
    }

    /**
     * Valide la relève : ne fait jamais confiance à un solde théorique
     * envoyé par le client — recalculé ici, sur la même période que
     * prepare() aurait déterminée à cet instant. Une ligne "releves" par
     * réseau, avec le solde réel saisi par l'agent.
     */
    public function store(Request $request)
    {
        $agent = $request->user();

        $data = $request->validate([
            'soldes' => ['required', 'array', 'min:1'],
            'soldes.*.reseau_mobile_money_id' => ['required', 'integer', 'exists:reseaux_mobile_money,id'],
            'soldes.*.solde_reel' => ['required', 'integer'],
        ]);

        $releves = collect($data['soldes'])->map(function (array $item) use ($agent) {
            $reseau = ReseauMobileMoney::findOrFail($item['reseau_mobile_money_id']);
            [$debut, $fin] = $this->periode($agent, $reseau);
            $totaux = $this->totaux($agent, $reseau, $debut, $fin);

            $soldeTheorique = $totaux['depots'] - $totaux['retraits'];
            $soldeReel = (int) $item['solde_reel'];

            return Releve::create([
                'agent_id' => $agent->id,
                'agence_id' => $agent->agence_id,
                'reseau_mobile_money_id' => $reseau->id,
                'periode_debut' => $debut,
                'periode_fin' => $fin,
                'solde_theorique' => $soldeTheorique,
                'solde_reel' => $soldeReel,
                'ecart' => $soldeReel - $soldeTheorique,
            ]);
        });

        return response()->json([
            'releves' => $releves->each->load('reseauMobileMoney')->values(),
        ], 201);
    }

    /**
     * Période couverte par la prochaine relève d'un agent sur un réseau :
     * depuis la fin de sa dernière relève validée sur ce réseau, ou depuis
     * la création de son compte à défaut de relève précédente.
     */
    private function periode(Agent $agent, ReseauMobileMoney $reseau): array
    {
        $derniereReleve = Releve::query()
            ->where('agent_id', $agent->id)
            ->where('reseau_mobile_money_id', $reseau->id)
            ->latest('periode_fin')
            ->first();

        $debut = $derniereReleve?->periode_fin ?? $agent->created_at;

        return [$debut, now()];
    }

    private function totaux(Agent $agent, ReseauMobileMoney $reseau, $debut, $fin): array
    {
        $transactions = Transaction::query()
            ->where('agent_id', $agent->id)
            ->where('reseau_mobile_money_id', $reseau->id)
            ->entre($debut, $fin)
            ->get();

        return [
            'depots' => (int) $transactions->where('type', 'depot')->sum('montant'),
            'retraits' => (int) $transactions->where('type', 'retrait')->sum('montant'),
        ];
    }
}