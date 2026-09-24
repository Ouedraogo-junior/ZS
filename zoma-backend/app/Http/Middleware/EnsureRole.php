<?php

namespace App\Http\Middleware;

use App\Models\Agent;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Garde une route selon le rôle du principal authentifié via Sanctum.
 *
 * Sanctum authentifie indifféremment un Agent ou un User (gérant/admin) —
 * les deux utilisent le même mécanisme pseudo+PIN et le même guard. Sans
 * ce middleware, un token agent pourrait appeler une route gérant/admin
 * (et inversement) et $request->user() renverrait le mauvais type de
 * modèle au contrôleur.
 *
 * Usage dans les routes :
 *   Route::middleware(['auth:sanctum', 'role:agent'])->group(...)
 *   Route::middleware(['auth:sanctum', 'role:gerant,admin'])->group(...)
 *   Route::middleware(['auth:sanctum', 'role:admin'])->group(...)
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $principal = $request->user();

        if (! $principal) {
            abort(401, 'Non authentifié.');
        }

        $roleDuPrincipal = match (true) {
            $principal instanceof Agent => 'agent',
            $principal instanceof User => $principal->role, // 'gerant' ou 'admin'
            default => null,
        };

        if ($roleDuPrincipal === null || ! in_array($roleDuPrincipal, $roles, true)) {
            abort(403, "Accès non autorisé pour ce rôle.");
        }

        return $next($request);
    }
}