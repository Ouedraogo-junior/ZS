<?php

use App\Http\Controllers\Api\AgentAuthController;
use App\Http\Controllers\Api\StaffAuthController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

Route::post('/agent/login', [AgentAuthController::class, 'login']);
Route::post('/staff/login', [StaffAuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'role:agent'])->group(function () {
    Route::post('/agent/logout', [AgentAuthController::class, 'logout']);

    Route::post('/agent/transactions', [TransactionController::class, 'store']);
    Route::get('/agent/transactions', [TransactionController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'role:gerant,admin'])->group(function () {
    Route::post('/staff/logout', [StaffAuthController::class, 'logout']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // routes réservées à l'admin seul, à venir
});