<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\Transfer;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SupplierDeletionController extends Controller
{
    public function __invoke(Supplier $supplier): JsonResponse
    {
        $activeTransferCount = Transfer::query()
            ->where('supplier_id', $supplier->id)
            ->whereNotIn('status', ['completed', 'no_show', 'cancelled'])
            ->count();

        if ($activeTransferCount > 0) {
            return response()->json([
                'message' => "Bu tedarikçiye bağlı {$activeTransferCount} aktif transfer var. Silmeden önce bu transferleri başka tedarikçiye atayın veya atamayı kaldırın.",
            ], 409);
        }

        DB::transaction(function () use ($supplier): void {
            $supplier->users()->update(['is_active' => false]);
            $supplier->vehicles()->update(['is_active' => false]);
            $supplier->delete();
        }, 3);

        return response()->json([
            'message' => 'Tedarikçi silindi ve bağlı portal hesapları pasifleştirildi.',
        ]);
    }
}
