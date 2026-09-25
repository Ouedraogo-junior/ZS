<?php
// app/Http/Controllers/Api/ReferenceController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agence;
use App\Models\PlateformeParis;
use App\Models\ReseauMobileMoney;

/**
 * Listes de référence configurables (CDC section 13/14 : "pas de valeurs
 * codées en dur"). Accessible à tout principal authentifié (agent ou
 * staff), sans restriction de rôle — ce sont des données de lecture
 * seule, non sensibles, utiles aux deux côtés de l'app.
 */
class ReferenceController extends Controller
{
    public function reseauxMobileMoney()
    {
        return response()->json(
            ReseauMobileMoney::actifs()->select('id', 'nom')->orderBy('nom')->get()
        );
    }

    public function plateformesParis()
    {
        return response()->json(
            PlateformeParis::actifs()->select('id', 'nom')->orderBy('nom')->get()
        );
    }

    /** Utile pour les formulaires admin (rattacher un gérant/agent à une agence)
     *  et pour la page publique (liste des agences). */
    public function agences()
    {
        return response()->json(
            Agence::where('statut', 'active')
                ->select('id', 'nom', 'ville', 'adresse', 'telephone')
                ->orderBy('nom')
                ->get()
        );
    }
}