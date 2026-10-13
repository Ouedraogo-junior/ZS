<?php
// database/migrations/2026_10_13_000002_create_push_tokens_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Un "jeton de notification" identifie un téléphone auprès du service
     * de notifications d'Expo. Il appartient à un compte — client, agent
     * ou gérant, donc trois tables différentes : d'où la relation
     * "polymorphe" (tokenable_type + tokenable_id).
     *
     * Le jeton est UNIQUE : si deux personnes se connectent à tour de rôle
     * sur le même téléphone, il passe simplement de l'une à l'autre (voir
     * PushTokenController::store) — l'ancien propriétaire ne reçoit plus
     * les notifications destinées à son compte sur un appareil qui n'est
     * plus le sien.
     */
    public function up(): void
    {
        Schema::create('push_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('token')->unique();
            $table->string('plateforme', 20)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_tokens');
    }
};