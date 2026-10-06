<?php
// database/migrations/2026_10_05_000001_add_id_bookmaker_capture_to_demande_transactions_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Un client qui ne sait pas écrire ne peut pas taper son ID bookmaker
     * (un code mêlant lettres et chiffres) : il peut à la place joindre
     * une capture d'écran de son compte. L'ID texte devient donc optionnel
     * — mais au moins l'un des deux est exigé à la soumission (règle
     * côté application, voir ClientDemandeController::store).
     */
    public function up(): void
    {
        Schema::table('demande_transactions', function (Blueprint $table) {
            $table->string('id_bookmaker')->nullable()->change();
        });

        Schema::table('demande_transactions', function (Blueprint $table) {
            $table->string('id_bookmaker_capture')->nullable()->after('id_bookmaker');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('demande_transactions')->whereNull('id_bookmaker')->update(['id_bookmaker' => '']);

        Schema::table('demande_transactions', function (Blueprint $table) {
            $table->dropColumn('id_bookmaker_capture');
        });

        Schema::table('demande_transactions', function (Blueprint $table) {
            $table->string('id_bookmaker')->nullable(false)->change();
        });
    }
};