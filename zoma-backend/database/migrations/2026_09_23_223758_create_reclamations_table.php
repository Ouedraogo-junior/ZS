<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Table "reclamations" — CDC section 7 et 10.
     * "assigne_a_id" pointe vers "users" (gérant ou admin), jamais vers
     * "agents" : ce sont les gérants/admins qui traitent les réclamations
     * (CDC section 9). Le fil d'échanges (CDC : "historique des échanges
     * et réponses conservé sur chaque réclamation") sera une table à part
     * ("reclamation_messages"), une réclamation ayant plusieurs messages —
     * prochaine étape.
     * La notification WhatsApp au client à chaque changement de statut
     * (CDC section 7) est un comportement applicatif, pas un champ ici :
     * "contact_client" fournit le numéro à notifier.
     */
    public function up(): void
    {
        Schema::create('reclamations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('agence_id')
                ->nullable()
                ->constrained('agences')
                ->nullOnDelete(); // agence concernée, optionnelle (CDC section 7)

            $table->string('nom_client');
            $table->string('contact_client'); // téléphone ou email
            $table->text('description');

            $table->string('reference_transaction')->nullable();
            $table->string('piece_jointe')->nullable(); // chemin du fichier stocké

            $table->enum('statut', ['nouveau', 'en_cours', 'resolu'])->default('nouveau');

            $table->foreignId('assigne_a_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index(['statut', 'agence_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reclamations');
    }
};