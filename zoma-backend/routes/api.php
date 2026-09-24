<?php
// routes/api.php

use App\Http\Controllers\Api\AgentManagementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\Api\ReleveController;
use App\Http\Controllers\Api\StaffManagementController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

// Connexion unique pour tout le monde (agents, gérants, administrateurs) —
// voir AuthController pour le détail. "idle" avant "auth:sanctum" sur
// chaque groupe protégé : voir le commentaire dans CheckIdleTimeout.php.

Route::post('/login', [AuthController::class, 'login']);

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
});

Route::middleware(['idle', 'auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/admin/users', [StaffManagementController::class, 'index']);
    Route::post('/admin/users', [StaffManagementController::class, 'store']);
    Route::patch('/admin/users/{user}/statut', [StaffManagementController::class, 'updateStatut']);
    Route::post('/admin/users/{user}/reinitialiser-pin', [StaffManagementController::class, 'reinitialiserPin']);
});