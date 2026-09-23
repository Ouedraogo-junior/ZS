<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Table "avis" — CDC section 6 et 10.
     * Publication immédiate, sans modération préalable : l'admin peut
     * supprimer un avis inapproprié a posteriori, donc un vrai DELETE
     * suffit ici (contrairement aux transactions, aucune exigence de
     * traçabilité n'a été posée pour les avis dans le CDC).
     * "created_at" sert de date de publication, comme pour les transactions.
     */
    public function up(): void
    {
        Schema::create('avis', function (Blueprint $table) {
            $table->id();

            $table->foreignId('agence_id')
                ->nullable()
                ->constrained('agences')
                ->nullOnDelete(); // avis facultativement lié à une agence (CDC section 6)

            $table->string('nom_client');
            $table->unsignedTinyInteger('note'); // 1 à 5, validé côté application
            $table->text('commentaire')->nullable();

            $table->timestamps();

            $table->index('agence_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('avis');
    }
};