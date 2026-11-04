<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DispatcherTransferStatusController extends Controller
{
    public function update(Request $request, Transfer $transfer): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->is_active || !in_array($user->role, ['dispatcher', 'admin', 'super_admin'], true)) {
            return response()->json(['message' => 'Bu islem icin yetkiniz yok.'], 403);
        }

        $data = $request->validate([
            'status' => ['required', 'string', Rule::in([
                'accepted', 'on_the_way', 'arrived', 'passenger_called',
                'passenger_on_board', 'trip_started',
            ])],
            'note' => ['required', 'string', 'min:10', 'max:5000'],
        ]);

        $result = DB::transaction(function () use ($transfer, $data, $user): array {
            $locked = Transfer::query()->whereKey($transfer->getKey())->lockForUpdate()->firstOrFail();
            $oldStatus = $locked->status;
            $nextStatus = $data['status'];

            if ($locked->isTerminalStatus()) {
                return ['code' => 409, 'message' => 'Kapanmis transfer guncellenemez.'];
            }
            if ($oldStatus === $nextStatus) {
                return ['code' => 409, 'message' => 'Transfer zaten bu durumda.'];
            }
            if (!$locked->canTransitionTo($nextStatus)) {
                return [
                    'code' => 409,
                    'message' => 'Gecersiz durum gecisi. Adimlar sirayla tamamlanmalidir.',
                    'allowed_next_statuses' => $locked->allowedNextStatuses(),
                ];
            }
            if (!$locked->driver_id) {
                return ['code' => 409, 'message' => 'Once transfere surucu atayin.'];
            }
            if ($locked->events()->where('status', $nextStatus)->exists()) {
                return ['code' => 409, 'message' => 'Bu operasyon adimi daha once kaydedilmis.'];
            }

            $locked->update(['status' => $nextStatus]);
            if ($nextStatus === 'on_the_way') {
                $locked->enablePublicTracking();
            }

            $locked->events()->create([
                'driver_id' => null,
                'event_type' => 'dispatcher_status_override',
                'status' => $nextStatus,
                'occurred_at' => now(),
                'timezone' => config('app.timezone', 'UTC'),
                'note' => $data['note'],
                'metadata' => [
                    'previous_status' => $oldStatus,
                    'new_status' => $nextStatus,
                    'changed_by_user_id' => $user->id,
                    'changed_by_role' => $user->role,
                    'source' => 'control_tower',
                    'driver_id_at_time' => $locked->driver_id,
                ],
            ]);

            return [
                'code' => 200,
                'message' => 'Operasyon durumu guncellendi.',
                'data' => $locked->fresh()->load([
                    'driver.vehicle', 'supplierCompany', 'pickupLocation.type',
                    'pickupPoint.airportTerminal', 'dropoffLocation.type',
                    'dropoffPoint.airportTerminal', 'events.driver',
                    'latestEvent', 'latestLocation',
                ]),
            ];
        });

        return response()->json(
            array_diff_key($result, ['code' => true]),
            $result['code']
        );
    }
}
