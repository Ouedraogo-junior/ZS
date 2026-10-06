<?php
// app/Http/Controllers/Api/AgentDemandeController.php

namespace App\Http\Controllers\Api;

use App\Events\DemandeValidee;
use App\Events\NouveauMessageDemande;
use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\DemandeTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Traitement des demandes — utilisé par les agents, les gérants ET les
 * admins (un gérant ou un admin peut dépanner — CDC/fil "gérant et admin
 * peuvent aussi traiter les demandes").
 *
 * Portée d'accès selon le type de compte :
 * - Agent / gérant : scopé à sa propre agence (celle choisie par le
 *   client à la soumission, CDC/fil "chaque agence gère son propre
 *   solde") — $user->agence_id suffit, fonctionne identiquement pour
 *   les deux types de compte.
 * - Admin : portée réseau entier, aucun filtre par agence — un admin
 *   n'a pas d'agence_id propre (toujours null), le scoper comme un
 *   agent/gérant l'exclurait de tout au lieu de tout lui montrer.
 *
 * Pas de rejet : en cas de souci, on échange via le fil de messages
 * plutôt que de rejeter formellement — une demande reste "en_attente"
 * jusqu'à validation, aussi longtemps que nécessaire.
 */
class AgentDemandeController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $demandes = DemandeTransaction::query()
            ->when(! $this->estAdmin($user), fn ($q) => $q->where('agence_id', $user->agence_id))
            ->with([
                'client:id,nom,telephone',
                'agence:id,nom',
                'reseauMobileMoney:id,nom',
                'plateformeParis:id,nom',
                'agent:id,nom',
                'user:id,nom',
            ])
            ->when($request->filled('statut'), fn ($q) => $q->where('statut', $request->string('statut')))
            ->latest()
            ->get();

        return response()->json($demandes);
    }

    public function show(Request $request, DemandeTransaction $demande)
    {
        $this->autoriserAcces($request, $demande);

        return response()->json(
            $demande->load([
                'client:id,nom,telephone',
                'agence:id,nom',
                'reseauMobileMoney:id,nom',
                'plateformeParis:id,nom',
                'agent:id,nom',
                'user:id,nom',
                'messages',
            ])
        );
    }

    public function valider(Request $request, DemandeTransaction $demande)
    {
        $this->autoriserAcces($request, $demande);

        // La vraie protection contre deux personnes validant en même
        // temps est dans DemandeTransaction::valider() (mise à jour
        // atomique) — ici on se contente de traduire l'échec en réponse
        // HTTP propre.
        try {
            $transaction = $demande->valider($request->user());
        } catch (\RuntimeException $e) {
            abort(409, $e->getMessage());
        }

        $demande->refresh();

        event(new DemandeValidee($demande));

        // Mêmes relations que show() — sinon le frontend, qui remplace
        // la demande entière par cette réponse, perd reseau_mobile_money
        // / plateforme_paris / messages (undefined au lieu de l'objet).
        return response()->json([
            'demande' => $demande->load([
                'client:id,nom,telephone',
                'agence:id,nom',
                'reseauMobileMoney:id,nom',
                'plateformeParis:id,nom',
                'agent:id,nom',
                'user:id,nom',
                'messages',
            ]),
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
            'auteur_type' => $request->user() instanceof Agent ? 'agent' : 'gerant',
            'auteur_id' => $request->user()->id,
            'message' => $data['message'],
        ]);

        event(new NouveauMessageDemande($message));

        return response()->json($message, 201);
    }

    /** Sert la preuve de paiement — authentifié, même portée que les autres actions. */
    public function preuve(Request $request, DemandeTransaction $demande)
    {
        $this->autoriserAcces($request, $demande);

        if (! $demande->preuve_paiement || ! Storage::exists($demande->preuve_paiement)) {
            abort(404);
        }

        return Storage::response($demande->preuve_paiement);
    }

    /** Sert la capture de l'ID bookmaker — même portée que la preuve de paiement. */
    public function idCapture(Request $request, DemandeTransaction $demande)
    {
        $this->autoriserAcces($request, $demande);

        if (! $demande->id_bookmaker_capture || ! Storage::exists($demande->id_bookmaker_capture)) {
            abort(404);
        }

        return Storage::response($demande->id_bookmaker_capture);
    }

    private function autoriserAcces(Request $request, DemandeTransaction $demande): void
    {
        $user = $request->user();

        if ($this->estAdmin($user)) {
            return; // portée réseau entier, aucune restriction par agence
        }

        if ($demande->agence_id !== $user->agence_id) {
            abort(403, "Cette demande n'appartient pas à votre agence.");
        }
    }

    private function estAdmin(Agent|User $user): bool
    {
        return $user instanceof User && $user->role === 'admin';
    }
}