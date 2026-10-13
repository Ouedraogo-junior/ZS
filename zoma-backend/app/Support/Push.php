<?php
// app/Support/Push.php

namespace App\Support;

use App\Models\Agent;
use App\Models\Client;
use App\Models\DemandeMessage;
use App\Models\DemandeTransaction;
use App\Models\PushToken;
use App\Models\Reclamation;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

/**
 * Notifications sur les téléphones (service Expo → Firebase → Android),
 * pour prévenir quelqu'un quand l'appli est fermée.
 *
 * Même philosophie que Diffusion : un CONFORT qui ne doit jamais faire
 * échouer l'action en cours. Et pour ne pas faire attendre l'utilisateur,
 * l'envoi se fait APRÈS que la réponse lui a été renvoyée (terminating) :
 * il ne ralentit ni l'envoi d'une demande ni une validation.
 *
 * Qui est prévenu :
 *  - nouvelle demande     → les agents ET le gérant de l'agence concernée ;
 *  - demande validée      → le client ;
 *  - nouveau message      → l'autre partie (le client si l'auteur est du
 *                           personnel, sinon le personnel de l'agence) ;
 *  - nouvelle réclamation → les gérants de l'agence concernée ;
 *  - réclamation prise en charge ou résolue → le client qui l'a déposée.
 *
 * Le champ "pour" des données permet à l'appli d'ignorer une notification
 * arrivée sur un téléphone où, entre-temps, un autre type de compte s'est
 * connecté.
 */
class Push
{
    private const URL_EXPO = 'https://exp.host/--/api/v2/push/send';

    public static function nouvelleDemande(DemandeTransaction $demande): void
    {
        self::apresReponse(function () use ($demande) {
            $demande->loadMissing(['client:id,nom', 'plateformeParis:id,nom']);

            self::envoyer(
                self::appareilsDuPersonnel((int) $demande->agence_id),
                'Nouvelle demande',
                self::resume($demande).' — '.$demande->client->nom,
                ['type' => 'nouvelle_demande', 'pour' => 'personnel', 'demande_id' => $demande->id]
            );
        });
    }

    public static function demandeValidee(DemandeTransaction $demande): void
    {
        self::apresReponse(function () use ($demande) {
            $demande->loadMissing(['plateformeParis:id,nom']);

            $nature = $demande->type === 'depot' ? 'dépôt' : 'retrait';

            self::envoyer(
                self::appareilsDuClient((int) $demande->client_id),
                'Demande validée',
                'Votre '.$nature.' de '.self::montant($demande).' ('.$demande->plateformeParis->nom.') a été validé.',
                ['type' => 'demande_validee', 'pour' => 'client', 'demande_id' => $demande->id]
            );
        });
    }

    public static function nouveauMessage(DemandeMessage $message): void
    {
        self::apresReponse(function () use ($message) {
            $demande = DemandeTransaction::with('client:id,nom')->find($message->demande_transaction_id);

            if (! $demande) {
                return;
            }

            $apercu = filled($message->message) ? Str::limit($message->message, 100) : 'Note vocale';

            if ($message->auteur_type === 'client') {
                $appareils = self::appareilsDuPersonnel((int) $demande->agence_id);
                $titre = 'Message de '.$demande->client->nom;
                $pour = 'personnel';
            } else {
                $appareils = self::appareilsDuClient((int) $demande->client_id);
                $titre = 'Nouveau message';
                $pour = 'client';
            }

            self::envoyer(
                $appareils,
                $titre,
                $apercu,
                ['type' => 'nouveau_message', 'pour' => $pour, 'demande_id' => $demande->id]
            );
        });
    }

    public static function nouvelleReclamation(Reclamation $reclamation): void
    {
        self::apresReponse(function () use ($reclamation) {
            self::envoyer(
                self::appareilsDesGerants($reclamation->agence_id),
                'Nouvelle réclamation',
                $reclamation->nom_client.' : '.($reclamation->description ? Str::limit($reclamation->description, 100) : 'note vocale'),
                ['type' => 'nouvelle_reclamation', 'pour' => 'gerant', 'reclamation_id' => $reclamation->id]
            );
        });
    }

    /**
     * Prévient le client dont la réclamation vient d'être prise en charge
     * ou résolue. Rien si elle ne vient pas de l'appli (pas de compte à
     * prévenir), si l'état n'a pas changé, ou si elle repasse à "nouveau".
     */
    public static function reclamationMiseAJour(Reclamation $reclamation, string $ancienStatut): void
    {
        if (! $reclamation->client_id
            || $reclamation->statut === $ancienStatut
            || $reclamation->statut === 'nouveau') {
            return;
        }

        self::apresReponse(function () use ($reclamation) {
            [$titre, $corps] = $reclamation->statut === 'resolu'
                ? ['Réclamation résolue', 'Votre réclamation a été traitée. Merci de votre patience.']
                : ['Réclamation prise en charge', "Le gérant s'occupe de votre réclamation."];

            self::envoyer(
                self::appareilsDuClient((int) $reclamation->client_id),
                $titre,
                $corps,
                ['type' => 'reclamation_mise_a_jour', 'pour' => 'client', 'reclamation_id' => $reclamation->id]
            );
        });
    }

    /**
     * Envoie une notification à une liste d'appareils (par lots de 100,
     * maximum accepté par Expo) et supprime ceux qu'Expo déclare morts
     * (application désinstallée, jeton périmé).
     * Public pour pouvoir la tester à la main depuis tinker.
     *
     * @param  Collection<int, PushToken>  $appareils
     * @param  array<string, mixed>  $donnees
     */
    public static function envoyer(Collection $appareils, string $titre, string $corps, array $donnees = []): void
    {
        foreach ($appareils->values()->chunk(100) as $lot) {
            $lot = $lot->values();

            $messages = $lot->map(fn (PushToken $appareil) => [
                'to' => $appareil->token,
                'title' => $titre,
                'body' => $corps,
                'data' => $donnees,
                'sound' => 'default',
                'channelId' => 'default',
                'priority' => 'high',
            ])->all();

            $reponse = Http::timeout(8)->acceptJson()->post(self::URL_EXPO, $messages);

            if (! $reponse->successful()) {
                report(new \RuntimeException('Envoi des notifications refusé par Expo (HTTP '.$reponse->status().') : '.Str::limit($reponse->body(), 300)));

                continue;
            }

            // Expo répond dans le même ordre que les messages envoyés.
            foreach ((array) $reponse->json('data') as $i => $accuse) {
                $erreur = $accuse['details']['error'] ?? null;

                if (($accuse['status'] ?? null) === 'error' && $erreur === 'DeviceNotRegistered' && isset($lot[$i])) {
                    $lot[$i]->delete();
                }
            }
        }
    }

    /** Agents actifs ET gérant actif d'une agence. */
    private static function appareilsDuPersonnel(int $agenceId): Collection
    {
        $agents = Agent::where('agence_id', $agenceId)->where('statut', 'active')->pluck('id');
        $gerants = User::where('role', 'gerant')->where('agence_id', $agenceId)->where('statut', 'active')->pluck('id');

        return PushToken::query()
            ->where(fn ($q) => $q->where('tokenable_type', (new Agent)->getMorphClass())->whereIn('tokenable_id', $agents))
            ->orWhere(fn ($q) => $q->where('tokenable_type', (new User)->getMorphClass())->whereIn('tokenable_id', $gerants))
            ->get();
    }

    /** Gérants actifs d'une agence — ou de toutes si la réclamation n'en précise aucune. */
    private static function appareilsDesGerants(?int $agenceId): Collection
    {
        $gerants = User::where('role', 'gerant')
            ->where('statut', 'active')
            ->when($agenceId !== null, fn ($q) => $q->where('agence_id', $agenceId))
            ->pluck('id');

        return PushToken::where('tokenable_type', (new User)->getMorphClass())
            ->whereIn('tokenable_id', $gerants)
            ->get();
    }

    private static function appareilsDuClient(int $clientId): Collection
    {
        return PushToken::where('tokenable_type', (new Client)->getMorphClass())
            ->where('tokenable_id', $clientId)
            ->get();
    }

    private static function montant(DemandeTransaction $demande): string
    {
        return number_format((int) $demande->montant, 0, ',', ' ').' F CFA';
    }

    /** "Dépôt de 2 000 F CFA (Betwinner)" */
    private static function resume(DemandeTransaction $demande): string
    {
        return ($demande->type === 'depot' ? 'Dépôt' : 'Retrait')
            .' de '.self::montant($demande)
            .' ('.$demande->plateformeParis->nom.')';
    }

    /** Exécute le travail une fois la réponse renvoyée, sans jamais laisser une erreur remonter. */
    private static function apresReponse(callable $travail): void
    {
        app()->terminating(function () use ($travail) {
            try {
                $travail();
            } catch (Throwable $e) {
                report($e);
            }
        });
    }
}