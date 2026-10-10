<?php

namespace App\Http\Middleware;

use App\Support\PanelPermissions;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePanelRole
{
    public function handle(
        Request $request,
        Closure $next,
        string ...$roles
    ): Response {
        $user = $request->user();

        if (
            !$user
            || !$user->is_active
            || !in_array($user->role, $roles, true)
        ) {
            return response()->json([
                'message' =>
                    'Bu işlem için dispatcher yetkisi gerekiyor.',
            ], 403);
        }

        if (!PanelPermissions::allows($user, $request)) {
            return response()->json([
                'message' =>
                    'Bu işlem için yetkiniz bulunmuyor.',
            ], 403);
        }

        return $next($request);
    }
}