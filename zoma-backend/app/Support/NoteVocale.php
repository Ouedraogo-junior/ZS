<?php
// app/Support/NoteVocale.php

namespace App\Support;

use Closure;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Règles communes à toutes les notes vocales (messages d'une demande,
 * réclamations) : une seule liste de formats, une seule durée maximale,
 * une seule façon de servir le fichier.
 */
class NoteVocale
{
    /** Durée maximale d'une note vocale, en secondes — alignée sur l'appli mobile. */
    public const DUREE_MAX = 120;

    /**
     * Contrôle par extension plutôt que par type MIME détecté : une note
     * enregistrée au format AAC (.m4a) est souvent détectée comme
     * "video/mp4" ou "audio/mp4" selon le téléphone, ce qui ferait refuser
     * des fichiers valides.
     */
    private const EXTENSIONS = ['m4a', 'mp4', 'aac', '3gp', 'amr', 'mp3', 'wav', 'caf'];

    /** Règle de validation du format, à placer dans la liste de règles du champ audio. */
    public static function regleFormat(): Closure
    {
        return function (string $attribut, mixed $valeur, Closure $echec) {
            if (! $valeur instanceof UploadedFile
                || ! in_array(strtolower($valeur->getClientOriginalExtension()), self::EXTENSIONS, true)) {
                $echec('Format audio non pris en charge.');
            }
        };
    }

    /**
     * Sert un fichier audio — authentifié, jamais une URL publique.
     * response()->file() (et non Storage::response()) : il gère les
     * requêtes "Range", dont le lecteur du téléphone a besoin pour lire un
     * .m4a dont l'index est en fin de fichier sans devoir le télécharger
     * en entier avant de démarrer.
     */
    public static function servir(?string $chemin)
    {
        abort_unless($chemin && Storage::exists($chemin), 404);

        return response()->file(Storage::path($chemin), [
            'Content-Type' => Storage::mimeType($chemin) ?: 'audio/mp4',
        ]);
    }
}