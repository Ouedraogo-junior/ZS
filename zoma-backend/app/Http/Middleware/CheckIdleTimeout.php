<?php
// app/Http/Middleware/CheckIdleTimeout.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * Déconnecte un compte inactif depuis trop longtemps — expiration par
 * INACTIVITÉ, pas un TTL fixe depuis la connexion (config/sanctum.php
 * "expiration" reste à null, cette approche remplace ce réglage).
 *
 * Doit s'exécuter AVANT auth:sanctum dans la liste de middlewares d'une
 * route : Sanctum met lui-même à jour last_used_at dès qu'il authentifie
 * la requête, donc lire ce champ après coup montrerait déjà "maintenant".
 * Ici on relit le token nous-mêmes en amont, avant que Sanctum n'y touche.
 */
class CheckIdleTimeout
{
    /** Minutes d'inactivité avant déconnexion automatique. */
    private const MAX_INACTIVITE_MINUTES = 60;

    public function handle(Request $request, Closure $next): Response
    {
        $bearerToken = $request->bearerToken();

        if ($bearerToken) {
            $accessToken = PersonalAccessToken::findToken($bearerToken);

            if ($accessToken
                && $accessToken->last_used_at
                && $accessToken->last_used_at->lt(now()->subMinutes(self::MAX_INACTIVITE_MINUTES))
            ) {
                $accessToken->delete();

                abort(401, 'Session expirée par inactivité.');
            }
        }

        return $next($request);
    }
}