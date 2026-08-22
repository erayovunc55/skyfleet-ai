<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\Transfer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransferSupplierDispatchController extends Controller
{
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
        if ($transfer->isTerminalStatus()) {
            return response()->json(['message' => 'Bu transfer iş havuzuna gönderilemez.'], 422);
        }

        if ($transfer->supplier_id !== null) {
            return response()->json([
                'message' => 'Transfer zaten bir tedarikçiye atanmış. Havuza göndermeden önce manuel atamayı kaldırın.',
            ], 409);
        }

        if ($transfer->status !== 'pending') {
            return response()->json([
                'message' => 'Yalnızca bekleyen transferler iş havuzuna gönderilebilir.',
            ], 422);
        }

        $transfer->forceFill(['job_pool_published_at' => now()])->save();

        return response()->json([
            'message' => 'Transfer tedarikçi iş havuzuna gönderildi.',
            'data' => $transfer->fresh(),
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
}
