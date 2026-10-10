<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;

/**
 * Module based restrictions for panel users with the dispatcher role.
 * A dispatcher without a permissions value keeps full access.
 */
class PanelPermissions
{
    public const MODULES = [
        'dashboard',
        'live-operations',
        'live-support',
        'transfers',
        'transfer-requests',
        'fleet',
        'drivers',
        'suppliers',
        'agencies',
        'locations',
        'documents',
        'ratings',
        'finance',
        'ai-dispatcher',
        'ai-training',
        'tour-packages',
    ];

    /** URI prefix (after "api/") => modules that grant access. */
    private const ROUTE_MODULES = [
        'admin/agencies' => ['agencies'],
        'admin/ai-training' => ['ai-training'],
        'admin/ai' => ['ai-dispatcher'],
        'admin/finance' => ['finance'],
        'admin/invoices' => ['documents'],
        'admin/support' => ['live-support'],
        'admin/transfer-requests' => ['transfer-requests'],
        'dispatcher' => ['live-operations', 'transfers', 'ai-dispatcher'],
        'transfers' => ['live-operations', 'transfers'],
        'drivers' => ['drivers'],
        'vehicles' => ['fleet'],
        'suppliers' => ['suppliers'],
        'tour-packages' => ['tour-packages'],
    ];

    public static function allows(User $user, Request $request): bool
    {
        if ($user->role !== 'dispatcher' || !is_array($user->permissions)) {
            return true;
        }

        $permissions = $user->permissions;

        if (
            !empty($permissions['read_only'])
            && !in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)
        ) {
            return false;
        }

        $path = preg_replace('#^api/#', '', ltrim($request->path(), '/'));

        foreach (self::ROUTE_MODULES as $prefix => $modules) {
            if ($path === $prefix || str_starts_with($path, $prefix.'/')) {
                return count(array_intersect(
                    $modules,
                    (array) ($permissions['modules'] ?? [])
                )) > 0;
            }
        }

        return true;
    }
}