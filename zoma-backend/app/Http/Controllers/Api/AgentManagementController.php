<?php
// app/Http/Controllers/Api/AgentManagementController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Gestion des agents par un gérant (son agence uniquement) ou un
 * administrateur (n'importe quelle agence) — CDC section 9.
 */
class AgentManagementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $agents = Agent::query()
            ->with('agence:id,nom')
            ->when($user->role === 'gerant', fn ($q) => $q->where('agence_id', $user->agence_id))
            ->orderBy('nom')
            ->get(['id', 'agence_id', 'nom', 'pseudo', 'statut', 'last_login_at', 'created_at']);

        return response()->json($agents);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'pseudo' => ['required', 'string', 'max:255', 'unique:agents,pseudo', 'unique:users,pseudo'],
            'pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]{4}$/'],
            // Un gérant crée pour sa propre agence (agence_id imposé,
            // jamais accepté depuis le payload) ; un admin doit préciser
            // l'agence.
            'agence_id' => $user->role === 'admin'
                ? ['required', 'integer', 'exists:agences,id']
                : ['prohibited'],
        ]);

        $agent = Agent::create([
            'nom' => $data['nom'],
            'pseudo' => $data['pseudo'],
            'pin' => $data['pin'],
            'agence_id' => $user->role === 'admin' ? $data['agence_id'] : $user->agence_id,
            'statut' => 'active',
        ]);

        return response()->json($agent, 201);
    }

    public function updateStatut(Request $request, Agent $agent)
    {
        $this->autoriserAccesAgence($request, $agent);

        $data = $request->validate([
            'statut' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $agent->update(['statut' => $data['statut']]);

        return response()->json($agent);
    }

    public function reinitialiserPin(Request $request, Agent $agent)
    {
        $this->autoriserAccesAgence($request, $agent);

        $data = $request->validate([
            'pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]{4}$/'],
        ]);

        $agent->update([
            'pin' => $data['pin'],
            'failed_pin_attempts' => 0,
            'locked_until' => null,
        ]);

        return response()->json(['message' => 'PIN réinitialisé.']);
    }

    /**
     * Un gérant ne peut agir que sur les agents de sa propre agence ;
     * un admin peut agir sur n'importe lequel.
     */
    private function autoriserAccesAgence(Request $request, Agent $agent): void
    {
        $user = $request->user();

        if ($user->role === 'gerant' && $agent->agence_id !== $user->agence_id) {
            throw ValidationException::withMessages([
                'agent' => "Cet agent n'appartient pas à votre agence.",
            ]);
        }
    }
}