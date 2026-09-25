<?php
// app/Http/Controllers/Api/AvisController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Avis;
use Illuminate\Http\Request;

/**
 * Avis clients — CDC section 6 : publication immédiate, sans modération
 * préalable ; l'admin peut supprimer un avis inapproprié a posteriori.
 */
class AvisController extends Controller
{
    /**
     * Soumission publique — aucune authentification requise.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nom_client' => ['required', 'string', 'max:255'],
            'note' => ['required', 'integer', 'min:1', 'max:5'],
            'commentaire' => ['nullable', 'string', 'max:2000'],
            'agence_id' => ['nullable', 'integer', 'exists:agences,id'],
        ]);

        $avis = Avis::create($data);

        return response()->json($avis, 201);
    }

    /** Liste pour modération — réservé à l'admin. */
    public function index()
    {
        return response()->json(
            Avis::with('agence:id,nom')->latest()->get()
        );
    }

    /** Suppression d'un avis inapproprié — réservé à l'admin. */
    public function destroy(Avis $avis)
    {
        $avis->delete();

        return response()->json(['message' => 'Avis supprimé.']);
    }
}