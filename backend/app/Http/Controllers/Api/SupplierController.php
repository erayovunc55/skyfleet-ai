<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Services\SupplierApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SupplierController extends Controller
{
    public function __construct(
        private readonly SupplierApprovalService
            $approvalService
    ) {
    }

    public function index(
        Request $request
    ): JsonResponse {
        $validated = $request->validate([
            'status' => [
                'nullable',
                Rule::in(Supplier::STATUSES),
            ],

            'country_code' => [
                'nullable',
                'string',
                'size:2',
            ],

            'city' => [
                'nullable',
                'string',
                'max:100',
            ],

            'search' => [
                'nullable',
                'string',
                'max:100',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $query = Supplier::query()
            ->withCount([
                'branches',
            ])
            ->with([
                'approver:id,name,email',
            ]);

        if (!empty($validated['status'])) {
            $query->where(
                'status',
                $validated['status']
            );
        }

        if (!empty($validated['country_code'])) {
            $query->where(
                'country_code',
                mb_strtoupper(
                    $validated['country_code']
                )
            );
        }

        if (!empty($validated['city'])) {
            $query->where(
                'city',
                'like',
                '%' . trim(
                    $validated['city']
                ) . '%'
            );
        }

        if (
            array_key_exists(
                'is_active',
                $validated
            )
        ) {
            $query->where(
                'is_active',
                filter_var(
                    $validated['is_active'],
                    FILTER_VALIDATE_BOOL
                )
            );
        }

        if (!empty($validated['search'])) {
            $search = trim(
                $validated['search']
            );

            $query->where(
                function ($searchQuery) use (
                    $search
                ) {
                    $searchQuery
                        ->where(
                            'company_name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'legal_name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'contact_name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'email',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'phone',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'tax_number',
                            'like',
                            "%{$search}%"
                        );
                }
            );
        }

        $suppliers = $query
            ->orderByRaw(
                "CASE status
                    WHEN 'under_review' THEN 1
                    WHEN 'revision_requested' THEN 2
                    WHEN 'pending' THEN 3
                    WHEN 'approved' THEN 4
                    WHEN 'suspended' THEN 5
                    WHEN 'rejected' THEN 6
                    ELSE 7
                END"
            )
            ->orderByDesc('created_at')
            ->paginate(
                $validated['per_page'] ?? 25
            );

        return response()->json($suppliers);
    }

    public function store(
        Request $request
    ): JsonResponse {
        $validated = $request->validate(
            $this->validationRules()
        );

        $validated = $this->preparePayload(
            $validated
        );

        $supplier = Supplier::create([
            ...$validated,

            'status' =>
                Supplier::STATUS_PENDING,

            'is_active' => false,
        ]);

        return response()->json([
            'message' =>
                'Tedarikçi başarıyla oluşturuldu.',

            'data' => $supplier,
        ], 201);
    }

    public function show(
        Supplier $supplier
    ): JsonResponse {
        $supplier->load([
            'approver:id,name,email',

            'branches' => function ($query) {
                $query
                    ->orderByDesc(
                        'is_head_office'
                    )
                    ->orderBy('name');
            },

            'approvalLogs.changedBy:id,name,email',
        ]);

        return response()->json([
            'data' => $supplier,
        ]);
    }

    public function update(
        Request $request,
        Supplier $supplier
    ): JsonResponse {
        $validated = $request->validate(
            $this->validationRules(
                supplier: $supplier,
                isUpdate: true
            )
        );

        $supplier->update(
            $this->preparePayload(
                $validated,
                supplier: $supplier
            )
        );

        return response()->json([
            'message' =>
                'Tedarikçi bilgileri güncellendi.',

            'data' => $supplier
                ->fresh()
                ->load([
                    'approver:id,name,email',
                    'branches',
                ]),
        ]);
    }

    public function submit(
        Request $request,
        Supplier $supplier
    ): JsonResponse {
        $supplier = $this
            ->approvalService
            ->submit(
                supplier: $supplier,
                actor: $request->user(),
                request: $request
            );

        return response()->json([
            'message' =>
                'Tedarikçi başvurusu incelemeye gönderildi.',

            'data' => $supplier,
        ]);
    }

    public function approve(
        Request $request,
        Supplier $supplier
    ): JsonResponse {
        $validated = $request->validate([
            'note' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        $supplier = $this
            ->approvalService
            ->approve(
                supplier: $supplier,
                actor: $request->user(),
                request: $request,
                note: $validated['note'] ?? null
            );

        return response()->json([
            'message' =>
                'Tedarikçi onaylandı ve aktif edildi.',

            'data' => $supplier,
        ]);
    }

    public function requestRevision(
        Request $request,
        Supplier $supplier
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => [
                'required',
                'string',
                'max:5000',
            ],

            'note' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        $supplier = $this
            ->approvalService
            ->requestRevision(
                supplier: $supplier,
                actor: $request->user(),
                reason: $validated['reason'],
                request: $request,
                note: $validated['note'] ?? null
            );

        return response()->json([
            'message' =>
                'Tedarikçiden revizyon istendi.',

            'data' => $supplier,
        ]);
    }

    public function reject(
        Request $request,
        Supplier $supplier
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => [
                'required',
                'string',
                'max:5000',
            ],

            'note' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        $supplier = $this
            ->approvalService
            ->reject(
                supplier: $supplier,
                actor: $request->user(),
                reason: $validated['reason'],
                request: $request,
                note: $validated['note'] ?? null
            );

        return response()->json([
            'message' =>
                'Tedarikçi başvurusu reddedildi.',

            'data' => $supplier,
        ]);
    }

    public function suspend(
        Request $request,
        Supplier $supplier
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => [
                'required',
                'string',
                'max:5000',
            ],

            'note' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        $supplier = $this
            ->approvalService
            ->suspend(
                supplier: $supplier,
                actor: $request->user(),
                reason: $validated['reason'],
                request: $request,
                note: $validated['note'] ?? null
            );

        return response()->json([
            'message' =>
                'Tedarikçi askıya alındı.',

            'data' => $supplier,
        ]);
    }

    public function reactivate(
        Request $request,
        Supplier $supplier
    ): JsonResponse {
        $validated = $request->validate([
            'note' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        $supplier = $this
            ->approvalService
            ->reactivate(
                supplier: $supplier,
                actor: $request->user(),
                request: $request,
                note: $validated['note'] ?? null
            );

        return response()->json([
            'message' =>
                'Tedarikçi yeniden aktif edildi.',

            'data' => $supplier,
        ]);
    }

    private function validationRules(
        ?Supplier $supplier = null,
        bool $isUpdate = false
    ): array {
        $required = $isUpdate
            ? ['sometimes', 'required']
            : ['required'];

        $nullable = $isUpdate
            ? ['sometimes', 'nullable']
            : ['nullable'];

        return [
            'company_name' => [
                ...$required,
                'string',
                'max:255',
            ],

            'legal_name' => [
                ...$nullable,
                'string',
                'max:255',
            ],

            'slug' => [
                ...$nullable,
                'string',
                'max:255',

                Rule::unique(
                    'suppliers',
                    'slug'
                )->ignore($supplier?->id),
            ],

            'tax_number' => [
                ...$nullable,
                'string',
                'max:100',
            ],

            'registration_number' => [
                ...$nullable,
                'string',
                'max:100',
            ],

            'contact_name' => [
                ...$nullable,
                'string',
                'max:255',
            ],

            'email' => [
                ...$nullable,
                'email',
                'max:255',
            ],

            'phone' => [
                ...$nullable,
                'string',
                'max:50',
            ],

            'whatsapp' => [
                ...$nullable,
                'string',
                'max:50',
            ],

            'website' => [
                ...$nullable,
                'url',
                'max:2048',
            ],

            'country_code' => [
                ...$required,
                'string',
                'size:2',
            ],

            'country_name' => [
                ...$nullable,
                'string',
                'max:100',
            ],

            'city' => [
                ...$nullable,
                'string',
                'max:100',
            ],

            'state_region' => [
                ...$nullable,
                'string',
                'max:100',
            ],

            'address' => [
                ...$nullable,
                'string',
                'max:5000',
            ],

            'postal_code' => [
                ...$nullable,
                'string',
                'max:30',
            ],

            'timezone' => [
                ...$nullable,
                'timezone',
            ],

            'default_currency' => [
                ...$nullable,
                'string',
                'size:3',
            ],

            'locale' => [
                ...$nullable,
                'string',
                'max:10',
            ],

            'admin_note' => [
                ...$nullable,
                'string',
                'max:5000',
            ],

            'metadata' => [
                ...$nullable,
                'array',
            ],
        ];
    }

    private function preparePayload(
        array $validated,
        ?Supplier $supplier = null
    ): array {
        if (
            array_key_exists(
                'company_name',
                $validated
            )
        ) {
            $validated['company_name'] =
                trim(
                    $validated['company_name']
                );
        }

        if (
            array_key_exists(
                'country_code',
                $validated
            )
        ) {
            $validated['country_code'] =
                mb_strtoupper(
                    trim(
                        $validated['country_code']
                    )
                );
        }

        if (
            array_key_exists(
                'default_currency',
                $validated
            )
        ) {
            $validated['default_currency'] =
                $validated['default_currency']
                    ? mb_strtoupper(
                        trim(
                            $validated[
                                'default_currency'
                            ]
                        )
                    )
                    : null;
        }

        if (empty($validated['slug'])) {
            $name =
                $validated['company_name']
                ?? $supplier?->company_name
                ?? 'supplier';

            $validated['slug'] =
                $this->makeUniqueSlug(
                    $name,
                    $supplier?->id
                );
        }

        return $validated;
    }

    private function makeUniqueSlug(
        string $companyName,
        ?int $ignoreSupplierId = null
    ): string {
        $baseSlug =
            Str::slug($companyName)
            ?: 'supplier';

        $slug = $baseSlug;
        $counter = 2;

        while (
            Supplier::query()
                ->when(
                    $ignoreSupplierId,
                    fn ($query) =>
                        $query->where(
                            'id',
                            '!=',
                            $ignoreSupplierId
                        )
                )
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug =
                $baseSlug . '-' . $counter;

            $counter++;
        }

        return $slug;
    }
}