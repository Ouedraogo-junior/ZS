<?php
// database/migrations/2026_10_03_000003_add_gerant_to_demande_messages_auteur_type.php
//
// Modification directe en SQL brut (ALTER ... MODIFY) plutôt que via
// ->change() : plus simple et portable pour un élargissement d'énumération
// MySQL, sans dépendre de doctrine/dbal.

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE demande_messages MODIFY auteur_type ENUM('client', 'agent', 'gerant') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE demande_messages MODIFY auteur_type ENUM('client', 'agent') NOT NULL");
    }
};