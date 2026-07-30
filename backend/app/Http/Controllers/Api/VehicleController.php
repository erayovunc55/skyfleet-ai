<?php

namespace App\Http\Controllers\Api;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VehicleController extends Controller
{
    public function index(): JsonResponse
    {
        $vehicles = Vehicle::query()
            ->orderByDesc('is_active')
            ->orderBy('operational_status')
            ->orderBy('plate')
            ->get();

        return response()->json([
            'data' => $vehicles,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(
            $this->validationRules()
        );

        $vehicle = Vehicle::create(
            $this->preparePayload($validated)
        );

        return response()->json([
            'message' => 'Araç başarıyla oluşturuldu.',
            'data' => $vehicle,
        ], 201);
    }

    public function show(Vehicle $vehicle): JsonResponse
    {
        return response()->json([
            'data' => $vehicle,
        ]);
    }

    public function update(
        Request $request,
        Vehicle $vehicle
    ): JsonResponse {
        $validated = $request->validate(
            $this->validationRules(
                vehicle: $vehicle,
                isUpdate: true
            )
        );

        $payload = $this->preparePayload(
            $validated,
            isUpdate: true
        );

        $vehicle->update($payload);

        return response()->json([
            'message' => 'Araç başarıyla güncellendi.',
            'data' => $vehicle->fresh(),
        ]);
    }
public function changeStatus(
    Request $request,
    Vehicle $vehicle
): JsonResponse {

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

    $vehicle->update([
        'operational_status' =>
            $validated['operational_status'],

        'is_active' =>
            $validated['operational_status']
            !== 'inactive',
    ]);

    return response()->json([
        'message' => 'Araç durumu güncellendi.',
        'data' => $vehicle->fresh(),
    ]);
}
public function uploadPhoto(
    Request $request,
    Vehicle $vehicle
): JsonResponse {
    $validated = $request->validate([
        'photo' => [
            'required',
            'image',
            'mimes:jpg,jpeg,png,webp',
            'max:5120',
        ],
    ]);

    if (
        $vehicle->photo_path &&
        Storage::disk('public')->exists(
            $vehicle->photo_path
        )
    ) {
        Storage::disk('public')->delete(
            $vehicle->photo_path
        );
    }

    $photoPath = $validated['photo']->store(
        'vehicles',
        'public'
    );

    $vehicle->update([
        'photo_path' => $photoPath,
    ]);

    return response()->json([
        'message' => 'Araç fotoğrafı güncellendi.',
        'data' => [
            'vehicle' => $vehicle->fresh(),
            'photo_url' => asset(
                'storage/' . $photoPath
            ),
        ],
    ]);
}
    public function destroy(
        Vehicle $vehicle
    ): JsonResponse {
        $vehicle->update([
            'is_active' => false,
            'operational_status' => 'inactive',
        ]);

        return response()->json([
            'message' => 'Araç pasif duruma alındı.',
            'data' => $vehicle->fresh(),
        ]);
    }

    private function validationRules(
        ?Vehicle $vehicle = null,
        bool $isUpdate = false
    ): array {
        $requiredRule = $isUpdate
            ? ['sometimes', 'required']
            : ['required'];

        $nullableRule = $isUpdate
            ? ['sometimes', 'nullable']
            : ['nullable'];

        return [
            'plate' => [
                ...$requiredRule,
                'string',
                'max:20',
                Rule::unique('vehicles', 'plate')
                    ->ignore($vehicle?->id),
            ],

            'brand' => [
                ...$requiredRule,
                'string',
                'max:100',
            ],

            'model' => [
                ...$requiredRule,
                'string',
                'max:100',
            ],

            'year' => [
                ...$nullableRule,
                'integer',
                'min:1950',
                'max:' . (now()->year + 1),
            ],

            'vehicle_type' => [
                ...$requiredRule,
                'string',
                'max:100',
            ],

            'color' => [
                ...$nullableRule,
                'string',
                'max:50',
            ],

            'passenger_capacity' => [
                ...$requiredRule,
                'integer',
                'min:1',
                'max:100',
            ],

            'luggage_capacity' => [
                ...$nullableRule,
                'integer',
                'min:0',
                'max:100',
            ],

            'vin' => [
                ...$nullableRule,
                'string',
                'max:50',
                Rule::unique('vehicles', 'vin')
                    ->ignore($vehicle?->id),
            ],

            'registration_number' => [
                ...$nullableRule,
                'string',
                'max:100',
            ],

            'insurance_expiry_date' => [
                ...$nullableRule,
                'date',
            ],

            'inspection_expiry_date' => [
                ...$nullableRule,
                'date',
            ],

            'casco_expiry_date' => [
                ...$nullableRule,
                'date',
            ],

            'emission_expiry_date' => [
                ...$nullableRule,
                'date',
            ],

            'next_maintenance_date' => [
                ...$nullableRule,
                'date',
            ],

            'current_mileage' => [
                ...($isUpdate
                    ? ['sometimes']
                    : ['nullable']),
                'integer',
                'min:0',
            ],

            'last_maintenance_mileage' => [
                ...$nullableRule,
                'integer',
                'min:0',
            ],

            'next_maintenance_mileage' => [
                ...$nullableRule,
                'integer',
                'min:0',
            ],

            'operational_status' => [
                ...($isUpdate
                    ? ['sometimes']
                    : ['nullable']),
                Rule::in([
                    'active',
                    'service',
                    'faulty',
                    'inactive',
                ]),
            ],

            'photo_path' => [
                ...$nullableRule,
                'string',
                'max:2048',
            ],

            'is_active' => [
                ...($isUpdate
                    ? ['sometimes']
                    : ['nullable']),
                'boolean',
            ],

            'note' => [
                ...$nullableRule,
                'string',
                'max:5000',
            ],
        ];
    }

    private function preparePayload(
        array $validated,
        bool $isUpdate = false
    ): array {
        if (array_key_exists('plate', $validated)) {
            $validated['plate'] = mb_strtoupper(
                trim($validated['plate'])
            );
        }

        if (array_key_exists('vin', $validated)) {
            $validated['vin'] = $validated['vin']
                ? mb_strtoupper(trim($validated['vin']))
                : null;
        }

        if (
            array_key_exists(
                'operational_status',
                $validated
            )
        ) {
            $validated['is_active'] =
                $validated['operational_status']
                !== 'inactive';
        }

        if (!$isUpdate) {
            $validated['luggage_capacity'] =
                $validated['luggage_capacity'] ?? 0;

            $validated['current_mileage'] =
                $validated['current_mileage'] ?? 0;

            $validated['operational_status'] =
                $validated['operational_status']
                ?? 'active';

            $validated['is_active'] =
                $validated['operational_status']
                !== 'inactive';
        }

        return $validated;
    }
}