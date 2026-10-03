<?php
// database/migrations/2026_10_03_000001_allow_gerant_on_transactions_table.php
//
// Si ->change() échoue avec une erreur mentionnant Doctrine/DBAL :
// composer require doctrine/dbal, puis relancez la migration.

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Un gérant OU un admin peut désormais aussi valider une demande
     * (dépanner un agent) — agent_id devient nullable, et user_id (vers
     * la table users — gérant ou admin, distingués par leur "role")
     * s'ajoute en parallèle. Exactement un des deux est rempli selon qui
     * a traité la transaction, jamais les deux.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['agent_id']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('agent_id')->nullable()->change();
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->foreign('agent_id')->references('id')->on('agents');

            $table->foreignId('user_id')
                ->nullable()
                ->after('agent_id')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropForeign(['agent_id']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('agent_id')->nullable(false)->change();
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->foreign('agent_id')->references('id')->on('agents');
        });
    }
};