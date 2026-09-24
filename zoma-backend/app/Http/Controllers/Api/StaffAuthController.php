<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Connexion des gérants et administrateurs (pseudo + PIN, même mécanisme
 * que les agents — voir AgentAuthController et le trait HasPinAuthentication).
 */
class StaffAuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'pseudo' => ['required', 'string'],
            'pin' => ['required', 'string'],
        ]);

        $user = User::where('pseudo', $data['pseudo'])->first();

        // Message volontairement identique pour pseudo inconnu ou PIN faux.
        $identifiantsInvalides = fn () => ValidationException::withMessages([
            'pseudo' => 'Identifiants incorrects.',
        ]);

        if (! $user) {
            throw $identifiantsInvalides();
        }

        if (! $user->estActif()) {
            throw ValidationException::withMessages([
                'pseudo' => 'Ce compte est désactivé.',
            ]);
        }

        if ($user->estVerrouille()) {
            throw ValidationException::withMessages([
                'pseudo' => 'Compte temporairement verrouillé suite à plusieurs échecs. Réessayez plus tard.',
            ]);
        }

        if (! Hash::check($data['pin'], $user->pin)) {
            $user->enregistrerEchecPin();

            throw $identifiantsInvalides();
        }

        $user->enregistrerConnexionReussie();

        $token = $user->createToken('staff-app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'nom' => $user->nom,
                'pseudo' => $user->pseudo,
                'role' => $user->role, // 'gerant' ou 'admin'
                'agence_id' => $user->agence_id,
                'agence' => $user->agence?->nom, // null pour un admin (portée réseau)
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté.']);
    }
}