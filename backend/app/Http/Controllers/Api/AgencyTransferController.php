<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Services\AirportTaxiPricingService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AgencyTransferController extends Controller
{
    public function __construct(
        private readonly AirportTaxiPricingService $pricing
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isAgencyUser()) {
            return response()->json([
                'message' => 'Acenta hesabına erişim yetkiniz yok.',
            ], 403);
        }

        $transfers = Transfer::query()
            ->where('agency_id', $user->agency_id)
            ->with([
                'supplierCompany:id,company_name',
                'driver:id,name,phone',
                'assignedVehicle:id,plate,brand,model',
            ])
            ->orderByDesc('pickup_time')
            ->paginate(25);

        $transfers->through(
            fn (Transfer $transfer): array => $this->formatTransfer($transfer)
        );

        return response()->json($transfers);
    }

    public function show(Request $request, Transfer $transfer): JsonResponse
    {
        $user = $request->user();

        if (
            !$user
            || !$user->isAgencyUser()
            || (int) $transfer->agency_id !== (int) $user->agency_id
        ) {
            return response()->json([
                'message' => 'Bu transfere erişim yetkiniz yok.',
            ], 403);
        }

        $transfer->load([
            'supplierCompany:id,company_name',
            'driver:id,name,phone',
            'assignedVehicle:id,plate,brand,model',
            'latestEvent',
        ]);

        return response()->json([
            'data' => $this->formatTransfer($transfer),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user()?->load('agencyCompany');

        if (
            !$user
            || !$user->isAgencyUser()
            || !$user->agencyCompany
            || !$user->agencyCompany->isActive()
        ) {
            return response()->json([
                'message' => 'Acenta hesabı aktif değil.',
            ], 403);
        }

        if ($request->filled('display_currency')) {
            $request->merge([
                'display_currency' => strtoupper(
                    trim((string) $request->input('display_currency'))
                ),
            ]);
        }

        $data = $request->validate([
            'quote_token' => ['required', 'string', 'max:12000'],
            'pickup' => ['required', 'string', 'max:500'],
            'pickup_lat' => ['required', 'numeric', 'between:-90,90'],
            'pickup_lng' => ['required', 'numeric', 'between:-180,180'],
            'pickup_location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'dropoff' => ['required', 'string', 'max:500'],
            'dropoff_lat' => ['required', 'numeric', 'between:-90,90'],
            'dropoff_lng' => ['required', 'numeric', 'between:-180,180'],
            'dropoff_location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'pickup_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'pickup_time' => ['required', 'date_format:H:i'],
            'timezone' => ['required', 'timezone'],
            'display_currency' => [
                'required',
                'string',
                Rule::in(config('currency.supported_currencies', ['TRY', 'EUR', 'USD', 'GBP'])),
            ],
            'vehicle_type' => [
                'required',
                'string',
                Rule::in([
                    'standard_car',
                    'executive_car',
                    'luxury_car',
                    'people_carrier',
                    'executive_people_carrier',
                    'large_people_carrier',
                    'minibus',
                ]),
            ],
            'passenger_name' => ['required', 'string', 'max:255'],
            'passenger_phone' => ['required', 'string', 'max:50'],
            'passenger_email' => ['nullable', 'email', 'max:255'],
            'flight_number' => ['nullable', 'string', 'max:50'],
            'adult' => ['nullable', 'integer', 'min:0', 'max:100'],
            'child' => ['nullable', 'integer', 'min:0', 'max:100'],
            'baby' => ['nullable', 'integer', 'min:0', 'max:100'],
            'luggage_count' => ['required', 'integer', 'min:0', 'max:100'],
            'passenger_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $passengers = max(
            1,
            (int) ($data['adult'] ?? 0)
            + (int) ($data['child'] ?? 0)
            + (int) ($data['baby'] ?? 0)
        );

        $snapshot = $this->pricing->validateQuote(
            $data['quote_token'],
            [
                'vehicle_type' => $data['vehicle_type'],
                'passengers' => $passengers,
                'luggage_count' => $data['luggage_count'],
                'pickup_date' => $data['pickup_date'],
                'pickup_time' => $data['pickup_time'],
                'timezone' => $data['timezone'],
                'display_currency' => $data['display_currency'],
                'pickup_lat' => (float) $data['pickup_lat'],
                'pickup_lng' => (float) $data['pickup_lng'],
                'dropoff_lat' => (float) $data['dropoff_lat'],
                'dropoff_lng' => (float) $data['dropoff_lng'],
            ]
        );

        $currentDiscount = round((float) $user->agencyCompany->discount_percent, 2);
        $quotedDiscount = round((float) ($snapshot['agency_discount_percent'] ?? -1), 2);

        if ($quotedDiscount !== $currentDiscount) {
            throw ValidationException::withMessages([
                'quote_token' => 'Acenta fiyat koşulları değişti. Lütfen fiyatı yeniden hesaplayın.',
            ]);
        }

        $pickupAt = CarbonImmutable::parse(
            $data['pickup_date'] . ' ' . $data['pickup_time'],
            $data['timezone']
        );

        $transfer = Transfer::create([
            'agency_id' => $user->agency_id,
            'booking_reference' => $this->generateBookingReference(),
            'ota_source' => 'agency_portal',
            'supplier' => $user->agencyCompany->company_name,
            'passenger_name' => $data['passenger_name'],
            'passenger_phone' => $data['passenger_phone'],
            'passenger_email' => $data['passenger_email'] ?? null,
            'flight_number' => $data['flight_number'] ?? null,
            'pickup' => $data['pickup'],
            'pickup_lat' => $data['pickup_lat'],
            'pickup_lng' => $data['pickup_lng'],
            'pickup_location_id' => $data['pickup_location_id'] ?? null,
            'dropoff' => $data['dropoff'],
            'dropoff_lat' => $data['dropoff_lat'],
            'dropoff_lng' => $data['dropoff_lng'],
            'dropoff_location_id' => $data['dropoff_location_id'] ?? null,
            'pickup_time' => $pickupAt,
            'vehicle_type' => $data['vehicle_type'],
            'adult' => $data['adult'] ?? 0,
            'child' => $data['child'] ?? 0,
            'baby' => $data['baby'] ?? 0,
            'luggage_count' => $data['luggage_count'],
            'passenger_note' => $data['passenger_note'] ?? null,
            'price' => (float) $snapshot['agency_price'],
            'currency' => $snapshot['currency'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Transfer başarıyla oluşturuldu.',
            'data' => $this->formatTransfer($transfer->fresh()),
        ], 201);
    }

    private function formatTransfer(Transfer $transfer): array
    {
        return [
            'id' => $transfer->id,
            'booking_reference' => $transfer->booking_reference,
            'passenger_name' => $transfer->passenger_name,
            'passenger_phone' => $transfer->passenger_phone,
            'passenger_email' => $transfer->passenger_email,
            'flight_number' => $transfer->flight_number,
            'pickup' => $transfer->pickup,
            'dropoff' => $transfer->dropoff,
            'pickup_time' => $transfer->pickup_time?->toISOString(),
            'vehicle_type' => $transfer->vehicle_type,
            'adult' => $transfer->adult,
            'child' => $transfer->child,
            'baby' => $transfer->baby,
            'luggage_count' => $transfer->luggage_count,
            'status' => $transfer->status,
            'price' => $transfer->price,
            'currency' => $transfer->currency,
            'supplier' => $transfer->supplierCompany?->company_name,
            'driver' => $transfer->driver
                ? [
                    'id' => $transfer->driver->id,
                    'name' => $transfer->driver->name,
                    'phone' => $transfer->driver->phone,
                ]
                : null,
            'vehicle' => $transfer->assignedVehicle
                ? [
                    'id' => $transfer->assignedVehicle->id,
                    'plate' => $transfer->assignedVehicle->plate,
                    'brand' => $transfer->assignedVehicle->brand,
                    'model' => $transfer->assignedVehicle->model,
                ]
                : null,
            'tracking_url' => $transfer->publicTrackingUrl(),
            'passenger_note' => $transfer->passenger_note,
            'created_at' => $transfer->created_at?->toISOString(),
        ];
    }

    private function generateBookingReference(): string
    {
        do {
            $reference = sprintf(
                'AG-%s-%s',
                now()->format('Y'),
                strtoupper(Str::random(6))
            );
        } while (
            Transfer::query()
                ->where('booking_reference', $reference)
                ->exists()
        );

        return $reference;
    }
}
