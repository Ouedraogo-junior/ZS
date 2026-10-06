<?php
// database/migrations/2026_10_06_000001_add_audio_to_demande_messages_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Notes vocales dans le fil de messages d'une demande. Un message est
     * soit un texte, soit une note vocale (parfois les deux) : "message"
     * devient donc nullable, et le fichier audio est stocké en privé,
     * comme la preuve de paiement (chemin dans audio_path, durée en
     * secondes dans audio_duree — durée fournie par l'appli, pour
     * l'affichage uniquement).
     */
    public function up(): void
    {
        Schema::table('demande_messages', function (Blueprint $table) {
            $table->text('message')->nullable()->change();
        });

        Schema::table('demande_messages', function (Blueprint $table) {
            $table->string('audio_path')->nullable()->after('message');
            $table->unsignedSmallInteger('audio_duree')->nullable()->after('audio_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('demande_messages')->whereNull('message')->update(['message' => '']);

        Schema::table('demande_messages', function (Blueprint $table) {
            $table->dropColumn(['audio_path', 'audio_duree']);
        });

        Schema::table('demande_messages', function (Blueprint $table) {
            $table->text('message')->nullable(false)->change();
        });
    }
};