<?php
// app/Http/Controllers/Api/AgentAuthController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Connexion des agents (pseudo + PIN, CDC section 3).
 * Distinct de l'auth gérants/admins (StaffAuthController), même si le
 * mécanisme pseudo+PIN est identique.
 */
class AgentAuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'pseudo' => ['required', 'string'],
            'pin' => ['required', 'string'],
        ]);

        $agent = Agent::where('pseudo', $data['pseudo'])->first();

        // Message volontairement identique pour pseudo inconnu ou PIN faux :
        // on ne révèle jamais si un pseudo existe.
        $identifiantsInvalides = fn () => ValidationException::withMessages([
            'pseudo' => 'Identifiants incorrects.',
        ]);

        if (! $agent) {
            throw $identifiantsInvalides();
        }

        if (! $agent->estActif()) {
            throw ValidationException::withMessages([
                'pseudo' => 'Ce compte agent est désactivé.',
            ]);
        }

        // 423 (Locked) plutôt qu'une erreur de validation classique : on
        // renvoie locked_until pour que le frontend affiche un temps
        // d'attente précis plutôt qu'un vague "réessayez plus tard".
        if ($agent->estVerrouille()) {
            return response()->json([
                'message' => 'Compte temporairement verrouillé suite à plusieurs échecs.',
                'locked_until' => $agent->locked_until->toIso8601String(),
            ], 423);
        }

        if (! Hash::check($data['pin'], $agent->pin)) {
            $agent->enregistrerEchecPin();

            throw $identifiantsInvalides();
        }

        $agent->enregistrerConnexionReussie();

        $token = $agent->createToken('agent-app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'agent' => [
                'id' => $agent->id,
                'nom' => $agent->nom,
                'pseudo' => $agent->pseudo,
                'agence_id' => $agent->agence_id,
                'agence' => $agent->agence->nom,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté.']);
    }

    /**
     * Renvoie l'agent authentifié via son token — sert à restaurer la
     * session côté frontend après un rafraîchissement de page, sans
     * redemander pseudo+PIN tant que le token est valide.
     */
    public function me(Request $request)
    {
        $agent = $request->user();

        return response()->json([
            'agent' => [
                'id' => $agent->id,
                'nom' => $agent->nom,
                'pseudo' => $agent->pseudo,
                'agence_id' => $agent->agence_id,
                'agence' => $agent->agence->nom,
            ],
        ]);
    }
}