<?php
// app/Http/Controllers/Api/ConfigController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agence;
use App\Models\PlateformeParis;
use App\Models\ReseauMobileMoney;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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

    public function agencesPhoto(Request $request, Agence $agence)
    {
        return response()->json($this->enregistrerImage($request, $agence, 'photo', 'agences', 1024));
    }

    public function agencesPhotoDestroy(Agence $agence)
    {
        return response()->json($this->supprimerImage($agence, 'photo'));
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

    public function reseauxLogo(Request $request, ReseauMobileMoney $reseau)
    {
        return response()->json($this->enregistrerImage($request, $reseau, 'logo', 'logos', 512));
    }

    public function reseauxLogoDestroy(ReseauMobileMoney $reseau)
    {
        return response()->json($this->supprimerImage($reseau, 'logo'));
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

    public function plateformesLogo(Request $request, PlateformeParis $plateforme)
    {
        return response()->json($this->enregistrerImage($request, $plateforme, 'logo', 'logos', 512));
    }

    public function plateformesLogoDestroy(PlateformeParis $plateforme)
    {
        return response()->json($this->supprimerImage($plateforme, 'logo'));
    }

    // ── Images (logos, photos d'agence) ──────────────────────────────

    /**
     * Enregistre l'image envoyée dans le champ $champ du modèle, sur le
     * disque "public" (ces images ne sont pas sensibles et doivent être
     * servies directement par Nginx via public/storage — voir
     * "php artisan storage:link"). L'ancien fichier est supprimé, pour
     * ne pas laisser d'images orphelines s'accumuler sur le serveur.
     *
     * Le SVG est refusé exprès (il peut contenir du script) ; le site
     * web redimensionne et convertit en PNG/JPG avant l'envoi, donc un
     * logo SVG choisi par l'admin arrive quand même ici en PNG.
     */
    private function enregistrerImage(Request $request, Model $modele, string $champ, string $dossier, int $maxKo): Model
    {
        $request->validate([
            $champ => ['required', 'file', 'mimes:png,jpg,jpeg,webp', 'max:'.$maxKo],
        ]);

        $ancienChemin = $modele->getRawOriginal($champ);
        $chemin = $request->file($champ)->store($dossier, 'public');

        $modele->update([$champ => $chemin]);

        if ($ancienChemin) {
            Storage::disk('public')->delete($ancienChemin);
        }

        return $modele->fresh();
    }

    private function supprimerImage(Model $modele, string $champ): Model
    {
        $chemin = $modele->getRawOriginal($champ);

        if ($chemin) {
            Storage::disk('public')->delete($chemin);
            $modele->update([$champ => null]);
        }

        return $modele->fresh();
    }
}