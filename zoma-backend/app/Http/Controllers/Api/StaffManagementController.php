<?php
// app/Http/Controllers/Api/StaffManagementController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Gestion des gérants et administrateurs — réservé à l'admin (CDC
 * section 9 : un gérant ne doit pas pouvoir créer d'autres comptes
 * gérant/admin, contrairement aux agents qu'il gère pour sa propre
 * agence via AgentManagementController).
 */
class StaffManagementController extends Controller
{
    public function index()
    {
        $users = User::with('agence:id,nom')
            ->orderBy('nom')
            ->get(['id', 'nom', 'pseudo', 'role', 'agence_id', 'statut', 'last_login_at', 'created_at']);

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'pseudo' => ['required', 'string', 'max:255', 'unique:agents,pseudo', 'unique:users,pseudo'],
            'pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]{4}$/'],
            'role' => ['required', Rule::in(['gerant', 'admin'])],
            // Obligatoire pour un gérant (son agence), absent pour un admin
            // (portée réseau entier — CDC section 9).
            'agence_id' => [
                Rule::requiredIf(fn () => $request->input('role') === 'gerant'),
                'nullable', 'integer', 'exists:agences,id',
            ],
        ]);

        $user = User::create([
            'nom' => $data['nom'],
            'pseudo' => $data['pseudo'],
            'pin' => $data['pin'],
            'role' => $data['role'],
            'agence_id' => $data['role'] === 'gerant' ? $data['agence_id'] : null,
            'statut' => 'active',
        ]);

        return response()->json($user->load('agence:id,nom'), 201);
    }

    public function updateStatut(Request $request, User $user)
    {
        $data = $request->validate([
            'statut' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $user->update(['statut' => $data['statut']]);

        return response()->json($user);
    }

    public function reinitialiserPin(Request $request, User $user)
    {
        $data = $request->validate([
            'pin' => ['required', 'string', 'size:4', 'regex:/^[0-9]{4}$/'],
        ]);

        $user->update([
            'pin' => $data['pin'],
            'failed_pin_attempts' => 0,
            'locked_until' => null,
        ]);

        return response()->json(['message' => 'PIN réinitialisé.']);
    }
}