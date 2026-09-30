<?php
// database/migrations/2026_01_01_000012_create_clients_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Clients de l'appli mobile (canal distant, remplace WhatsApp).
     * Connexion par numéro de téléphone SEUL, sans PIN — décision
     * assumée : public peu familier avec la technologie, friction à
     * éviter. La session reste connectée durablement sur l'appareil du
     * client (contrairement à un agent sur un poste de guichet partagé,
     * où on redemande la connexion à chaque fois).
     *
     * Le seul vrai risque (quelqu'un se faisant passer pour un client à
     * partir de son numéro) ne concerne concrètement que les retraits —
     * traité côté procédure agent (vérification avant envoi des fonds),
     * pas ici.
     */
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();

            $table->string('nom');
            $table->string('telephone')->unique(); // sert d'identifiant, seul et suffisant

            $table->enum('statut', ['active', 'inactive'])->default('active');
            $table->timestamp('last_login_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};