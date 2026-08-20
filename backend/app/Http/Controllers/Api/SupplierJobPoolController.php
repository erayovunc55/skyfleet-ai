<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\Transfer;
use App\Models\User;
use App\Services\SupplierMatchingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierJobPoolController extends Controller
{
    public function __construct(
        private readonly SupplierMatchingService $matchingService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        [, $supplier] = $this->resolveSupplierUser($request);

        $limit = min(
            max((int) $request->integer('limit', 50), 1),
            100
        );

        $candidateTransfers = Transfer::query()
            ->whereNull('supplier_id')
            ->where('status', 'pending')
            ->where(function ($query): void {
                $query
                    ->whereNotNull('pickup_location_id')
                    ->orWhereNotNull('dropoff_location_id');
            })
            ->orderBy('pickup_time')
            ->limit(150)
            ->get();

        $jobs = $candidateTransfers
            ->map(function (Transfer $transfer) use ($supplier): ?array {
                $match = $this->matchingService
                    ->forTransfer($transfer)
                    ->first(
                        fn (array $item): bool =>
                            (int) $item['supplier_id'] === (int) $supplier->id
                    );

                if (!$match || !($match['eligible'] ?? false)) {
                    return null;
                }

                return $this->formatAvailableJob(
                    $transfer,
                    $supplier,
                    $match
                );
            })
            ->filter()
            ->take($limit)
            ->values();

        return response()->json([
            'data' => $jobs,
            'meta' => [
                'count' => $jobs->count(),
                'generated_at' => now()->toISOString(),
            ],
        ]);
    }

    public function accept(
        Request $request,
        Transfer $transfer
    ): JsonResponse {
        [, $supplier] = $this->resolveSupplierUser($request);

        $acceptedTransfer = DB::transaction(
            function () use ($transfer, $supplier): Transfer {
                /** @var Transfer|null $lockedTransfer */
                $lockedTransfer = Transfer::query()
                    ->whereKey($transfer->id)
                    ->lockForUpdate()
                    ->first();

                if (!$lockedTransfer) {
                    abort(404, 'Transfer bulunamadı.');
                }

                if ($lockedTransfer->supplier_id !== null) {
                    if ((int) $lockedTransfer->supplier_id === (int) $supplier->id) {
                        return $lockedTransfer;
                    }

                    abort(
                        409,
                        'Bu transfer başka bir tedarikçi tarafından kabul edildi.'
                    );
                }

                if ($lockedTransfer->status !== 'pending') {
                    abort(
                        409,
                        'Bu transfer artık açık iş havuzunda değil.'
                    );
                }

                $match = $this->matchingService
                    ->forTransfer($lockedTransfer)
                    ->first(
                        fn (array $item): bool =>
                            (int) $item['supplier_id'] === (int) $supplier->id
                    );

                if (!$match || !($match['eligible'] ?? false)) {
                    abort(
                        422,
                        'Tedarikçi bu transfer için artık operasyon kriterlerini karşılamıyor.'
                    );
                }

                $lockedTransfer->supplier_id = $supplier->id;
                $lockedTransfer->save();

                return $lockedTransfer->fresh();
            },
            3
        );

        return response()->json([
            'message' => 'Transfer başarıyla kabul edildi ve şirketinize atandı.',
            'data' => [
                'id' => $acceptedTransfer->id,
                'booking_reference' => $acceptedTransfer->booking_reference,
                'supplier_id' => $acceptedTransfer->supplier_id,
                'status' => $acceptedTransfer->status,
                'supplier_amount' => number_format(
                    $supplier->calculatePayableAmount(
                        $acceptedTransfer->getRawOriginal('price')
                    ),
                    2,
                    '.',
                    ''
                ),
                'currency' =>
                    $acceptedTransfer->getRawOriginal('currency')
                    ?: $supplier->default_currency
                    ?: 'EUR',
            ],
        ]);
    }

    private function formatAvailableJob(
        Transfer $transfer,
        Supplier $supplier,
        array $match
    ): array {
        return [
            'id' => $transfer->id,
            'booking_reference' => $transfer->booking_reference,
            'supplier_amount' => number_format(
                $supplier->calculatePayableAmount(
                    $transfer->getRawOriginal('price')
                ),
                2,
                '.',
                ''
            ),
            'currency' =>
                $transfer->getRawOriginal('currency')
                ?: $supplier->default_currency
                ?: 'EUR',
            'pickup_time' => $transfer->pickup_time?->toISOString(),
            'pickup' => $transfer->pickup,
            'dropoff' => $transfer->dropoff,
            'flight_number' => $transfer->flight_number,
            'vehicle_type' => $transfer->vehicle_type,
            'adult' => $transfer->adult,
            'child' => $transfer->child,
            'baby' => $transfer->baby,
            'luggage_count' => $transfer->luggage_count,
            'match' => [
                'score' => $match['score'] ?? null,
                'match_level' => $match['match_level'] ?? null,
                'pickup_match' => (bool) ($match['pickup_match'] ?? false),
                'dropoff_match' => (bool) ($match['dropoff_match'] ?? false),
                'best_vehicle' => $match['best_vehicle'] ?? null,
                'reasons' => $match['reasons'] ?? [],
                'warnings' => $match['warnings'] ?? [],
            ],
        ];
    }

    private function resolveSupplierUser(Request $request): array
    {
        /** @var User|null $user */
        $user = $request->user();

        if (
            !$user
            || $user->role !== 'supplier'
            || !$user->is_active
        ) {
            abort(
                403,
                'Bu alan yalnızca aktif tedarikçi kullanıcıları içindir.'
            );
        }

        if (!$user->supplier_id) {
            abort(
                403,
                'Kullanıcı hesabı bir tedarikçi şirketine bağlı değil.'
            );
        }

        $supplier = Supplier::query()->find($user->supplier_id);

        if (!$supplier || !$supplier->canOperate()) {
            abort(
                403,
                'Tedarikçi hesabı operasyon kullanımına açık değil.'
            );
        }

        return [$user, $supplier];
    }
}
