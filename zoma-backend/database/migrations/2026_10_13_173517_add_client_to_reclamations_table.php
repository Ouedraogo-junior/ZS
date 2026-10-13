<?php
// database/migrations/2026_10_13_000003_add_client_to_reclamations_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Une réclamation faite depuis l'appli est reliée à son auteur (le
     * client connecté) et, si elle concerne une demande précise, à cette
     * demande. Cela permet au client de retrouver SES réclamations et d'être
     * prévenu de leur avancement.
     *
     * Les deux colonnes sont facultatives : les réclamations déposées depuis
     * le site (sans compte) restent valides, sans client ni demande.
     */
    public function up(): void
    {
        Schema::table('reclamations', function (Blueprint $table) {
            $table->foreignId('client_id')
                ->nullable()
                ->after('agence_id')
                ->constrained('clients')
                ->nullOnDelete();

            $table->foreignId('demande_transaction_id')
                ->nullable()
                ->after('client_id')
                ->constrained('demande_transactions')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('reclamations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('demande_transaction_id');
            $table->dropConstrainedForeignId('client_id');
        });
    }
};