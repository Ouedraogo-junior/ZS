<?php
// app/Http/Controllers/Api/Concerns/GereMessagesDemande.php

namespace App\Http\Controllers\Api\Concerns;

use App\Events\NouveauMessageDemande;
use App\Models\DemandeMessage;
use App\Models\DemandeTransaction;
use App\Support\Diffusion;
use App\Support\NoteVocale;
use App\Support\Push;
use Illuminate\Http\Request;

/**
 * Enregistrement et lecture des messages d'une demande (texte ou note
 * vocale), commun au contrôleur client et au contrôleur agent/gérant/
 * admin — une seule version de la validation et du stockage, plutôt que
 * deux copies qui finiraient par diverger.
 *
 * L'autorisation d'accès à la demande reste faite par chaque contrôleur
 * (autoriserAcces) AVANT d'appeler ces méthodes : elle diffère selon le
 * type de compte.
 */
trait GereMessagesDemande
{
    /** Durée maximale d'une note vocale, en secondes — alignée sur l'appli mobile. */
    protected function dureeMaxNoteVocale(): int
    {
        return NoteVocale::DUREE_MAX;
    }

    /**
     * Valide et enregistre un message : un texte, une note vocale, ou les
     * deux. Le fichier audio est stocké en privé (jamais d'URL publique),
     * comme la preuve de paiement.
     */
    protected function enregistrerMessage(Request $request, DemandeTransaction $demande, string $auteurType): DemandeMessage
    {
        $data = $request->validate([
            'message' => ['nullable', 'required_without:audio', 'string', 'max:1000'],
            'audio' => [
                'bail',
                'nullable',
                'required_without:message',
                'file',
                'max:3072', // 3 Mo — en pratique plafonné par upload_max_filesize de PHP (2 Mo par défaut)
                NoteVocale::regleFormat(),
            ],
            'audio_duree' => ['nullable', 'integer', 'min:1', 'max:'.($this->dureeMaxNoteVocale() + 10)],
        ]);

        $cheminAudio = null;
        $dureeAudio = null;

        if ($request->hasFile('audio')) {
            $cheminAudio = $request->file('audio')->store('audios');
            $dureeAudio = isset($data['audio_duree']) ? (int) $data['audio_duree'] : null;
        }

        $message = $demande->messages()->create([
            'auteur_type' => $auteurType,
            'auteur_id' => $request->user()->id,
            'message' => $data['message'] ?? null,
            'audio_path' => $cheminAudio,
            'audio_duree' => $dureeAudio,
        ]);

        Diffusion::emettre(new NouveauMessageDemande($message));
        Push::nouveauMessage($message);

        return $message;
    }

    /** Sert le fichier audio d'un message — authentifié, jamais une URL publique. */
    protected function servirAudio(DemandeTransaction $demande, DemandeMessage $message)
    {
        // La route porte deux identifiants : le message doit bien
        // appartenir à CETTE demande (dont l'accès vient d'être vérifié).
        abort_unless((int) $message->demande_transaction_id === (int) $demande->id, 404);

        return NoteVocale::servir($message->audio_path);
    }
}