<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SupplierPortalVehicleController extends Controller
{
    public function index(
        Request $request
    ): JsonResponse {
        $user = $this->supplierUser(
            $request
        );

        $vehicles = Vehicle::query()
            ->where(
                'supplier_id',
                $user->supplier_id
            )
            ->with([
                'driver:id,name,phone,email,vehicle_id,supplier_id,is_active',
            ])
            ->orderByDesc('is_active')
            ->orderBy(
                'operational_status'
            )
            ->orderBy('plate')
            ->get();

        return response()->json([
            'data' => $vehicles,
        ]);
    }

    public function store(
        Request $request
    ): JsonResponse {
        $user = $this->supplierUser(
            $request
        );

        $validated = $request->validate(
            $this->validationRules()
        );

        $payload = $this->preparePayload(
            $validated,
            isUpdate: false
        );

        /*
         * supplier_id istemciden alınmaz.
         * Giriş yapan tedarikçiden belirlenir.
         */
        $payload['supplier_id'] =
            $user->supplier_id;

        $vehicle = Vehicle::create(
            $payload
        );

        return response()->json([
            'message' =>
                'Araç başarıyla oluşturuldu.',

            'data' =>
                $vehicle->fresh(),
        ], 201);
    }

    public function show(
        Request $request,
        Vehicle $vehicle
    ): JsonResponse {
        $user = $this->supplierUser(
            $request
        );

        $this->ensureOwnership(
            $vehicle,
            $user
        );

        return response()->json([
            'data' =>
                $vehicle->load([
                    'driver:id,name,phone,email,vehicle_id,supplier_id,is_active',
                ]),
        ]);
    }

    public function update(
        Request $request,
        Vehicle $vehicle
    ): JsonResponse {
        $user = $this->supplierUser(
            $request
        );

        $this->ensureOwnership(
            $vehicle,
            $user
        );

        $validated = $request->validate(
            $this->validationRules(
                vehicle: $vehicle,
                isUpdate: true
            )
        );

        /*
         * supplier_id hiçbir zaman
         * güncelleme isteğinden alınmaz.
         */
        unset(
            $validated['supplier_id']
        );

        $vehicle->update(
            $this->preparePayload(
                $validated,
                isUpdate: true
            )
        );

        return response()->json([
            'message' =>
                'Araç bilgileri güncellendi.',

            'data' =>
                $vehicle
                    ->fresh()
                    ->load([
                        'driver:id,name,phone,email,vehicle_id,supplier_id,is_active',
                    ]),
        ]);
    }

    public function changeStatus(
        Request $request,
        Vehicle $vehicle
    ): JsonResponse {
        $user = $this->supplierUser(
            $request
        );

        $this->ensureOwnership(
            $vehicle,
            $user
        );

        $validated = $request->validate([
            'operational_status' => [
                'required',
                Rule::in([
                    'active',
                    'service',
                    'faulty',
                    'inactive',
                ]),
            ],
        ]);

        $status =
            $validated[
                'operational_status'
            ];

        $vehicle->update([
            'operational_status' =>
                $status,

            'is_active' =>
                $status !== 'inactive',
        ]);

        if ($status !== 'active') {
            User::query()
                ->where(
                    'supplier_id',
                    $user->supplier_id
                )
                ->where(
                    'vehicle_id',
                    $vehicle->id
                )
                ->update([
                    'vehicle_id' => null,
                ]);
        }

        return response()->json([
            'message' =>
                'Araç durumu güncellendi.',

            'data' =>
                $vehicle->fresh(),
        ]);
    }

    public function destroy(
        Request $request,
        Vehicle $vehicle
    ): JsonResponse {
        $user = $this->supplierUser(
            $request
        );

        $this->ensureOwnership(
            $vehicle,
            $user
        );

        DB::transaction(
            function () use (
                $vehicle,
                $user
            ): void {
                User::query()
                    ->where(
                        'supplier_id',
                        $user->supplier_id
                    )
                    ->where(
                        'vehicle_id',
                        $vehicle->id
                    )
                    ->update([
                        'vehicle_id' =>
                            null,
                    ]);

                $vehicle->update([
                    'is_active' =>
                        false,

                    'operational_status' =>
                        'inactive',
                ]);
            }
        );

        return response()->json([
            'message' =>
                'Araç pasif duruma alındı.',

            'data' =>
                $vehicle->fresh(),
        ]);
    }

    private function supplierUser(
        Request $request
    ): User {
        $user = $request->user();

        if (
            !$user ||
            $user->role !== 'supplier' ||
            !$user->is_active ||
            !$user->supplier_id
        ) {
            abort(
                403,
                'Bu işlem yalnızca aktif tedarikçi kullanıcıları tarafından yapılabilir.'
            );
        }

        $supplier =
            $user->supplierCompany;

        if (
            !$supplier ||
            !$supplier->is_active ||
            $supplier->status !==
                'approved'
        ) {
            abort(
                403,
                'Tedarikçi hesabı aktif veya onaylı değil.'
            );
        }

        return $user;
    }

    private function ensureOwnership(
        Vehicle $vehicle,
        User $user
    ): void {
        if (
            (int) $vehicle->supplier_id !==
            (int) $user->supplier_id
        ) {
            abort(
                404,
                'Araç bulunamadı.'
            );
        }
    }

    private function validationRules(
        ?Vehicle $vehicle = null,
        bool $isUpdate = false
    ): array {
        $required = $isUpdate
            ? ['sometimes', 'required']
            : ['required'];

        $nullable = $isUpdate
            ? ['sometimes', 'nullable']
            : ['nullable'];

        return [
            'plate' => [
                ...$required,
                'string',
                'max:20',

                Rule::unique(
                    'vehicles',
                    'plate'
                )->ignore(
                    $vehicle?->id
                ),
            ],

            'brand' => [
                ...$required,
                'string',
                'max:100',
            ],

            'model' => [
                ...$required,
                'string',
                'max:100',
            ],

            'year' => [
                ...$nullable,
                'integer',
                'min:1950',
                'max:' .
                    (now()->year + 1),
            ],

            'vehicle_type' => [
                ...$required,
                'string',
                'max:100',
            ],

            'color' => [
                ...$nullable,
                'string',
                'max:50',
            ],

            'passenger_capacity' => [
                ...$required,
                'integer',
                'min:1',
                'max:100',
            ],

            'luggage_capacity' => [
                ...$nullable,
                'integer',
                'min:0',
                'max:100',
            ],

            'vin' => [
                ...$nullable,
                'string',
                'max:50',

                Rule::unique(
                    'vehicles',
                    'vin'
                )->ignore(
                    $vehicle?->id
                ),
            ],

            'registration_number' => [
                ...$nullable,
                'string',
                'max:100',
            ],

            'insurance_expiry_date' => [
                ...$nullable,
                'date',
            ],

            'inspection_expiry_date' => [
                ...$nullable,
                'date',
            ],

            'casco_expiry_date' => [
                ...$nullable,
                'date',
            ],

            'emission_expiry_date' => [
                ...$nullable,
                'date',
            ],

            'next_maintenance_date' => [
                ...$nullable,
                'date',
            ],

            'current_mileage' => [
                ...$nullable,
                'integer',
                'min:0',
            ],

            'last_maintenance_mileage' => [
                ...$nullable,
                'integer',
                'min:0',
            ],

            'next_maintenance_mileage' => [
                ...$nullable,
                'integer',
                'min:0',
            ],

            'operational_status' => [
                ...$nullable,

                Rule::in([
                    'active',
                    'service',
                    'faulty',
                    'inactive',
                ]),
            ],

            'is_active' => [
                ...$nullable,
                'boolean',
            ],

            'note' => [
                ...$nullable,
                'string',
                'max:5000',
            ],
        ];
    }

    private function preparePayload(
        array $validated,
        bool $isUpdate
    ): array {
        if (
            array_key_exists(
                'plate',
                $validated
            )
        ) {
            $validated['plate'] =
                mb_strtoupper(
                    trim(
                        $validated['plate']
                    )
                );
        }

        if (
            array_key_exists(
                'vin',
                $validated
            )
        ) {
            $validated['vin'] =
                $validated['vin']
                    ? mb_strtoupper(
                        trim(
                            $validated['vin']
                        )
                    )
                    : null;
        }

        if (
            array_key_exists(
                'operational_status',
                $validated
            )
        ) {
            $validated['is_active'] =
                $validated[
                    'operational_status'
                ] !== 'inactive';
        }

        if (!$isUpdate) {
            $validated[
                'luggage_capacity'
            ] =
                $validated[
                    'luggage_capacity'
                ] ?? 0;

            $validated[
                'current_mileage'
            ] =
                $validated[
                    'current_mileage'
                ] ?? 0;

            $validated[
                'operational_status'
            ] =
                $validated[
                    'operational_status'
                ] ?? 'active';

            $validated['is_active'] =
                $validated[
                    'operational_status'
                ] !== 'inactive';
        }

        return $validated;
    }
}