<?php
// app/Http/Controllers/Api/ClientAuthController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Connexion client — numéro de téléphone seul, sans PIN (décision
 * assumée, voir Client::class). Un seul appel fait office d'inscription
 * ET de connexion : si le numéro existe déjà, on connecte directement ;
 * sinon, on crée le compte avec le nom fourni.
 *
 * Pas de middleware "idle" sur ces routes (contrairement à agent/staff) :
 * le client reste connecté durablement sur son propre appareil, pas sur
 * un poste de guichet partagé — voir le commentaire de la migration.
 */
class ClientAuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'telephone' => ['required', 'string', 'max:20'],
        ]);

        $client = Client::firstOrCreate(
            ['telephone' => $data['telephone']],
            ['nom' => $data['nom'], 'statut' => 'active']
        );

        if (! $client->estActif()) {
            throw ValidationException::withMessages([
                'telephone' => 'Ce compte est désactivé.',
            ]);
        }

        $client->forceFill(['last_login_at' => now()])->save();

        $token = $client->createToken('client-app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'client' => $this->clientPayload($client),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté.']);
    }

    /** Restaure la session à partir du token stocké (après réouverture de l'appli). */
    public function me(Request $request)
    {
        return response()->json([
            'client' => $this->clientPayload($request->user()),
        ]);
    }

    private function clientPayload(Client $client): array
    {
        return [
            'id' => $client->id,
            'nom' => $client->nom,
            'telephone' => $client->telephone,
        ];
    }
}