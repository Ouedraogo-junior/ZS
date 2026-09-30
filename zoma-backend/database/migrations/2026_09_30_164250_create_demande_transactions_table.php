<?php
// database/migrations/2026_01_01_000013_create_demande_transactions_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Demande de dépôt/retrait soumise par un client via l'appli mobile —
     * remplace la négociation libre sur WhatsApp par un formulaire
     * structuré. Le client choisit lui-même l'agence : chaque agence
     * gère son propre solde mobile money, un dépôt doit donc viser le
     * compte d'une agence précise plutôt qu'une caisse commune au réseau.
     * Seuls les agents de cette agence (ou l'admin) peuvent la traiter.
     *
     * Une fois validée, "transaction_id" pointe vers la vraie transaction
     * créée automatiquement — aucune ressaisie par l'agent.
     */
    public function up(): void
    {
        Schema::create('demande_transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('client_id')
                ->constrained('clients')
                ->restrictOnDelete();

            $table->foreignId('agence_id')
                ->constrained('agences')
                ->restrictOnDelete();

            $table->enum('type', ['depot', 'retrait']);

            $table->foreignId('reseau_mobile_money_id')
                ->constrained('reseaux_mobile_money')
                ->restrictOnDelete();

            $table->foreignId('plateforme_paris_id')
                ->constrained('plateformes_paris')
                ->restrictOnDelete();

            $table->unsignedInteger('montant');
            $table->string('id_bookmaker'); // identifiant du client sur la plateforme de paris

            // Requis pour un retrait (où envoyer les fonds), non pertinent
            // pour un dépôt (validé côté application, pas en contrainte SQL).
            $table->string('telephone_mobile_money')->nullable();

            // Capture d'écran de la preuve de paiement (dépôt) — chemin du
            // fichier stocké. Optionnel pour couvrir le cas d'un retrait.
            $table->string('preuve_paiement')->nullable();

            // Pas de statut "rejetee" : en cas de souci, l'agent en discute
            // avec le client via le fil de messages plutôt que de rejeter
            // formellement — une demande reste "en_attente" jusqu'à
            // validation, aussi longtemps que nécessaire.
            $table->enum('statut', ['en_attente', 'validee'])->default('en_attente');

            $table->foreignId('agent_id')
                ->nullable()
                ->constrained('agents')
                ->nullOnDelete();

            $table->foreignId('transaction_id')
                ->nullable()
                ->constrained('transactions')
                ->nullOnDelete();

            $table->timestamps();

            $table->index(['statut', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('demande_transactions');
    }
};