<?php
// routes/api.php

use App\Http\Controllers\Api\AgentAuthController;
use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\Api\StaffAuthController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

Route::post('/agent/login', [AgentAuthController::class, 'login']);
Route::post('/staff/login', [StaffAuthController::class, 'login']);

// "idle" avant "auth:sanctum" sur chaque groupe protégé : voir le
// commentaire dans CheckIdleTimeout.php pour la raison de cet ordre.

Route::middleware(['idle', 'auth:sanctum'])->group(function () {
    Route::get('/reference/reseaux-mobile-money', [ReferenceController::class, 'reseauxMobileMoney']);
    Route::get('/reference/plateformes-paris', [ReferenceController::class, 'plateformesParis']);
});

Route::middleware(['idle', 'auth:sanctum', 'role:agent'])->group(function () {
    Route::post('/agent/logout', [AgentAuthController::class, 'logout']);
    Route::get('/agent/me', [AgentAuthController::class, 'me']);

    Route::post('/agent/transactions', [TransactionController::class, 'store']);
    Route::get('/agent/transactions', [TransactionController::class, 'index']);
});

Route::middleware(['idle', 'auth:sanctum', 'role:gerant,admin'])->group(function () {
    Route::post('/staff/logout', [StaffAuthController::class, 'logout']);
});

Route::middleware(['idle', 'auth:sanctum', 'role:admin'])->group(function () {
    // routes réservées à l'admin seul, à venir
});