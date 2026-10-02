<?php
// app/Http/Controllers/Api/AgentDemandeController.php

namespace App\Http\Controllers\Api;

use App\Events\DemandeValidee;
use App\Events\NouveauMessageDemande;
use App\Http\Controllers\Controller;
use App\Models\DemandeTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Traitement des demandes côté agent — scopées à sa propre agence
 * (celle choisie par le client à la soumission, CDC/fil : "chaque
 * agence gère son propre solde"). Pas de rejet : en cas de souci,
 * l'agent échange via le fil de messages plutôt que de rejeter
 * formellement (décision du fil de discussion) — une demande reste
 * "en_attente" jusqu'à validation, aussi longtemps que nécessaire.
 */
class AgentDemandeController extends Controller
{
    public function index(Request $request)
    {
        $agent = $request->user();

        $demandes = DemandeTransaction::query()
            ->where('agence_id', $agent->agence_id)
            ->with(['client:id,nom,telephone', 'reseauMobileMoney:id,nom', 'plateformeParis:id,nom'])
            ->when($request->filled('statut'), fn ($q) => $q->where('statut', $request->string('statut')))
            ->latest()
            ->get();

        return response()->json($demandes);
    }

    public function show(Request $request, DemandeTransaction $demande)
    {
        $this->autoriserAcces($request, $demande);

        return response()->json(
            $demande->load(['client:id,nom,telephone', 'reseauMobileMoney:id,nom', 'plateformeParis:id,nom', 'messages'])
        );
    }

    public function valider(Request $request, DemandeTransaction $demande)
    {
        $this->autoriserAcces($request, $demande);

        // La vraie protection contre deux agents validant en même temps
        // est dans DemandeTransaction::valider() (mise à jour atomique) —
        // ici on se contente de traduire l'échec en réponse HTTP propre.
        try {
            $transaction = $demande->valider($request->user());
        } catch (\RuntimeException $e) {
            abort(409, $e->getMessage());
        }

        $demande->refresh();

        event(new DemandeValidee($demande));

        return response()->json([
            'demande' => $demande->load('client:id,nom,telephone'),
            'transaction' => $transaction,
        ]);
    }

    public function storeMessage(Request $request, DemandeTransaction $demande)
    {
        $this->autoriserAcces($request, $demande);

        $data = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $message = $demande->messages()->create([
            'auteur_type' => 'agent',
            'auteur_id' => $request->user()->id,
            'message' => $data['message'],
        ]);

        event(new NouveauMessageDemande($message));

        return response()->json($message, 201);
    }

    /** Sert la preuve de paiement — authentifié, scopé à l'agence de l'agent. */
    public function preuve(Request $request, DemandeTransaction $demande)
    {
        $this->autoriserAcces($request, $demande);

        if (! $demande->preuve_paiement || ! Storage::exists($demande->preuve_paiement)) {
            abort(404);
        }

        return Storage::response($demande->preuve_paiement);
    }

    private function autoriserAcces(Request $request, DemandeTransaction $demande): void
    {
        if ($demande->agence_id !== $request->user()->agence_id) {
            abort(403, "Cette demande n'appartient pas à votre agence.");
        }
    }
}