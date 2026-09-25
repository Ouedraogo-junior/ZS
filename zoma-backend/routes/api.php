<?php
// routes/api.php

use App\Http\Controllers\Api\AgentManagementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AvisController;
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

    Route::get('/agent/releves/preparation', [ReleveController::class, 'prepare']);
    Route::post('/agent/releves', [ReleveController::class, 'store']);
});

Route::middleware(['idle', 'auth:sanctum', 'role:gerant,admin'])->group(function () {
    Route::get('/staff/agents', [AgentManagementController::class, 'index']);
    Route::post('/staff/agents', [AgentManagementController::class, 'store']);
    Route::patch('/staff/agents/{agent}/statut', [AgentManagementController::class, 'updateStatut']);
    Route::post('/staff/agents/{agent}/reinitialiser-pin', [AgentManagementController::class, 'reinitialiserPin']);

    Route::get('/staff/transactions', [StaffTransactionController::class, 'index']);

    Route::get('/staff/reclamations', [ReclamationController::class, 'index']);
    Route::get('/staff/reclamations/{reclamation}', [ReclamationController::class, 'show']);
    Route::post('/staff/reclamations/{reclamation}/prendre-en-charge', [ReclamationController::class, 'prendreEnCharge']);
    Route::patch('/staff/reclamations/{reclamation}/statut', [ReclamationController::class, 'updateStatut']);
    Route::post('/staff/reclamations/{reclamation}/messages', [ReclamationController::class, 'storeMessage']);
});

Route::middleware(['idle', 'auth:sanctum', 'role:gerant'])->group(function () {
    Route::get('/staff/dashboard', [DashboardController::class, 'gerant']);
});

Route::middleware(['idle', 'auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/admin/users', [StaffManagementController::class, 'index']);
    Route::post('/admin/users', [StaffManagementController::class, 'store']);
    Route::patch('/admin/users/{user}/statut', [StaffManagementController::class, 'updateStatut']);
    Route::post('/admin/users/{user}/reinitialiser-pin', [StaffManagementController::class, 'reinitialiserPin']);

    Route::get('/admin/avis', [AvisController::class, 'index']);
    Route::delete('/admin/avis/{avis}', [AvisController::class, 'destroy']);

    Route::get('/admin/dashboard', [DashboardController::class, 'admin']);

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