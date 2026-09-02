<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\TransferFinancial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierActivityController extends Controller
{
    private const MEANINGFUL_TRANSFER_STATUSES = [
        'accepted',
        'on_the_way',
        'arrived',
        'passenger_called',
        'passenger_on_board',
        'trip_started',
        'completed',
        'no_show',
        'cancelled',
    ];

    private const MEANINGFUL_FINANCE_STATUSES = [
        TransferFinancial::STATUS_APPROVED,
        TransferFinancial::STATUS_PAID,
        TransferFinancial::STATUS_DISPUTED,
        TransferFinancial::STATUS_CANCELLED,
    ];

    public function index(Request $request, Supplier $supplier): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['nullable', 'string', 'max:50'],
            'search' => ['nullable', 'string', 'max:150'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $items = collect();

        $supplier->load([
            'approvalLogs.changedBy:id,name,email',
            'documents.uploadedBy:id,name',
            'users:id,supplier_id,name,email,phone,created_at',
            'vehicles:id,supplier_id,plate,brand,model,created_at',
            'transfers:id,supplier_id,booking_reference,passenger_name,status,created_at,updated_at',
        ]);

        foreach ($supplier->approvalLogs as $log) {
            $items->push([
                'id' => 'approval-' . $log->id,
                'type' => $log->action ?: 'supplier_status',
                'category' => 'supplier',
                'title' => $log->action ?: 'Supplier status updated',
                'description' => $log->note ?: $log->reason,
                'actor' => $log->changedBy?->name,
                'occurred_at' => $log->created_at?->toISOString(),
                'metadata' => [
                    'old_status' => $log->old_status,
                    'new_status' => $log->new_status,
                ],
            ]);
        }

        foreach ($supplier->documents as $document) {
            $items->push([
                'id' => 'document-' . $document->id,
                'type' => 'document_uploaded',
                'category' => 'document',
                'title' => $document->title,
                'description' => $document->type,
                'actor' => $document->uploadedBy?->name,
                'occurred_at' => $document->created_at?->toISOString(),
                'metadata' => [
                    'document_number' => $document->document_number,
                    'expires_at' => $document->expires_at?->toDateString(),
                ],
            ]);
        }

        foreach ($supplier->users as $driver) {
            $items->push([
                'id' => 'driver-' . $driver->id,
                'type' => 'driver_linked',
                'category' => 'driver',
                'title' => $driver->name,
                'description' => $driver->email ?: $driver->phone,
                'actor' => null,
                'occurred_at' => $driver->created_at?->toISOString(),
                'metadata' => [],
            ]);
        }

        foreach ($supplier->vehicles as $vehicle) {
            $items->push([
                'id' => 'vehicle-' . $vehicle->id,
                'type' => 'vehicle_linked',
                'category' => 'vehicle',
                'title' => $vehicle->plate,
                'description' => trim(($vehicle->brand ?? '') . ' ' . ($vehicle->model ?? '')) ?: null,
                'actor' => null,
                'occurred_at' => $vehicle->created_at?->toISOString(),
                'metadata' => [],
            ]);
        }

        foreach ($supplier->transfers as $transfer) {
            if (!in_array($transfer->status, self::MEANINGFUL_TRANSFER_STATUSES, true)) {
                continue;
            }

            $items->push([
                'id' => 'transfer-' . $transfer->id,
                'type' => 'transfer_' . $transfer->status,
                'category' => 'transfer',
                'title' => $transfer->booking_reference ?: ('#' . $transfer->id),
                'description' => $transfer->passenger_name,
                'actor' => null,
                'occurred_at' => $transfer->updated_at?->toISOString() ?: $transfer->created_at?->toISOString(),
                'metadata' => [
                    'status' => $transfer->status,
                ],
            ]);
        }

        $financials = TransferFinancial::query()
            ->where('supplier_id', $supplier->id)
            ->whereIn('status', self::MEANINGFUL_FINANCE_STATUSES)
            ->with([
                'transfer:id,booking_reference,passenger_name',
                'approvedBy:id,name',
                'paidBy:id,name',
            ])
            ->get();

        foreach ($financials as $financial) {
            $occurredAt = match ($financial->status) {
                TransferFinancial::STATUS_PAID => $financial->paid_at,
                TransferFinancial::STATUS_APPROVED => $financial->approved_at,
                default => $financial->updated_at,
            };

            $actor = match ($financial->status) {
                TransferFinancial::STATUS_PAID => $financial->paidBy?->name,
                TransferFinancial::STATUS_APPROVED => $financial->approvedBy?->name,
                default => null,
            };

            $items->push([
                'id' => 'finance-' . $financial->id . '-' . $financial->status,
                'type' => 'finance_' . $financial->status,
                'category' => 'finance',
                'title' => $financial->transfer?->booking_reference ?: ('#' . $financial->transfer_id),
                'description' => $financial->transfer?->passenger_name,
                'actor' => $actor,
                'occurred_at' => $occurredAt?->toISOString(),
                'metadata' => [
                    'status' => $financial->status,
                    'amount' => $financial->supplier_payable,
                    'currency' => $financial->currency,
                    'payment_reference' => $financial->payment_reference,
                ],
            ]);
        }

        $items = $items->filter(fn ($item) => !empty($item['occurred_at']));

        if (!empty($validated['type'])) {
            $items = $items->where('category', $validated['type']);
        }

        if (!empty($validated['search'])) {
            $search = mb_strtolower(trim($validated['search']));
            $items = $items->filter(function (array $item) use ($search) {
                $haystack = mb_strtolower(implode(' ', array_filter([
                    $item['title'] ?? null,
                    $item['description'] ?? null,
                    $item['actor'] ?? null,
                    $item['type'] ?? null,
                    $item['metadata']['status'] ?? null,
                    $item['metadata']['payment_reference'] ?? null,
                ])));

                return str_contains($haystack, $search);
            });
        }

        $items = $items->sortByDesc('occurred_at')->values();
        $perPage = (int) ($validated['per_page'] ?? 20);
        $page = (int) ($validated['page'] ?? 1);
        $total = $items->count();
        $lastPage = max(1, (int) ceil($total / $perPage));
        $page = min($page, $lastPage);

        return response()->json([
            'data' => $items->forPage($page, $perPage)->values(),
            'meta' => [
                'current_page' => $page,
                'last_page' => $lastPage,
                'per_page' => $perPage,
                'total' => $total,
            ],
        ]);
    }
}
