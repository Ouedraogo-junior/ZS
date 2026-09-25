<?php
// app/Http/Controllers/Api/ReclamationController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reclamation;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Réclamations clients — CDC section 7.
 *
 * Simplifications assumées pour cette première version :
 * - Pas encore de pièce jointe (upload de fichier) : à ajouter séparément.
 * - Pas d'attribution automatique au gérant : n'importe quel gérant de
 *   l'agence concernée (ou un admin) "prend en charge" la réclamation,
 *   plutôt qu'un système d'assignation automatique.
 * - Pas de notification WhatsApp automatisée côté serveur (nécessiterait
 *   un accès à l'API WhatsApp Business, non disponible) : le frontend
 *   ouvre une conversation WhatsApp pré-remplie (lien wa.me), comme pour
 *   le fil de messages du prototype d'origine.
 */
class ReclamationController extends Controller
{
    /** Soumission publique — aucune authentification requise. */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nom_client' => ['required', 'string', 'max:255'],
            'contact_client' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:2000'],
            'reference_transaction' => ['nullable', 'string', 'max:100'],
            'agence_id' => ['nullable', 'integer', 'exists:agences,id'],
        ]);

        $reclamation = Reclamation::create([
            ...$data,
            'statut' => 'nouveau',
        ]);

        return response()->json($reclamation, 201);
    }

    /**
     * Liste : un gérant voit celles de sa propre agence, plus celles sans
     * agence précisée par le client ; un admin voit tout.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $reclamations = Reclamation::query()
            ->with(['agence:id,nom', 'assigneA:id,nom'])
            ->when($user->role === 'gerant', function ($q) use ($user) {
                $q->where(function ($q2) use ($user) {
                    $q2->where('agence_id', $user->agence_id)
                        ->orWhereNull('agence_id');
                });
            })
            ->latest()
            ->get();

        return response()->json($reclamations);
    }

    public function show(Request $request, Reclamation $reclamation)
    {
        $this->autoriserAcces($request, $reclamation);

        return response()->json(
            $reclamation->load(['agence:id,nom', 'assigneA:id,nom', 'messages.auteur:id,nom'])
        );
    }

    /** Prendre en charge une réclamation (s'auto-assigner). */
    public function prendreEnCharge(Request $request, Reclamation $reclamation)
    {
        $this->autoriserAcces($request, $reclamation);

        $reclamation->update([
            'assigne_a_id' => $request->user()->id,
            'statut' => $reclamation->statut === 'nouveau' ? 'en_cours' : $reclamation->statut,
        ]);

        return response()->json($reclamation->fresh()->load(['agence:id,nom', 'assigneA:id,nom']));
    }

    public function updateStatut(Request $request, Reclamation $reclamation)
    {
        $this->autoriserAcces($request, $reclamation);

        $data = $request->validate([
            'statut' => ['required', Rule::in(['nouveau', 'en_cours', 'resolu'])],
        ]);

        $reclamation->changerStatut($data['statut']);

        return response()->json($reclamation->fresh()->load(['agence:id,nom', 'assigneA:id,nom']));
    }

    public function storeMessage(Request $request, Reclamation $reclamation)
    {
        $this->autoriserAcces($request, $reclamation);

        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $message = $reclamation->messages()->create([
            'auteur_type' => 'staff',
            'auteur_id' => $request->user()->id,
            'message' => $data['message'],
        ]);

        return response()->json($message->load('auteur:id,nom'), 201);
    }

    /**
     * Un gérant ne peut agir que sur une réclamation de sa propre agence,
     * ou une sans agence précisée ; un admin peut agir sur toutes.
     */
    private function autoriserAcces(Request $request, Reclamation $reclamation): void
    {
        $user = $request->user();

        if ($user->role === 'gerant'
            && $reclamation->agence_id !== null
            && $reclamation->agence_id !== $user->agence_id
        ) {
            abort(403, "Cette réclamation n'appartient pas à votre agence.");
        }
    }
}