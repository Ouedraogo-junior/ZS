<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Table "reclamation_messages" — fil d'échanges d'une réclamation
     * (CDC section 7 : "historique des échanges et réponses conservé sur
     * chaque réclamation").
     *
     * - "auteur_type" distingue un message du client (pas de compte,
     *   donc pas de auteur_id) d'un message du staff (gérant ou admin,
     *   via "users" — jamais "agents", cf. table reclamations).
     * - Supprimée en cascade avec sa réclamation : un message seul n'a
     *   pas de sens hors de son fil.
     * - "created_at" sert d'horodatage du message (même logique que
     *   pour les transactions).
     */
    public function up(): void
    {
        Schema::create('reclamation_messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('reclamation_id')
                ->constrained('reclamations')
                ->cascadeOnDelete();

            $table->enum('auteur_type', ['client', 'staff']);

            $table->foreignId('auteur_id')
                ->nullable() // null quand auteur_type = 'client'
                ->constrained('users')
                ->nullOnDelete();

            $table->text('message');

            $table->timestamps();

            $table->index(['reclamation_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reclamation_messages');
    }
};