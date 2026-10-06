<?php
// routes/api.php

use App\Http\Controllers\Api\AgentDemandeController;
use App\Http\Controllers\Api\AgentManagementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AvisController;
use App\Http\Controllers\Api\ClientAuthController;
use App\Http\Controllers\Api\ClientDemandeController;
use App\Http\Controllers\Api\ConfigController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReclamationController;
use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\Api\ReleveController;
use App\Http\Controllers\Api\StaffManagementController;
use App\Http\Controllers\Api\StaffTransactionController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

// Connexion unique pour tout le monde (agents, gérants, administrateurs) —
// voir AuthController pour le détail. "idle" avant "auth:sanctum" sur
// chaque groupe protégé : voir le commentaire dans CheckIdleTimeout.php.

Route::post('/login', [AuthController::class, 'login']);

// Connexion client — pas de middleware "idle" ici : le client reste
// connecté durablement sur son propre appareil (voir ClientAuthController).
Route::post('/client/login', [ClientAuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/client/logout', [ClientAuthController::class, 'logout']);
    Route::get('/client/me', [ClientAuthController::class, 'me']);

    Route::post('/client/demandes', [ClientDemandeController::class, 'store']);
    Route::get('/client/demandes', [ClientDemandeController::class, 'index']);
    Route::get('/client/demandes/{demande}', [ClientDemandeController::class, 'show']);
    Route::get('/client/demandes/{demande}/preuve', [ClientDemandeController::class, 'preuve']);
    Route::get('/client/demandes/{demande}/id-capture', [ClientDemandeController::class, 'idCapture']);
    Route::get('/client/demandes/{demande}/messages/{message}/audio', [ClientDemandeController::class, 'audioMessage']);
    Route::post('/client/demandes/{demande}/messages', [ClientDemandeController::class, 'storeMessage']);
});

// Formulaires et listes publics (site vitrine) — aucune authentification requise.
Route::get('/agences', [ReferenceController::class, 'agences']);
Route::get('/reseaux-mobile-money', [ReferenceController::class, 'reseauxMobileMoney']);
Route::get('/plateformes-paris', [ReferenceController::class, 'plateformesParis']);
Route::get('/avis', [AvisController::class, 'index']);
Route::post('/avis', [AvisController::class, 'store']);
Route::post('/reclamations', [ReclamationController::class, 'store']);

Route::middleware(['idle', 'auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::patch('/me', [AuthController::class, 'updateProfile']);

    Route::get('/reference/reseaux-mobile-money', [ReferenceController::class, 'reseauxMobileMoney']);
    Route::get('/reference/plateformes-paris', [ReferenceController::class, 'plateformesParis']);
    Route::get('/reference/agences', [ReferenceController::class, 'agences']);
});

Route::middleware(['idle', 'auth:sanctum', 'role:agent'])->group(function () {
    Route::post('/agent/transactions', [TransactionController::class, 'store']);
    Route::get('/agent/transactions', [TransactionController::class, 'index']);
    Route::post('/agent/transactions/{transaction}/annuler', [TransactionController::class, 'annuler']);

    Route::get('/agent/releves/preparation', [ReleveController::class, 'prepare']);
    Route::post('/agent/releves', [ReleveController::class, 'store']);

    Route::get('/agent/demandes', [AgentDemandeController::class, 'index']);
    Route::get('/agent/demandes/{demande}', [AgentDemandeController::class, 'show']);
    Route::post('/agent/demandes/{demande}/valider', [AgentDemandeController::class, 'valider']);
    Route::post('/agent/demandes/{demande}/messages', [AgentDemandeController::class, 'storeMessage']);
    Route::get('/agent/demandes/{demande}/preuve', [AgentDemandeController::class, 'preuve']);
    Route::get('/agent/demandes/{demande}/id-capture', [AgentDemandeController::class, 'idCapture']);
    Route::get('/agent/demandes/{demande}/messages/{message}/audio', [AgentDemandeController::class, 'audioMessage']);
});

Route::middleware(['idle', 'auth:sanctum', 'role:gerant,admin'])->group(function () {
    Route::get('/staff/agents', [AgentManagementController::class, 'index']);
    Route::post('/staff/agents', [AgentManagementController::class, 'store']);
    Route::patch('/staff/agents/{agent}/statut', [AgentManagementController::class, 'updateStatut']);
    Route::post('/staff/agents/{agent}/reinitialiser-pin', [AgentManagementController::class, 'reinitialiserPin']);

    Route::get('/staff/transactions', [StaffTransactionController::class, 'index']);
    Route::post('/staff/transactions/{transaction}/annuler', [StaffTransactionController::class, 'annuler']);

    Route::get('/staff/reclamations', [ReclamationController::class, 'index']);
    Route::get('/staff/reclamations/{reclamation}', [ReclamationController::class, 'show']);
    Route::post('/staff/reclamations/{reclamation}/prendre-en-charge', [ReclamationController::class, 'prendreEnCharge']);
    Route::patch('/staff/reclamations/{reclamation}/statut', [ReclamationController::class, 'updateStatut']);
    Route::post('/staff/reclamations/{reclamation}/messages', [ReclamationController::class, 'storeMessage']);
});

Route::middleware(['idle', 'auth:sanctum', 'role:gerant'])->group(function () {
    Route::get('/staff/dashboard', [DashboardController::class, 'gerant']);

    // Mêmes méthodes que côté agent (TransactionController) — un gérant
    // peut aussi saisir une transaction directement et consulter son
    // propre historique personnel.
    Route::post('/staff/transactions', [TransactionController::class, 'store']);
    Route::get('/staff/transactions-personnelles', [TransactionController::class, 'index']);

    // Mêmes méthodes que côté agent (AgentDemandeController) — un
    // gérant peut aussi traiter les demandes de son agence (dépannage).
    Route::get('/staff/demandes', [AgentDemandeController::class, 'index']);
    Route::get('/staff/demandes/{demande}', [AgentDemandeController::class, 'show']);
    Route::post('/staff/demandes/{demande}/valider', [AgentDemandeController::class, 'valider']);
    Route::post('/staff/demandes/{demande}/messages', [AgentDemandeController::class, 'storeMessage']);
    Route::get('/staff/demandes/{demande}/preuve', [AgentDemandeController::class, 'preuve']);
    Route::get('/staff/demandes/{demande}/id-capture', [AgentDemandeController::class, 'idCapture']);
    Route::get('/staff/demandes/{demande}/messages/{message}/audio', [AgentDemandeController::class, 'audioMessage']);
});

Route::middleware(['idle', 'auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/admin/users', [StaffManagementController::class, 'index']);
    Route::post('/admin/users', [StaffManagementController::class, 'store']);
    Route::patch('/admin/users/{user}/statut', [StaffManagementController::class, 'updateStatut']);
    Route::post('/admin/users/{user}/reinitialiser-pin', [StaffManagementController::class, 'reinitialiserPin']);

    Route::get('/admin/avis', [AvisController::class, 'index']);
    Route::delete('/admin/avis/{avis}', [AvisController::class, 'destroy']);

    Route::get('/admin/dashboard', [DashboardController::class, 'admin']);

    // Mêmes méthodes que côté agent/gérant — l'admin voit tout le
    // réseau (pas de filtre par agence, voir AgentDemandeController).
    Route::get('/admin/demandes', [AgentDemandeController::class, 'index']);
    Route::get('/admin/demandes/{demande}', [AgentDemandeController::class, 'show']);
    Route::post('/admin/demandes/{demande}/valider', [AgentDemandeController::class, 'valider']);
    Route::post('/admin/demandes/{demande}/messages', [AgentDemandeController::class, 'storeMessage']);
    Route::get('/admin/demandes/{demande}/preuve', [AgentDemandeController::class, 'preuve']);
    Route::get('/admin/demandes/{demande}/id-capture', [AgentDemandeController::class, 'idCapture']);
    Route::get('/admin/demandes/{demande}/messages/{message}/audio', [AgentDemandeController::class, 'audioMessage']);

    Route::get('/admin/agences', [ConfigController::class, 'agencesIndex']);
    Route::post('/admin/agences', [ConfigController::class, 'agencesStore']);
    Route::patch('/admin/agences/{agence}', [ConfigController::class, 'agencesUpdate']);
    Route::patch('/admin/agences/{agence}/statut', [ConfigController::class, 'agencesUpdateStatut']);

    Route::get('/admin/reseaux-mobile-money', [ConfigController::class, 'reseauxIndex']);
    Route::post('/admin/reseaux-mobile-money', [ConfigController::class, 'reseauxStore']);
    Route::patch('/admin/reseaux-mobile-money/{reseau}/statut', [ConfigController::class, 'reseauxUpdateStatut']);

    Route::get('/admin/plateformes-paris', [ConfigController::class, 'plateformesIndex']);
    Route::post('/admin/plateformes-paris', [ConfigController::class, 'plateformesStore']);
    Route::patch('/admin/plateformes-paris/{plateforme}/statut', [ConfigController::class, 'plateformesUpdateStatut']);
});