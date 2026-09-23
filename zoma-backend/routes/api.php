<?php

use App\Http\Controllers\Api\AgentAuthController;
use Illuminate\Support\Facades\Route;

// À ajouter dans routes/api.php

Route::post('/agent/login', [AgentAuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/agent/logout', [AgentAuthController::class, 'logout']);
});