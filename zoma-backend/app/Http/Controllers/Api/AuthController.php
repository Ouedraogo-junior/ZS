<?php
// app/Http/Controllers/Api/AuthController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Connexion unique pour tout le monde (agents, gérants, administrateurs) —
 * même écran, même formulaire pseudo + PIN côté frontend. Ce contrôleur
 * détermine lui-même le type de compte et redirige la réponse en
 * conséquence via "role" ; c'est au frontend d'aiguiller vers le bon
 * espace une fois connecté.
 *
 * Remplace AgentAuthController et StaffAuthController (supprimés).
 */
class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'pseudo' => ['required', 'string'],
            'pin' => ['required', 'string'],
        ]);

        // On cherche d'abord côté agent, puis côté staff. Un même pseudo
        // ne devrait normalement exister que dans une seule des deux
        // tables — à faire respecter lors de la création des comptes
        // (étape "Endpoints de configuration", à venir).
        $principal = Agent::where('pseudo', $data['pseudo'])->first()
            ?? User::where('pseudo', $data['pseudo'])->first();

        // Message volontairement identique pour pseudo inconnu ou PIN
        // faux : on ne révèle jamais si un pseudo existe.
        $identifiantsInvalides = fn () => ValidationException::withMessages([
            'pseudo' => 'Identifiants incorrects.',
        ]);

        if (! $principal) {
            throw $identifiantsInvalides();
        }

        if (! $principal->estActif()) {
            throw ValidationException::withMessages([
                'pseudo' => 'Ce compte est désactivé.',
            ]);
        }

        if ($principal->estVerrouille()) {
            return response()->json([
                'message' => 'Compte temporairement verrouillé suite à plusieurs échecs.',
                'locked_until' => $principal->locked_until->toIso8601String(),
            ], 423);
        }

        if (! Hash::check($data['pin'], $principal->pin)) {
            $principal->enregistrerEchecPin();

            throw $identifiantsInvalides();
        }

        $principal->enregistrerConnexionReussie();

        $token = $principal->createToken('zoma-app')->plainTextToken;

        return response()->json([
            'token' => $token,
            ...$this->sessionPayload($principal),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté.']);
    }

    /**
     * Restaure la session à partir du token stocké côté frontend, après
     * un rafraîchissement de page.
     */
    public function me(Request $request)
    {
        return response()->json($this->sessionPayload($request->user()));
    }

    /**
     * Modification de son propre profil (nom, pseudo, PIN) — n'importe
     * quel compte connecté, agent ou staff. Le changement de PIN exige de
     * connaître le PIN actuel (protège un appareil laissé connecté sans
     * surveillance) ; nom et pseudo n'en ont pas besoin.
     */
    public function updateProfile(Request $request)
    {
        $principal = $request->user();

        // Unicité vérifiée dans SA propre table (en s'excluant lui-même)
        // ET dans l'autre table (aucune exclusion : un agent ne doit
        // jamais prendre le pseudo d'un gérant, et inversement).
        $regleDansSaTable = $principal instanceof Agent
            ? Rule::unique('agents', 'pseudo')->ignore($principal->id)
            : Rule::unique('users', 'pseudo')->ignore($principal->id);
        $regleDansLAutreTable = $principal instanceof Agent
            ? Rule::unique('users', 'pseudo')
            : Rule::unique('agents', 'pseudo');

        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'pseudo' => ['required', 'string', 'max:255', $regleDansSaTable, $regleDansLAutreTable],
            'pin' => ['nullable', 'string', 'size:4', 'regex:/^[0-9]{4}$/'],
            'pin_actuel' => ['required_with:pin', 'string'],
        ]);

        if (isset($data['pin']) && ! Hash::check($data['pin_actuel'], $principal->pin)) {
            throw ValidationException::withMessages([
                'pin_actuel' => 'PIN actuel incorrect.',
            ]);
        }

        $principal->nom = $data['nom'];
        $principal->pseudo = $data['pseudo'];
        if (isset($data['pin'])) {
            $principal->pin = $data['pin']; // haché automatiquement (HasPinAuthentication)
        }
        $principal->save();

        return response()->json($this->sessionPayload($principal));
    }

    /**
     * Forme de réponse commune à login() et me(), qu'il s'agisse d'un
     * Agent ou d'un User (gérant/admin) — le frontend n'a qu'une seule
     * forme à connaître ("role" + "profile"), jamais deux.
     */
    private function sessionPayload(Agent|User $principal): array
    {
        if ($principal instanceof Agent) {
            return [
                'role' => 'agent',
                'profile' => [
                    'id' => $principal->id,
                    'nom' => $principal->nom,
                    'pseudo' => $principal->pseudo,
                    'agence_id' => $principal->agence_id,
                    'agence' => $principal->agence->nom,
                ],
            ];
        }

        return [
            'role' => $principal->role, // 'gerant' ou 'admin'
            'profile' => [
                'id' => $principal->id,
                'nom' => $principal->nom,
                'pseudo' => $principal->pseudo,
                'agence_id' => $principal->agence_id,
                'agence' => $principal->agence?->nom,
            ],
        ];
    }
}