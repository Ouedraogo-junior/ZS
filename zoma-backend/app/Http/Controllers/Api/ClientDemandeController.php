<?php
// app/Http/Controllers/Api/ClientDemandeController.php

namespace App\Http\Controllers\Api;

use App\Events\NouveauMessageDemande;
use App\Events\NouvelleDemandeSoumise;
use App\Http\Controllers\Controller;
use App\Models\DemandeTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * Demandes côté client : soumission, suivi, fil de messages de secours,
 * consultation de sa propre preuve de paiement. Le traitement (valider/
 * rejeter) est côté agent — contrôleur séparé, à venir.
 */
class ClientDemandeController extends Controller
{
    public function store(Request $request)
    {
        $client = $request->user();

        $data = $request->validate([
            'agence_id' => ['required', 'integer', Rule::exists('agences', 'id')->where('statut', 'active')],
            'type' => ['required', Rule::in(['depot', 'retrait'])],
            'reseau_mobile_money_id' => ['required', 'integer', Rule::exists('reseaux_mobile_money', 'id')->where('statut', 'actif')],
            'plateforme_paris_id' => ['required', 'integer', Rule::exists('plateformes_paris', 'id')->where('statut', 'actif')],
            'montant' => ['required', 'integer', 'min:1'],
            'id_bookmaker' => ['required', 'string', 'max:100'],
            'telephone_mobile_money' => ['required_if:type,retrait', 'nullable', 'string', 'max:20'],
            'preuve' => ['required_if:type,depot', 'nullable', 'file', 'image', 'max:5120'], // 5 Mo max
        ]);

        $cheminPreuve = null;
        if ($request->hasFile('preuve')) {
            // Disque "local" (storage/app/), jamais public : pas besoin de
            // storage:link (lien symbolique parfois bloqué sur un
            // hébergement mutualisé). Servi via une route authentifiée
            // dédiée (preuve()), jamais une URL publique directe — ce
            // sont des documents financiers sensibles.
            $cheminPreuve = $request->file('preuve')->store('preuves');
        }

        $demande = DemandeTransaction::create([
            'client_id' => $client->id,
            'agence_id' => $data['agence_id'],
            'type' => $data['type'],
            'reseau_mobile_money_id' => $data['reseau_mobile_money_id'],
            'plateforme_paris_id' => $data['plateforme_paris_id'],
            'montant' => $data['montant'],
            'id_bookmaker' => $data['id_bookmaker'],
            'telephone_mobile_money' => $data['telephone_mobile_money'] ?? null,
            'preuve_paiement' => $cheminPreuve,
            'statut' => 'en_attente',
        ]);

        $demande->load(['agence:id,nom', 'reseauMobileMoney:id,nom', 'plateformeParis:id,nom']);

        event(new NouvelleDemandeSoumise($demande));

        return response()->json($demande, 201);
    }

    /** Demandes du client connecté, les plus récentes d'abord. */
    public function index(Request $request)
    {
        $demandes = $request->user()->demandes()
            ->with(['agence:id,nom', 'reseauMobileMoney:id,nom', 'plateformeParis:id,nom'])
            ->latest()
            ->get();

        return response()->json($demandes);
    }

    public function show(Request $request, DemandeTransaction $demande)
    {
        $this->autoriserAcces($request, $demande);

        return response()->json(
            $demande->load(['agence:id,nom', 'reseauMobileMoney:id,nom', 'plateformeParis:id,nom', 'messages'])
        );
    }

    public function storeMessage(Request $request, DemandeTransaction $demande)
    {
        $this->autoriserAcces($request, $demande);

        $data = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $message = $demande->messages()->create([
            'auteur_type' => 'client',
            'auteur_id' => $request->user()->id,
            'message' => $data['message'],
        ]);

        event(new NouveauMessageDemande($message));

        return response()->json($message, 201);
    }

    /** Sert la preuve de paiement — authentifié, jamais une URL publique. */
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
        if ($demande->client_id !== $request->user()->id) {
            abort(403);
        }
    }
}