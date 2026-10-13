<?php
// database/migrations/2026_10_13_000004_add_audio_to_reclamations_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Un client qui ne sait ni lire ni écrire peut faire sa réclamation par
     * une note vocale. Le texte devient donc facultatif (au moins l'un des
     * deux est exigé par la validation, pas par la base), et le fichier
     * audio est stocké en privé — chemin dans audio_path, durée en secondes
     * dans audio_duree (fournie par l'appli, pour l'affichage) — exactement
     * comme les notes vocales du fil de messages d'une demande.
     */
    public function up(): void
    {
        Schema::table('reclamations', function (Blueprint $table) {
            $table->text('description')->nullable()->change();
            $table->string('audio_path')->nullable()->after('description');
            $table->unsignedSmallInteger('audio_duree')->nullable()->after('audio_path');
        });
    }

    public function down(): void
    {
        Schema::table('reclamations', function (Blueprint $table) {
            $table->dropColumn(['audio_path', 'audio_duree']);
            // Les réclamations vocales n'ont pas de texte : on ne peut pas
            // rétablir NOT NULL sans leur en donner un.
            // (description reste nullable au retour en arrière.)
        });
    }
};