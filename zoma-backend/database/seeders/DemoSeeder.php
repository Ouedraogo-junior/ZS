<?php
// database/seeders/DemoSeeder.php

namespace Database\Seeders;

use App\Models\Agence;
use App\Models\Agent;
use App\Models\Avis;
use App\Models\PlateformeParis;
use App\Models\Reclamation;
use App\Models\ReseauMobileMoney;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Données de démonstration pour le pilote — agences, agents, réseaux,
 * plateformes, gérants, admin, transactions, avis, réclamations.
 *
 * Idempotent : chaque étape utilise firstOrCreate (ou vérifie l'absence
 * de données avant de générer en masse), donc exécutable plusieurs fois
 * sans créer de doublons — contrairement à l'ancien script collé dans
 * Tinker, où une relance partielle a fini par tripler les agences.
 *
 * Usage : php artisan db:seed --class=DemoSeeder
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $agences = $this->seedAgences();
        $reseaux = $this->seedReseaux();
        $plateformes = $this->seedPlateformes();
        $agentsParAgence = $this->seedAgents($agences);
        $this->seedGerantsEtAdmin($agences);
        $this->seedTransactions($agentsParAgence, $reseaux, $plateformes);
        $this->seedAvis($agences);
        $this->seedReclamations($agences);

        $this->command->info(
            'Terminé : ' . $agences->count() . ' agences, ' . Agent::count() . ' agents, '
            . User::count() . ' comptes staff, ' . Transaction::count() . ' transactions, '
            . Avis::count() . ' avis, ' . Reclamation::count() . ' réclamations.'
        );
    }

    private function seedAgences()
    {
        $agencesData = [
            ['nom' => 'Agence Centre-Ville', 'adresse' => 'Avenue Kwame Nkrumah', 'ville' => 'Ouagadougou', 'telephone' => '25 30 12 34'],
            ['nom' => 'Agence Bobo-Dioulasso', 'adresse' => 'Avenue de la Liberté', 'ville' => 'Bobo-Dioulasso', 'telephone' => '20 97 45 67'],
            ['nom' => 'Agence Marché Central', 'adresse' => 'Rue du Commerce', 'ville' => 'Ouagadougou', 'telephone' => '25 31 22 11'],
            ['nom' => 'Agence Ouaga 2000', 'adresse' => 'Boulevard Circulaire', 'ville' => 'Ouagadougou', 'telephone' => '25 37 88 99'],
            ['nom' => 'Agence Koudougou', 'adresse' => 'Avenue de la Gare', 'ville' => 'Koudougou', 'telephone' => '25 44 10 20'],
        ];

        return collect($agencesData)->map(
            fn ($a) => Agence::firstOrCreate(
                ['nom' => $a['nom'], 'ville' => $a['ville']],
                [...$a, 'statut' => 'active']
            )
        );
    }

    private function seedReseaux()
    {
        return collect(['Orange Money', 'Moov Money'])
            ->map(fn ($nom) => ReseauMobileMoney::firstOrCreate(['nom' => $nom], ['statut' => 'actif']));
    }

    private function seedPlateformes()
    {
        return collect(['1xBet', 'Betwinner', 'Melbet', '1Win'])
            ->map(fn ($nom) => PlateformeParis::firstOrCreate(['nom' => $nom], ['statut' => 'actif']));
    }

    /** 2 à 3 agents par agence — ne génère que si l'agence n'en a encore aucun. */
    private function seedAgents($agences): array
    {
        $prenoms = ['Mamadou', 'Fatoumata', 'Ibrahim', 'Aminata', 'Seydou', 'Aïcha', 'Boureima', 'Rasmata', 'Adama', 'Mariam', 'Issouf', 'Salimata'];
        $noms = ['Traoré', 'Ouédraogo', 'Kaboré', 'Sawadogo', 'Zongo', 'Compaoré', 'Nikiema', 'Bationo', 'Kienou', 'Diallo'];

        $agentsParAgence = [];

        foreach ($agences as $agence) {
            $existants = Agent::where('agence_id', $agence->id)->get();

            if ($existants->isNotEmpty()) {
                $agentsParAgence[$agence->id] = $existants->all();
                continue;
            }

            $agentsParAgence[$agence->id] = [];
            $nbAgents = rand(2, 3);

            for ($i = 0; $i < $nbAgents; $i++) {
                $prenom = $prenoms[array_rand($prenoms)];
                $nom = $noms[array_rand($noms)];
                $pseudo = strtolower(substr($prenom, 0, 1) . $nom) . rand(10, 99);

                $agentsParAgence[$agence->id][] = Agent::create([
                    'agence_id' => $agence->id,
                    'nom' => "$prenom $nom",
                    'pseudo' => $pseudo,
                    'pin' => '1234',
                    'statut' => 'active',
                ]);
            }
        }

        return $agentsParAgence;
    }

    private function seedGerantsEtAdmin($agences): void
    {
        foreach ($agences as $agence) {
            User::firstOrCreate(
                ['pseudo' => 'gerant' . $agence->id],
                [
                    'nom' => 'Gérant ' . $agence->ville,
                    'pin' => '1234',
                    'role' => 'gerant',
                    'agence_id' => $agence->id,
                    'statut' => 'active',
                ]
            );
        }

        User::firstOrCreate(
            ['pseudo' => 'admin'],
            [
                'nom' => 'Administrateur Réseau',
                'pin' => '1234',
                'role' => 'admin',
                'statut' => 'active',
            ]
        );
    }

    /** 14 derniers jours — ne génère que si la table est vide, pour ne jamais gonfler le volume à chaque relance. */
    private function seedTransactions(array $agentsParAgence, $reseaux, $plateformes): void
    {
        if (Transaction::count() > 0) {
            return;
        }

        $montants = [2000, 5000, 10000, 15000, 20000, 25000, 50000];

        foreach ($agentsParAgence as $agenceId => $agentsAgence) {
            foreach ($agentsAgence as $agent) {
                for ($jour = 13; $jour >= 0; $jour--) {
                    $nbTransactions = rand(1, 5);

                    for ($t = 0; $t < $nbTransactions; $t++) {
                        $tx = new Transaction([
                            'agence_id' => $agenceId,
                            'agent_id' => $agent->id,
                            'type' => rand(0, 1) ? 'depot' : 'retrait',
                            'reseau_mobile_money_id' => $reseaux->random()->id,
                            'plateforme_paris_id' => $plateformes->random()->id,
                            'montant' => $montants[array_rand($montants)],
                            'telephone_client' => '07' . rand(10000000, 99999999),
                            'reference_paiement' => rand(0, 1) ? 'REF' . rand(100000, 999999) : null,
                        ]);
                        $horodatage = now()->subDays($jour)->subHours(rand(0, 23))->subMinutes(rand(0, 59));
                        $tx->created_at = $horodatage;
                        $tx->updated_at = $horodatage;
                        $tx->save();
                    }
                }
            }
        }
    }

    private function seedAvis($agences): void
    {
        if (Avis::count() > 0) {
            return;
        }

        $avisData = [
            ['nom_client' => 'Moussa Kaboré', 'note' => 5, 'commentaire' => 'Service excellent, agent très professionnel.'],
            ['nom_client' => 'Rasmata Ouédraogo', 'note' => 4, 'commentaire' => "Bon service, un peu d'attente mais efficace."],
            ['nom_client' => 'Adama Sawadogo', 'note' => 2, 'commentaire' => 'Agent indisponible pendant 20 minutes.'],
            ['nom_client' => 'Mariam Traoré', 'note' => 5, 'commentaire' => 'Toujours satisfaite, je recommande.'],
            ['nom_client' => 'Ibrahim Diallo', 'note' => 3, 'commentaire' => 'Correct, manquait de monnaie pour mon retrait.'],
            ['nom_client' => 'Aïcha Zongo', 'note' => 5, 'commentaire' => null],
            ['nom_client' => 'Boureima Compaoré', 'note' => 4, 'commentaire' => 'Rapide et fiable.'],
            ['nom_client' => 'Salimata Kienou', 'note' => 5, 'commentaire' => 'Parfait, comme toujours.'],
        ];

        foreach ($avisData as $i => $a) {
            Avis::create([
                'nom_client' => $a['nom_client'],
                'note' => $a['note'],
                'commentaire' => $a['commentaire'],
                'agence_id' => $agences[$i % $agences->count()]->id,
            ]);
        }
    }

    private function seedReclamations($agences): void
    {
        if (Reclamation::count() > 0) {
            return;
        }

        $reclamationsData = [
            ['nom_client' => 'Kofi Asante', 'contact_client' => '07 45 67 89', 'description' => "Mon dépôt de 15 000 F n'est pas arrivé sur mon compte 1xBet.", 'statut' => 'nouveau'],
            ['nom_client' => 'Aïcha Ouédraogo', 'contact_client' => '05 12 34 56', 'description' => 'Erreur de montant lors de mon retrait, remboursement demandé.', 'statut' => 'en_cours'],
            ['nom_client' => 'Seydou Traoré', 'contact_client' => '07 98 76 54', 'description' => "Délai réseau lors d'un dépôt Orange Money, résolu depuis.", 'statut' => 'resolu'],
            ['nom_client' => 'Fatou Sanou', 'contact_client' => '05 22 33 44', 'description' => "L'agent m'a mal renseigné sur les frais.", 'statut' => 'nouveau'],
            ['nom_client' => 'Yacouba Nikiema', 'contact_client' => '07 33 44 55', 'description' => "Compte bookmaker non crédité après 2h d'attente.", 'statut' => 'en_cours'],
        ];

        foreach ($reclamationsData as $i => $r) {
            Reclamation::create([
                'nom_client' => $r['nom_client'],
                'contact_client' => $r['contact_client'],
                'description' => $r['description'],
                'statut' => $r['statut'],
                'agence_id' => $agences[$i % $agences->count()]->id,
            ]);
        }
    }
}