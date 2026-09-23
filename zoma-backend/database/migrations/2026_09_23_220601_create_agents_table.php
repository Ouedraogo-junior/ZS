<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Table "agents" — CDC section 10, complétée avec :
     * - "nom" (nom complet) : nécessaire pour l'affichage côté gérant
     *   (écran "Gestion des agents"), en plus du "pseudo" utilisé pour
     *   la connexion (CDC section 3).
     * - "failed_pin_attempts" / "locked_until" : verrouillage temporaire
     *   après plusieurs échecs de PIN (CDC section 3).
     * - "last_login_at" : alimente la colonne "Dernière activité" du
     *   tableau de bord gérant.
     */
    public function up(): void
    {
        Schema::create('agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agence_id')
                ->constrained('agences')
                ->restrictOnDelete(); // on ne peut pas supprimer une agence qui a encore des agents

            $table->string('nom');
            $table->string('pseudo')->unique();
            $table->string('pin'); // haché (Hash::make), jamais stocké en clair

            $table->enum('statut', ['active', 'inactive'])->default('active');

            $table->unsignedTinyInteger('failed_pin_attempts')->default(0);
            $table->timestamp('locked_until')->nullable();
            $table->timestamp('last_login_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agents');
    }
};