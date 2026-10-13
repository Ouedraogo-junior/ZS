<?php
// app/Http/Controllers/Api/PushTokenController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushToken;
use Illuminate\Http\Request;

/**
 * Enregistrement du téléphone de l'utilisateur connecté pour les
 * notifications. Commun aux clients, agents et gérants : $request->user()
 * est le bon compte quel que soit son type.
 */
class PushTokenController extends Controller
{
    /** Appelé par l'appli après chaque connexion (et à chaque démarrage). */
    public function store(Request $request)
    {
        $data = $request->validate([
            // Forme d'un jeton Expo : ExponentPushToken[xxxx] (ou ExpoPushToken[xxxx]).
            'token' => ['required', 'string', 'max:255', 'regex:/^Expo(nent)?PushToken\[.+\]$/'],
            'plateforme' => ['nullable', 'string', 'max:20'],
        ]);

        $utilisateur = $request->user();

        // updateOrCreate sur le jeton : s'il existe déjà (même téléphone,
        // autre compte avant), il est simplement réattribué à celui-ci.
        PushToken::updateOrCreate(
            ['token' => $data['token']],
            [
                'tokenable_type' => $utilisateur->getMorphClass(),
                'tokenable_id' => $utilisateur->getKey(),
                'plateforme' => $data['plateforme'] ?? null,
            ]
        );

        return response()->json(['ok' => true]);
    }

    /** Appelé par l'appli à la déconnexion : ce téléphone ne reçoit plus rien pour ce compte. */
    public function destroy(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:255'],
        ]);

        $utilisateur = $request->user();

        PushToken::where('token', $data['token'])
            ->where('tokenable_type', $utilisateur->getMorphClass())
            ->where('tokenable_id', $utilisateur->getKey())
            ->delete();

        return response()->json(['ok' => true]);
    }
}