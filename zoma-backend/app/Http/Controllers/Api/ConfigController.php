<?php
// app/Http/Controllers/Api/ConfigController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agence;
use App\Models\PlateformeParis;
use App\Models\ReseauMobileMoney;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Configuration réseau — réservé à l'admin (CDC section 9) : agences,
 * réseaux mobile money, plateformes de paris. Ce sont les listes
 * "configurables, jamais codées en dur" (CDC section 13/14) — jusqu'ici
 * seul Tinker permettait d'y toucher.
 */
class ConfigController extends Controller
{
    // ── Agences ──────────────────────────────────────────────────────

    public function agencesIndex()
    {
        return response()->json(Agence::orderBy('nom')->get());
    }

    public function agencesStore(Request $request)
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'adresse' => ['required', 'string', 'max:255'],
            'ville' => ['required', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:50'],
        ]);

        $agence = Agence::create([...$data, 'statut' => 'active']);

        return response()->json($agence, 201);
    }

    public function agencesUpdate(Request $request, Agence $agence)
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'adresse' => ['required', 'string', 'max:255'],
            'ville' => ['required', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:50'],
        ]);

        $agence->update($data);

        return response()->json($agence);
    }

    public function agencesUpdateStatut(Request $request, Agence $agence)
    {
        $data = $request->validate([
            'statut' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $agence->update($data);

        return response()->json($agence);
    }

    // ── Réseaux mobile money ─────────────────────────────────────────

    public function reseauxIndex()
    {
        return response()->json(ReseauMobileMoney::orderBy('nom')->get());
    }

    public function reseauxStore(Request $request)
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255', 'unique:reseaux_mobile_money,nom'],
        ]);

        $reseau = ReseauMobileMoney::create([...$data, 'statut' => 'actif']);

        return response()->json($reseau, 201);
    }

    public function reseauxUpdateStatut(Request $request, ReseauMobileMoney $reseau)
    {
        $data = $request->validate([
            'statut' => ['required', Rule::in(['actif', 'inactif'])],
        ]);

        $reseau->update($data);

        return response()->json($reseau);
    }

    // ── Plateformes de paris ─────────────────────────────────────────

    public function plateformesIndex()
    {
        return response()->json(PlateformeParis::orderBy('nom')->get());
    }

    public function plateformesStore(Request $request)
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255', 'unique:plateformes_paris,nom'],
        ]);

        $plateforme = PlateformeParis::create([...$data, 'statut' => 'actif']);

        return response()->json($plateforme, 201);
    }

    public function plateformesUpdateStatut(Request $request, PlateformeParis $plateforme)
    {
        $data = $request->validate([
            'statut' => ['required', Rule::in(['actif', 'inactif'])],
        ]);

        $plateforme->update($data);

        return response()->json($plateforme);
    }
}