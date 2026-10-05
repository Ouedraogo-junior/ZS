<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    /**
     * Enregistrer une transaction (dépôt ou retrait) — utilisé par les
     * agents (guichet) ET les gérants (dépannage, CDC/fil "le gérant
     * doit aussi pouvoir faire ce que font les agents"). agent_id XOR
     * user_id est rempli selon le type réel du principal, jamais les
     * deux (même principe que DemandeTransaction::valider()).
     *
     * agent_id/user_id/agence_id ne viennent jamais du client : toujours
     * déduits du principal authentifié, pour que personne ne puisse
     * enregistrer une transaction au nom d'un autre ou d'une autre agence.
     */
    public function store(Request $request)
    {
        $principal = $request->user();
        $estAgent = $principal instanceof Agent;

        $data = $request->validate([
            'type' => ['required', Rule::in(['depot', 'retrait'])],
            'reseau_mobile_money_id' => [
                'required', 'integer',
                Rule::exists('reseaux_mobile_money', 'id')->where('statut', 'actif'),
            ],
            'plateforme_paris_id' => [
                'required', 'integer',
                Rule::exists('plateformes_paris', 'id')->where('statut', 'actif'),
            ],
            'montant' => ['required', 'integer', 'min:1'],
            'telephone_client' => ['required', 'string', 'min:8', 'max:20'],
            'reference_paiement' => ['nullable', 'string', 'max:100'],
        ]);

        $transaction = Transaction::create([
            ...$data,
            'agent_id' => $estAgent ? $principal->id : null,
            'user_id' => $estAgent ? null : $principal->id,
            'agence_id' => $principal->agence_id,
        ]);

        return response()->json([
            'transaction' => $transaction->load(['reseauMobileMoney', 'plateformeParis']),
        ], 201);
    }

    /**
     * Historique PERSONNEL du principal authentifié UNIQUEMENT (CDC
     * section 9 : on ne voit que ses propres transactions, pas celles
     * de toute l'agence) — vrai pour un agent comme pour un gérant.
     *
     * Filtres optionnels (query string) : type, reseau_mobile_money_id,
     * plateforme_paris_id, du (date début), au (date fin).
     */
    public function index(Request $request)
    {
        $principal = $request->user();
        $estAgent = $principal instanceof Agent;

        $query = Transaction::query()
            ->where($estAgent ? 'agent_id' : 'user_id', $principal->id)
            ->with(['reseauMobileMoney', 'plateformeParis', 'demande:id,transaction_id'])
            ->latest();

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        if ($reseauId = $request->query('reseau_mobile_money_id')) {
            $query->where('reseau_mobile_money_id', $reseauId);
        }

        if ($plateformeId = $request->query('plateforme_paris_id')) {
            $query->where('plateforme_paris_id', $plateformeId);
        }

        if ($du = $request->query('du')) {
            $query->where('created_at', '>=', $du);
        }

        if ($au = $request->query('au')) {
            $query->where('created_at', '<=', $au);
        }

        return response()->json(
            $query->paginate($request->integer('par_page', 25))
        );
    }

    /**
     * Un agent annule sa propre transaction — seulement dans la fenêtre
     * de temps autorisée (Transaction::annulableParAgent), et avec un
     * motif obligatoire (CDC section 4 : traçabilité de toute annulation).
     */
    public function annuler(Request $request, Transaction $transaction)
    {
        $agent = $request->user();

        if (! $transaction->annulableParAgent($agent)) {
            abort(403, "Cette transaction ne peut plus être annulée (délai dépassé ou transaction d'un autre agent).");
        }

        $data = $request->validate([
            'motif' => ['required', 'string', 'max:500'],
        ]);

        $transaction->annuler($agent, $data['motif']);

        return response()->json(['message' => 'Transaction annulée.']);
    }
}