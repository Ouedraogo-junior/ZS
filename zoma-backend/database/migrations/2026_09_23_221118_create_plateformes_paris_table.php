<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Liste configurable des plateformes de paris (1xBet, Betwinner, ...).
     * Même logique que reseaux_mobile_money : gérée par l'admin, jamais
     * codée en dur (CDC sections 9 et 13/14).
     */
    public function up(): void
    {
        Schema::create('plateformes_paris', function (Blueprint $table) {
            $table->id();
            $table->string('nom')->unique(); // ex. "1xBet", "Betwinner"
            $table->enum('statut', ['actif', 'inactif'])->default('actif');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plateformes_paris');
    }
};