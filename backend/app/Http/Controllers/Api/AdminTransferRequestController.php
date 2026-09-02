<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TransferRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminTransferRequestController extends Controller
{
    private const STATUSES = [
        'new',
        'contacted',
        'quoted',
        'confirmed',
        'rejected',
    ];

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', Rule::in(self::STATUSES)],
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $requests = TransferRequest::query()
            ->with(['transfer:id,booking_reference,status'])
            ->when(
                $validated['status'] ?? null,
                fn ($query, string $status) => $query->where('status', $status)
            )
            ->when(
                trim((string) ($validated['search'] ?? '')),
                function ($query, string $search): void {
                    $term = '%' . $search . '%';
                    $query->where(function ($query) use ($term): void {
                        $query
                            ->where('request_reference', 'like', $term)
                            ->orWhere('passenger_name', 'like', $term)
                            ->orWhere('passenger_phone', 'like', $term)
                            ->orWhere('passenger_email', 'like', $term)
                            ->orWhere('pickup', 'like', $term)
                            ->orWhere('dropoff', 'like', $term);
                    });
                }
            )
            ->orderByRaw("CASE WHEN status = 'new' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->paginate((int) ($validated['per_page'] ?? 50));

        return response()->json([
            'data' => $requests->items(),
            'meta' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ],
            'counts' => TransferRequest::query()
                ->selectRaw('status, COUNT(*) as aggregate')
                ->groupBy('status')
                ->pluck('aggregate', 'status'),
        ]);
    }

    public function updateStatus(
        Request $request,
        TransferRequest $transferRequest
    ): JsonResponse {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(self::STATUSES)],
        ]);

        $transferRequest->update([
            'status' => $validated['status'],
            'handled_by_user_id' => $request->user()->id,
            'handled_at' => $validated['status'] === 'new' ? null : now(),
        ]);

        return response()->json([
            'message' => 'Transfer request status updated.',
            'data' => $transferRequest->fresh(),
        ]);
    }
}
