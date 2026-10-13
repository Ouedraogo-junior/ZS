<?php
// app/Http/Controllers/Api/ClientReclamationController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\DemandeTransaction;
use App\Models\Reclamation;
use App\Support\NoteVocale;
use App\Support\Push;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Réclamations déposées depuis l'appli par un client connecté.
 *
 * Contrairement au formulaire du site (ReclamationController::store, sans
 * compte), le client n'a rien à saisir sur lui-même : son nom et son
 * numéro viennent de son compte, l'agence de la demande concernée (ou de
 * son choix), et la demande est reliée à la réclamation pour que le gérant
 * voie de quelle transaction il s'agit.
 *
 * Le traitement (prise en charge, statut, notes) reste du côté du
 * personnel : ReclamationController.
 */
class ClientReclamationController extends Controller
{
    /** Réclamations du client connecté, les plus récentes d'abord. */
    public function index(Request $request)
    {
        $client = $this->client($request);

        return response()->json(
            // Toutes les colonnes : has_audio se calcule à partir d'audio_path
            // (qui, lui, n'est jamais renvoyé — voir $hidden sur le modèle).
            Reclamation::where('client_id', $client->id)
                ->with('agence:id,nom')
                ->latest()
                ->get()
        );
    }

    public function store(Request $request)
    {
        $client = $this->client($request);

        $data = $request->validate([
            // Un texte OU une note vocale (pour qui ne sait pas écrire), ou les deux.
            'description' => ['nullable', 'required_without:audio', 'string', 'min:5', 'max:2000'],
            'audio' => [
                'bail',
                'nullable',
                'required_without:description',
                'file',
                'max:3072', // 3 Mo — en pratique plafonné par upload_max_filesize de PHP
                NoteVocale::regleFormat(),
            ],
            'audio_duree' => ['nullable', 'integer', 'min:1', 'max:'.(NoteVocale::DUREE_MAX + 10)],
            // Une demande qui appartient bien à CE client, jamais celle d'un autre.
            'demande_id' => ['nullable', 'integer', Rule::exists('demande_transactions', 'id')->where('client_id', $client->id)],
            // Obligatoire quand la réclamation ne vise pas une demande précise :
            // sans agence, aucun gérant en particulier n'en serait responsable.
            'agence_id' => ['required_without:demande_id', 'nullable', 'integer', Rule::exists('agences', 'id')->where('statut', 'active')],
        ]);

        $demande = isset($data['demande_id']) ? DemandeTransaction::find($data['demande_id']) : null;

        // Stockage privé, comme la preuve de paiement : servi uniquement par
        // une route authentifiée (audio()), jamais par une URL publique.
        $cheminAudio = $request->hasFile('audio') ? $request->file('audio')->store('reclamation_audios') : null;

        $reclamation = Reclamation::create([
            'client_id' => $client->id,
            'demande_transaction_id' => $demande?->id,
            'agence_id' => $demande?->agence_id ?? ($data['agence_id'] ?? null),
            'nom_client' => $client->nom,
            'contact_client' => $client->telephone,
            'description' => $data['description'] ?? null,
            'audio_path' => $cheminAudio,
            'audio_duree' => $cheminAudio && isset($data['audio_duree']) ? (int) $data['audio_duree'] : null,
            // Affiché tel quel dans la liste du gérant (écran existant).
            'reference_transaction' => $demande ? 'Demande n°'.$demande->id : null,
            'statut' => 'nouveau',
        ]);

        Push::nouvelleReclamation($reclamation);

        return response()->json($reclamation->load('agence:id,nom'), 201);
    }

    /** Sert la note vocale de SA réclamation — authentifié, jamais une URL publique. */
    public function audio(Request $request, Reclamation $reclamation)
    {
        abort_unless($reclamation->client_id === $this->client($request)->id, 403);

        return NoteVocale::servir($reclamation->audio_path);
    }

    /** Ces routes sont dans le groupe "auth:sanctum" commun : on vérifie le type de compte. */
    private function client(Request $request): Client
    {
        $utilisateur = $request->user();

        abort_unless($utilisateur instanceof Client, 403, 'Réservé aux clients.');

        return $utilisateur;
    }
}