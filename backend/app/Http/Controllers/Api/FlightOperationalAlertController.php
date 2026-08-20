<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OperationalAlertRead;
use App\Services\FlightOperationalAlertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FlightOperationalAlertController extends Controller
{
    public function __invoke(
        Request $request,
        FlightOperationalAlertService $service
    ): JsonResponse {
        $items = $service->alerts(now());

        $readKeys = OperationalAlertRead::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('alert_key', $items->pluck('key'))
            ->pluck('alert_key')
            ->flip();

        $items = $items->map(function (array $alert) use ($readKeys): array {
            $alert['is_read'] = $readKeys->has($alert['key']);
            return $alert;
        });

        return response()->json([
            'data' => [
                'generated_at' => now()->toISOString(),
                'unread_count' => $items->where('is_read', false)->count(),
                'counts' => [
                    'critical' => $items->where('level', 'critical')->count(),
                    'warning' => $items->where('level', 'warning')->count(),
                    'info' => $items->where('level', 'info')->count(),
                ],
                'items' => $items->values()->all(),
            ],
        ]);
    }
}
