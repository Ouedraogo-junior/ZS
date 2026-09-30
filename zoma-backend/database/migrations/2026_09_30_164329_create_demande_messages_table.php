<?php
// database/migrations/2026_01_01_000014_create_demande_messages_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fil de messages de secours sur une demande — pas le moyen principal
     * de soumission (le formulaire structuré l'est), juste un canal pour
     * les clarifications ponctuelles (ex. "renvoyez une capture plus
     * nette"). Même logique que reclamation_messages : pas de contrainte
     * de clé étrangère unique sur auteur_id, la table dépend du type
     * (client ou agent).
     */
    public function up(): void
    {
        Schema::create('demande_messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('demande_transaction_id')
                ->constrained('demande_transactions')
                ->cascadeOnDelete();

            $table->enum('auteur_type', ['client', 'agent']);
            $table->unsignedBigInteger('auteur_id');

            $table->text('message');

            $table->timestamps();

            $table->index(['demande_transaction_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('demande_messages');
    }
};