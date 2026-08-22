<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\Transfer;
use App\Services\TransferLocationResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransferSupplierDispatchController extends Controller
{
    public function __construct(
        private readonly TransferLocationResolver $locationResolver
    ) {
    }

    public function assign(Request $request, Transfer $transfer): JsonResponse
    {
        $data = $request->validate([
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
        ]);

        if ($transfer->isTerminalStatus()) {
            return response()->json([
                'message' => 'Tamamlanmış, no-show veya iptal edilmiş transferde tedarikçi ataması değiştirilemez.',
            ], 422);
        }

        $supplierId = $data['supplier_id'] ?? null;

        if ($supplierId !== null) {
            $supplier = Supplier::query()->findOrFail($supplierId);
            if (!$supplier->canOperate()) {
                return response()->json([
                    'message' => 'Yalnızca onaylı ve operasyona açık tedarikçiler atanabilir.',
                ], 422);
            }
        }

        $updated = DB::transaction(function () use ($transfer, $supplierId): Transfer {
            $locked = Transfer::query()->whereKey($transfer->id)->lockForUpdate()->firstOrFail();
            $locked->supplier_id = $supplierId;
            $locked->job_pool_published_at = null;
            $locked->save();
            return $locked->fresh()->load('supplierCompany');
        }, 3);

        return response()->json([
            'message' => $supplierId
                ? 'Transfer tedarikçiye manuel olarak atandı.'
                : 'Manuel tedarikçi ataması kaldırıldı.',
            'data' => $updated,
        ]);
    }

    public function publish(Request $request, Transfer $transfer): JsonResponse
    {
        $problem = $this->publishabilityProblem($transfer);
        if ($problem) {
            return response()->json(['message' => $problem['message']], $problem['status']);
        }

        $this->resolveLocations($transfer);

        if (!$transfer->pickup_location_id && !$transfer->dropoff_location_id) {
            return response()->json([
                'message' => 'Transferin pickup veya dropoff lokasyonu otomatik eşleştirilemedi. Havuza göndermeden önce lokasyon bilgisini kontrol edin.',
            ], 422);
        }

        $transfer->forceFill(['job_pool_published_at' => now()])->save();

        return response()->json([
            'message' => 'Transfer tedarikçi iş havuzuna gönderildi.',
            'data' => $transfer->fresh(),
        ]);
    }

    public function bulkPublish(Request $request): JsonResponse
    {
        $data = $request->validate([
            'transfer_ids' => ['required', 'array', 'min:1', 'max:500'],
            'transfer_ids.*' => ['required', 'integer', 'distinct', 'exists:transfers,id'],
        ]);

        $published = [];
        $skipped = [];

        foreach ($data['transfer_ids'] as $transferId) {
            DB::transaction(function () use ($transferId, &$published, &$skipped): void {
                $transfer = Transfer::query()
                    ->whereKey($transferId)
                    ->lockForUpdate()
                    ->first();

                if (!$transfer) {
                    $skipped[] = [
                        'id' => (int) $transferId,
                        'reason' => 'Transfer bulunamadı.',
                    ];
                    return;
                }

                $problem = $this->publishabilityProblem($transfer);
                if ($problem) {
                    $skipped[] = [
                        'id' => $transfer->id,
                        'booking_reference' => $transfer->booking_reference,
                        'reason' => $problem['message'],
                    ];
                    return;
                }

                $this->resolveLocations($transfer);

                if (!$transfer->pickup_location_id && !$transfer->dropoff_location_id) {
                    $skipped[] = [
                        'id' => $transfer->id,
                        'booking_reference' => $transfer->booking_reference,
                        'reason' => 'Pickup/dropoff lokasyonu eşleştirilemedi.',
                    ];
                    return;
                }

                $transfer->forceFill(['job_pool_published_at' => now()])->save();

                $published[] = [
                    'id' => $transfer->id,
                    'booking_reference' => $transfer->booking_reference,
                    'pickup_location_id' => $transfer->pickup_location_id,
                    'dropoff_location_id' => $transfer->dropoff_location_id,
                ];
            }, 3);
        }

        return response()->json([
            'message' => count($published) . ' transfer iş havuzuna gönderildi.'
                . (count($skipped) ? ' ' . count($skipped) . ' transfer atlandı.' : ''),
            'data' => [
                'published' => $published,
                'skipped' => $skipped,
            ],
            'meta' => [
                'published_count' => count($published),
                'skipped_count' => count($skipped),
            ],
        ]);
    }

    public function retract(Request $request, Transfer $transfer): JsonResponse
    {
        if ($transfer->supplier_id !== null) {
            return response()->json([
                'message' => 'Transfer bir tedarikçi tarafından alınmış; havuzdan geri çekilemez.',
            ], 409);
        }

        $transfer->forceFill(['job_pool_published_at' => null])->save();

        return response()->json([
            'message' => 'Transfer iş havuzundan geri çekildi.',
            'data' => $transfer->fresh(),
        ]);
    }

    private function resolveLocations(Transfer $transfer): void
    {
        $this->locationResolver->apply($transfer);

        if ($transfer->isDirty(['pickup_location_id', 'dropoff_location_id'])) {
            $transfer->save();
        }
    }

    private function publishabilityProblem(Transfer $transfer): ?array
    {
        if ($transfer->isTerminalStatus()) {
            return [
                'message' => 'Bu transfer iş havuzuna gönderilemez.',
                'status' => 422,
            ];
        }

        if ($transfer->supplier_id !== null) {
            return [
                'message' => 'Transfer zaten bir tedarikçiye atanmış. Havuza göndermeden önce manuel atamayı kaldırın.',
                'status' => 409,
            ];
        }

        if ($transfer->status !== 'pending') {
            return [
                'message' => 'Yalnızca bekleyen transferler iş havuzuna gönderilebilir.',
                'status' => 422,
            ];
        }

        if ($transfer->job_pool_published_at) {
            return [
                'message' => 'Transfer zaten iş havuzunda.',
                'status' => 409,
            ];
        }

        return null;
    }
}
