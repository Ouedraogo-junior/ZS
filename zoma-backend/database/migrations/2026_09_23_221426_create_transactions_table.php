<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Table "transactions" — CDC section 4 et 10 (version simplifiée validée :
     * pas de commission, pas de champ statut, référence optionnelle).
     *
     * - Pas de champ date/heure manuel : "created_at" sert d'horodatage
     *   automatique (CDC section 4 : "la date et l'heure sont horodatées
     *   automatiquement par le système").
     * - reseau_mobile_money_id / plateforme_paris_id : clés étrangères vers
     *   les listes configurables, pas de valeurs codées en dur.
     * - Pas de suppression silencieuse (CDC section 4) : on utilise les
     *   soft deletes de Laravel (colonne "deleted_at") plutôt qu'un DELETE
     *   réel, pour qu'une transaction annulée reste consultable.
     *   Le détail "qui / quand / pourquoi" d'une correction viendra d'une
     *   table d'historique dédiée, à traiter dans une étape séparée.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('agence_id')
                ->constrained('agences')
                ->restrictOnDelete();

            $table->foreignId('agent_id')
                ->constrained('agents')
                ->restrictOnDelete();

            $table->enum('type', ['depot', 'retrait']);

            $table->foreignId('reseau_mobile_money_id')
                ->constrained('reseaux_mobile_money')
                ->restrictOnDelete();

            $table->foreignId('plateforme_paris_id')
                ->constrained('plateformes_paris')
                ->restrictOnDelete();

            $table->unsignedInteger('montant'); // F CFA, sans décimales
            $table->string('telephone_client');
            $table->string('reference_paiement')->nullable();

            $table->timestamps();
            $table->softDeletes(); // annulation = soft delete, jamais de suppression silencieuse

            // Filtrage fréquent : historique d'un agent sur une période (relève d'équipe),
            // tableau de bord d'une agence sur la journée.
            $table->index(['agent_id', 'created_at']);
            $table->index(['agence_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};