<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Liste configurable des réseaux mobile money (Orange Money, Moov Money, ...).
     * Gérée depuis l'écran Admin > Configuration (CDC sections 9 et 13/14) :
     * un administrateur peut en ajouter sans développement.
     * On désactive plutôt que supprimer, pour ne jamais casser l'historique
     * des transactions déjà enregistrées sur un réseau retiré.
     */
    public function up(): void
    {
        Schema::create('reseaux_mobile_money', function (Blueprint $table) {
            $table->id();
            $table->string('nom')->unique(); // ex. "Orange Money", "Moov Money"
            $table->enum('statut', ['actif', 'inactif'])->default('actif');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reseaux_mobile_money');
    }
};