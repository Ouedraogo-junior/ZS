<?php
// database/migrations/2026_10_13_000001_add_images_to_reference_tables.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Images affichées dans le formulaire de demande du client, pour qu'il
     * puisse choisir sans savoir lire : un logo pour chaque réseau mobile
     * money et chaque plateforme de paris, une photo pour chaque agence.
     *
     * Les images sont stockées sur le disque "public" (elles ne sont pas
     * sensibles, contrairement aux preuves de paiement) ; la colonne ne
     * contient que le chemin relatif du fichier.
     */
    public function up(): void
    {
        Schema::table('reseaux_mobile_money', function (Blueprint $table) {
            $table->string('logo')->nullable()->after('nom');
        });

        Schema::table('plateformes_paris', function (Blueprint $table) {
            $table->string('logo')->nullable()->after('nom');
        });

        Schema::table('agences', function (Blueprint $table) {
            $table->string('photo')->nullable()->after('telephone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reseaux_mobile_money', function (Blueprint $table) {
            $table->dropColumn('logo');
        });

        Schema::table('plateformes_paris', function (Blueprint $table) {
            $table->dropColumn('logo');
        });

        Schema::table('agences', function (Blueprint $table) {
            $table->dropColumn('photo');
        });
    }
};