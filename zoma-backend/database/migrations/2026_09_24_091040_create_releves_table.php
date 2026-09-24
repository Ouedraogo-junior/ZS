<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Table "releves" — relève d'équipe / contrôle de caisse (CDC sections
     * 4 et 12) : à chaque changement d'agent, contrôle par réseau mobile
     * money plutôt que par journée calendaire (les agences fonctionnent
     * 24h/24, 7j/7 — CDC section 13).
     *
     * Une relève = un agent + un réseau + une période. Un agent qui boucle
     * un poste avec Orange Money ET Moov Money produit deux lignes.
     *
     * "solde_theorique" et "ecart" sont calculés au moment de la validation
     * (dans le contrôleur, étape suivante) et stockés tels quels : ce sont
     * des constats historiques, qui ne doivent pas bouger si une transaction
     * passée est corrigée plus tard.
     */
    public function up(): void
    {
        Schema::create('releves', function (Blueprint $table) {
            $table->id();

            $table->foreignId('agent_id')
                ->constrained('agents')
                ->restrictOnDelete();

            $table->foreignId('agence_id')
                ->constrained('agences')
                ->restrictOnDelete();

            $table->foreignId('reseau_mobile_money_id')
                ->constrained('reseaux_mobile_money')
                ->restrictOnDelete();

            $table->dateTime('periode_debut');
            $table->dateTime('periode_fin');

            $table->integer('solde_theorique'); // dépôts - retraits sur la période
            $table->integer('solde_reel');       // constaté par l'agent
            $table->integer('ecart');            // solde_reel - solde_theorique

            $table->timestamps();

            $table->index(['agent_id', 'reseau_mobile_money_id', 'periode_fin']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('releves');
    }
};