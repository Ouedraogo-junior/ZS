<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    /**
     * Enregistrer une transaction (dépôt ou retrait).
     *
     * agent_id / agence_id ne viennent jamais du client : toujours déduits
     * de l'agent authentifié (garanti par le middleware role:agent), pour
     * qu'un agent ne puisse jamais enregistrer une transaction au nom d'un
     * autre ou d'une autre agence.
     */
    public function store(Request $request)
    {
        $agent = $request->user();

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
            'agent_id' => $agent->id,
            'agence_id' => $agent->agence_id,
        ]);

        return response()->json([
            'transaction' => $transaction->load(['reseauMobileMoney', 'plateformeParis']),
        ], 201);
    }

    /**
     * Historique de l'agent authentifié UNIQUEMENT (CDC section 9 :
     * un agent ne voit que ses propres transactions, pas celles de
     * toute l'agence).
     *
     * Filtres optionnels (query string) : type, reseau_mobile_money_id,
     * plateforme_paris_id, du (date début), au (date fin).
     */
    public function index(Request $request)
    {
        $agent = $request->user();

        $query = Transaction::query()
            ->where('agent_id', $agent->id)
            ->with(['reseauMobileMoney', 'plateformeParis'])
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
}