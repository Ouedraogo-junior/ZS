<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Table "users" — gérants d'agence et administrateurs réseau (CDC section 9).
     * Connexion par pseudo + PIN, comme les agents (même mécanisme,
     * table séparée : voir Agent et la trait HasPinAuthentication).
     *
     * - role = 'gerant' : agence_id obligatoire (son agence).
     * - role = 'admin'  : agence_id null (portée réseau entier).
     *   Règle validée côté application, pas en contrainte SQL.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            $table->foreignId('agence_id')
                ->nullable()
                ->constrained('agences')
                ->restrictOnDelete();

            $table->string('nom');
            $table->string('pseudo')->unique();
            $table->string('pin'); // haché (Hash::make), jamais stocké en clair

            $table->enum('role', ['gerant', 'admin']);
            $table->enum('statut', ['active', 'inactive'])->default('active');

            $table->unsignedTinyInteger('failed_pin_attempts')->default(0);
            $table->timestamp('locked_until')->nullable();
            $table->timestamp('last_login_at')->nullable();

            $table->timestamps();

            $table->index(['role', 'agence_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};