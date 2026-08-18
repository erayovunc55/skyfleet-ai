<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class SupplierPortalDriverController extends Controller
{
    public function index(
        Request $request
    ): JsonResponse {
        $supplierUser =
            $this->supplierUser(
                $request
            );

        $drivers = User::query()
            ->where(
                'role',
                'driver'
            )
            ->where(
                'supplier_id',
                $supplierUser->supplier_id
            )
            ->with([
                'vehicle:id,supplier_id,plate,brand,model,vehicle_type,is_active,operational_status',
            ])
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $drivers,
        ]);
    }

    public function store(
        Request $request
    ): JsonResponse {
        $supplierUser =
            $this->supplierUser(
                $request
            );

        $validated =
            $request->validate([
                'name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'phone' => [
                    'required',
                    'string',
                    'max:50',
                    'unique:users,phone',
                ],

                'email' => [
                    'nullable',
                    'email',
                    'max:255',
                    'unique:users,email',
                ],

                'password' => [
                    'required',
                    'string',
                    'min:8',
                    'max:255',
                ],

                'vehicle_id' => [
                    'nullable',
                    'integer',
                ],

                'is_active' => [
                    'sometimes',
                    'boolean',
                ],
            ]);

        $vehicle = $this->resolveVehicle(
            $validated['vehicle_id'] ?? null,
            $supplierUser
        );

        $driver = DB::transaction(
            function () use (
                $validated,
                $supplierUser,
                $vehicle
            ): User {
                if ($vehicle) {
                    $this->releaseVehicle(
                        $vehicle,
                        $supplierUser
                    );
                }

                return User::create([
                    'supplier_id' =>
                        $supplierUser
                            ->supplier_id,

                    'vehicle_id' =>
                        $vehicle?->id,

                    'name' =>
                        trim(
                            $validated['name']
                        ),

                    'phone' =>
                        trim(
                            $validated['phone']
                        ),

                    'email' =>
                        !empty(
                            $validated['email']
                        )
                            ? mb_strtolower(
                                trim(
                                    $validated[
                                        'email'
                                    ]
                                )
                            )
                            : null,

                    'password' =>
                        Hash::make(
                            $validated[
                                'password'
                            ]
                        ),

                    'role' =>
                        'driver',

                    'is_active' =>
                        $validated[
                            'is_active'
                        ] ?? true,
                ]);
            }
        );

        return response()->json([
            'message' =>
                'Sürücü başarıyla oluşturuldu.',

            'data' =>
                $driver->load(
                    'vehicle'
                ),
        ], 201);
    }

    public function show(
        Request $request,
        User $driver
    ): JsonResponse {
        $supplierUser =
            $this->supplierUser(
                $request
            );

        $this->ensureDriverOwnership(
            $driver,
            $supplierUser
        );

        return response()->json([
            'data' =>
                $driver->load([
                    'vehicle',
                ]),
        ]);
    }

    public function update(
        Request $request,
        User $driver
    ): JsonResponse {
        $supplierUser =
            $this->supplierUser(
                $request
            );

        $this->ensureDriverOwnership(
            $driver,
            $supplierUser
        );

        $validated =
            $request->validate([
                'name' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:255',
                ],

                'phone' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:50',

                    Rule::unique(
                        'users',
                        'phone'
                    )->ignore(
                        $driver->id
                    ),
                ],

                'email' => [
                    'sometimes',
                    'nullable',
                    'email',
                    'max:255',

                    Rule::unique(
                        'users',
                        'email'
                    )->ignore(
                        $driver->id
                    ),
                ],

                'password' => [
                    'sometimes',
                    'nullable',
                    'string',
                    'min:8',
                    'max:255',
                ],

                'vehicle_id' => [
                    'sometimes',
                    'nullable',
                    'integer',
                ],

                'is_active' => [
                    'sometimes',
                    'boolean',
                ],
            ]);

        $vehicleWasSubmitted =
            array_key_exists(
                'vehicle_id',
                $validated
            );

        $vehicle = $vehicleWasSubmitted
            ? $this->resolveVehicle(
                $validated['vehicle_id'],
                $supplierUser
            )
            : null;

        $updatedDriver =
            DB::transaction(
                function () use (
                    $validated,
                    $supplierUser,
                    $driver,
                    $vehicle,
                    $vehicleWasSubmitted
                ): User {
                    $payload = [];

                    if (
                        array_key_exists(
                            'name',
                            $validated
                        )
                    ) {
                        $payload['name'] =
                            trim(
                                $validated['name']
                            );
                    }

                    if (
                        array_key_exists(
                            'phone',
                            $validated
                        )
                    ) {
                        $payload['phone'] =
                            trim(
                                $validated['phone']
                            );
                    }

                    if (
                        array_key_exists(
                            'email',
                            $validated
                        )
                    ) {
                        $payload['email'] =
                            !empty(
                                $validated['email']
                            )
                                ? mb_strtolower(
                                    trim(
                                        $validated[
                                            'email'
                                        ]
                                    )
                                )
                                : null;
                    }

                    if (
                        !empty(
                            $validated['password']
                            ?? null
                        )
                    ) {
                        $payload['password'] =
                            Hash::make(
                                $validated[
                                    'password'
                                ]
                            );
                    }

                    if (
                        array_key_exists(
                            'is_active',
                            $validated
                        )
                    ) {
                        $payload['is_active'] =
                            $validated[
                                'is_active'
                            ];

                        if (
                            !$validated[
                                'is_active'
                            ]
                        ) {
                            $payload[
                                'vehicle_id'
                            ] = null;
                        }
                    }

                    if (
                        $vehicleWasSubmitted
                    ) {
                        if ($vehicle) {
                            $this
                                ->releaseVehicle(
                                    $vehicle,
                                    $supplierUser,
                                    $driver->id
                                );
                        }

                        $payload[
                            'vehicle_id'
                        ] = $vehicle?->id;
                    }

                    $driver->update(
                        $payload
                    );

                    if (
                        array_key_exists(
                            'is_active',
                            $validated
                        ) &&
                        !$validated[
                            'is_active'
                        ]
                    ) {
                        $driver
                            ->tokens()
                            ->delete();
                    }

                    return $driver
                        ->fresh()
                        ->load(
                            'vehicle'
                        );
                }
            );

        return response()->json([
            'message' =>
                'Sürücü bilgileri güncellendi.',

            'data' =>
                $updatedDriver,
        ]);
    }

    public function assignVehicle(
        Request $request,
        User $driver
    ): JsonResponse {
        $supplierUser =
            $this->supplierUser(
                $request
            );

        $this->ensureDriverOwnership(
            $driver,
            $supplierUser
        );

        $validated =
            $request->validate([
                'vehicle_id' => [
                    'nullable',
                    'integer',
                ],
            ]);

        $vehicle = $this->resolveVehicle(
            $validated['vehicle_id'] ?? null,
            $supplierUser
        );

        DB::transaction(
            function () use (
                $vehicle,
                $supplierUser,
                $driver
            ): void {
                if ($vehicle) {
                    $this->releaseVehicle(
                        $vehicle,
                        $supplierUser,
                        $driver->id
                    );
                }

                $driver->update([
                    'vehicle_id' =>
                        $vehicle?->id,
                ]);
            }
        );

        return response()->json([
            'message' =>
                $vehicle
                    ? 'Araç sürücüye atandı.'
                    : 'Sürücünün araç ataması kaldırıldı.',

            'data' =>
                $driver
                    ->fresh()
                    ->load(
                        'vehicle'
                    ),
        ]);
    }

    public function destroy(
        Request $request,
        User $driver
    ): JsonResponse {
        $supplierUser =
            $this->supplierUser(
                $request
            );

        $this->ensureDriverOwnership(
            $driver,
            $supplierUser
        );

        DB::transaction(
            function () use (
                $driver
            ): void {
                $driver->update([
                    'is_active' =>
                        false,

                    'vehicle_id' =>
                        null,
                ]);

                $driver
                    ->tokens()
                    ->delete();
            }
        );

        return response()->json([
            'message' =>
                'Sürücü pasif duruma alındı.',

            'data' =>
                $driver->fresh(),
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

    private function ensureDriverOwnership(
        User $driver,
        User $supplierUser
    ): void {
        if (
            $driver->role !== 'driver' ||
            (int) $driver->supplier_id !==
                (int) $supplierUser
                    ->supplier_id
        ) {
            abort(
                404,
                'Sürücü bulunamadı.'
            );
        }
    }

    private function resolveVehicle(
        mixed $vehicleId,
        User $supplierUser
    ): ?Vehicle {
        if (
            $vehicleId === null ||
            $vehicleId === ''
        ) {
            return null;
        }

        $vehicle = Vehicle::query()
            ->whereKey($vehicleId)
            ->where(
                'supplier_id',
                $supplierUser->supplier_id
            )
            ->first();

        if (!$vehicle) {
            abort(
                422,
                'Seçilen araç bu tedarikçiye ait değil.'
            );
        }

        if (
            !$vehicle->is_active ||
            $vehicle
                ->operational_status !==
                'active'
        ) {
            abort(
                422,
                'Yalnızca aktif araçlar sürücüye atanabilir.'
            );
        }

        return $vehicle;
    }

    private function releaseVehicle(
        Vehicle $vehicle,
        User $supplierUser,
        ?int $exceptDriverId = null
    ): void {
        User::query()
            ->where(
                'role',
                'driver'
            )
            ->where(
                'supplier_id',
                $supplierUser->supplier_id
            )
            ->where(
                'vehicle_id',
                $vehicle->id
            )
            ->when(
                $exceptDriverId,
                fn ($query) =>
                    $query->where(
                        'id',
                        '!=',
                        $exceptDriverId
                    )
            )
            ->update([
                'vehicle_id' => null,
            ]);
    }
}